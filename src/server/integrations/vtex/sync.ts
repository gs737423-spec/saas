import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { claimSyncLock, releaseSyncLock } from '../syncLock.js'
import { logSyncEvent } from '../syncLog.js'
import { persistCanonicalOrder } from '../orderIdentity.js'
import { VtexApiError } from './errors.js'
import { VtexClient } from './client.js'
import { credentialsFromConnection, loadVtexConnection } from './connection.js'
import { loadVtexChannelMappings, persistVtexChannelResolution, type VtexChannelResolutionCache } from './channelRegistry.js'
import { flattenVtexCategories, normalizeVtexOrder, normalizeVtexSku } from './normalize.js'
import { normalizeVtexChannelMappings } from './validation.js'
import { assertVtexCircuitClosed, isVtexSyncDue, nextVtexFailureState, nextVtexSyncAt, VtexSyncNotDueError } from './schedule.js'
import type { VtexSyncCheckpoint, VtexSyncCounts } from './types.js'

const SKU_BATCH_SIZE = 40
const ORDER_PAGE_SIZE = 30
const MAX_ORDER_PAGES_PER_RUN = 30
const ORDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const MIN_ORDER_WINDOW_MS = 60 * 60 * 1000
const INCREMENTAL_OVERLAP_MS = 15 * 60 * 1000

/** Histórico da primeira sincronização — nunca mais 12 meses de uma vez
 *  (era `HISTORY_DAYS = 365`, causa raiz de primeiras cargas gigantes).
 *  3 meses é o padrão; 6 é o teto que a UI oferece como opção — histórico
 *  maior que isso precisaria virar backfill assíncrono separado, não faz
 *  parte desta run. */
export const DEFAULT_HISTORY_MONTHS = 3
export const MAX_INITIAL_HISTORY_MONTHS = 6
const DAY_MS = 24 * 60 * 60 * 1000

export function resolveVtexHistoryMonths(providerMetadata: Record<string, unknown> | null | undefined): number {
  const raw = Number((providerMetadata as { historyMonths?: unknown } | null | undefined)?.historyMonths)
  if (!Number.isFinite(raw) || raw <= 0) return DEFAULT_HISTORY_MONTHS
  return Math.min(MAX_INITIAL_HISTORY_MONTHS, Math.max(1, Math.round(raw)))
}

/** Concorrência limitada pro estágio de pedidos/SKUs — bem menor que o
 *  Mercado Livre (8): cada pedido VTEX já dispara ~1 chamada HTTP externa +
 *  vários round-trips de Supabase (resolução de canal + reconciliação
 *  canônica), então o gargalo real é o Postgres, não só a API da VTEX. */
const ORDER_CONCURRENCY = 4
const SKU_CONCURRENCY = 5

/** Orçamento de tempo por invocação — bem abaixo do `maxDuration: 300` da
 *  function (api/cron/sync-vtex.ts, api/integrations/vtex/sync.ts), pra
 *  sempre sobrar margem de checar o orçamento, persistir checkpoint e
 *  responder HTTP antes da Vercel matar o processo no meio de um `await`
 *  (era exatamente isso que deixava a run presa pra sempre em `running`
 *  sem erro nenhum registrado). */
const RUN_TIME_BUDGET_MS = 210_000

/** Run sem heartbeat por mais que isso é considerada abandonada — nunca
 *  fica "sincronizando" pra sempre esperando um UPDATE manual no banco. */
export const HEARTBEAT_STALE_MINUTES = 5
const MAX_STALE_RECOVERIES = 5

/** State machine explícita dos estágios (era só string solta comparada em
 *  `if (run.stage === '...')`) — centralizado aqui pra quem ler o código
 *  achar a ordem real sem precisar grepar todos os `if`. Os `if` continuam
 *  sequenciais por estágio (não um switch) porque cada estágio pode "cair"
 *  no próximo dentro da mesma invocação quando termina dentro do orçamento
 *  de tempo — não são branches exclusivos. */
export const VTEX_SYNC_STAGES = ['queued', 'validate', 'categories', 'catalog', 'orders', 'finalize', 'complete'] as const
export type VtexSyncStage = typeof VTEX_SYNC_STAGES[number]
export const VTEX_SYNC_TERMINAL_STATUSES = ['success', 'partial', 'failed', 'cancelled'] as const
export type VtexSyncTerminalStatus = typeof VTEX_SYNC_TERMINAL_STATUSES[number]

const EMPTY_COUNTS: VtexSyncCounts = {
  categoriesFetched: 0, productsFetched: 0, skusFetched: 0, pricesFetched: 0,
  inventoriesFetched: 0, ordersFetched: 0, ordersInserted: 0, ordersUpdated: 0,
  ordersDeduplicated: 0, channelsDiscovered: 0, channelsResolved: 0,
  channelsUnresolved: 0, errors: 0,
}

interface SyncRunRow {
  id: string
  company_id: string
  connection_id: string
  mode: 'full' | 'incremental'
  status: string
  stage: string
  checkpoint: VtexSyncCheckpoint | null
  counts: Partial<VtexSyncCounts> | null
  errors: string[] | null
}

function mergeCounts(value: Partial<VtexSyncCounts> | null | undefined): VtexSyncCounts {
  return { ...EMPTY_COUNTS, ...(value ?? {}) }
}

function sanitizedError(error: unknown): string {
  if (error instanceof VtexApiError) return `${error.code}:${error.status}:${error.path}`.slice(0, 500)
  return (error instanceof Error ? error.message : 'Unknown VTEX sync error').replace(/X-VTEX-API-App(?:Key|Token)[^\s]*/gi, '[REDACTED]').slice(0, 500)
}

/** Todo patch passa por aqui — inclusive os de status/stage — então o
 *  heartbeat fica sempre atualizado sem precisar lembrar de tocá-lo em
 *  cada call site. É o sinal de vida que `reclaimStaleVtexRun` usa pra
 *  decidir se uma run `running` ainda está sendo processada de verdade. */
async function updateRun(supabase: SupabaseClient, run: SyncRunRow, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('integration_sync_runs')
    .update({ ...patch, last_heartbeat_at: new Date().toISOString() })
    .eq('id', run.id).eq('company_id', run.company_id).eq('connection_id', run.connection_id)
  if (error) throw new Error(`Failed to update VTEX sync run: ${error.message}`)
}

/** Detecta e recupera uma run travada ANTES de decidir se cria uma nova ou
 *  reaproveita a ativa — chamado sempre que alguém tenta sincronizar
 *  (cron ou manual), então a plataforma se autocura sem UPDATE manual.
 *
 *  Recuperação = retomar o MESMO run (nunca perde checkpoint/contadores já
 *  processados): status volta pra `queued`, quem chamou segue o fluxo
 *  normal e o processamento resume exatamente do `stage`/`checkpoint`
 *  salvos. A exclusividade da transição continua garantida pelo próprio
 *  UPDATE condicional (`eq('status','running')`) — é uma única instrução
 *  atômica no Postgres, não depende de índice nem de lock separado: se
 *  duas invocações tentarem reclamar a mesma run ao mesmo tempo, só uma
 *  afeta a linha (a outra recebe 0 linhas de volta).
 *
 *  Depois de `MAX_STALE_RECOVERIES` tentativas travadas seguidas, desiste
 *  de verdade e marca `failed` — evita loop infinito numa run que trava
 *  sempre no mesmo ponto por dado corrompido. */
export async function reclaimStaleVtexRun(supabase: SupabaseClient, companyId: string, connectionId: string): Promise<void> {
  const staleBefore = new Date(Date.now() - HEARTBEAT_STALE_MINUTES * 60 * 1000).toISOString()
  // `last_heartbeat_at.lt.X` sozinho nunca casa linhas com heartbeat NULL —
  // em Postgres/PostgREST, `NULL < X` é `unknown`, não `true`. A migration
  // 020 faz backfill de todas as linhas existentes no momento da aplicação,
  // então isso não deveria acontecer em runs criadas depois — mas não dá pra
  // confiar só nisso pra sempre (INSERT manual, migração futura que reabra a
  // coluna, etc.), então tratamos NULL explicitamente aqui: candidatos são
  // linhas com heartbeat velho OU heartbeat nulo, e uma linha com heartbeat
  // nulo só é considerada de fato stale se `updated_at`/`started_at`/
  // `created_at` (nessa ordem de preferência) também forem antigos — nunca
  // reclama uma run `running` recém-criada só porque ainda não gravou heartbeat.
  const { data: candidate, error } = await supabase.from('integration_sync_runs')
    .select('id, checkpoint, stage, last_heartbeat_at, updated_at, started_at, created_at')
    .eq('company_id', companyId).eq('connection_id', connectionId).eq('status', 'running')
    .or(`last_heartbeat_at.is.null,last_heartbeat_at.lt.${staleBefore}`)
    .maybeSingle()
  if (error || !candidate) return
  const lastActivity = candidate.last_heartbeat_at ?? candidate.updated_at ?? candidate.started_at ?? candidate.created_at
  if (!lastActivity || lastActivity >= staleBefore) return // heartbeat nulo mas linha recente: não é stale de verdade
  const stale = candidate

  const checkpoint = (stale.checkpoint ?? {}) as VtexSyncCheckpoint & { staleRecoveries?: number }
  const staleRecoveries = Number(checkpoint.staleRecoveries ?? 0) + 1
  const giveUp = staleRecoveries > MAX_STALE_RECOVERIES

  const { data: reclaimed } = await supabase.from('integration_sync_runs')
    .update(giveUp
      ? { status: 'failed', completed_at: new Date().toISOString(), last_heartbeat_at: new Date().toISOString() }
      : { status: 'queued', checkpoint: { ...checkpoint, staleRecoveries }, last_heartbeat_at: new Date().toISOString() })
    .eq('id', stale.id).eq('status', 'running')
    .or(`last_heartbeat_at.is.null,last_heartbeat_at.lt.${staleBefore}`)
    .select('id')
  if (!reclaimed || reclaimed.length === 0) return // outra invocação já reclamou primeiro

  await supabase.from('marketplace_connections').update({ sync_started_at: null }).eq('id', connectionId).eq('company_id', companyId)
  await logSyncEvent({
    companyId, connectionId, provider: 'vtex', eventType: 'sync_stage',
    status: giveUp ? 'error' : 'info',
    message: giveUp ? 'VTEX sync abandoned after repeated stale recoveries' : 'VTEX sync stale run recovered, resuming from checkpoint',
    payload: { code: 'SYNC_STALE', stage: stale.stage, recoverable: !giveUp, staleRecoveries },
  })
  if (giveUp) {
    await supabase.from('marketplace_connections').update({ status: 'requires_attention', last_error: 'VTEX_SYNC_STALE' }).eq('id', connectionId).eq('company_id', companyId).neq('status', 'disconnected')
  }
}

/** Roda `handler` sobre `items` em lotes concorrentes limitados (nunca
 *  `Promise.all` ilimitado). Depois de cada lote: persiste checkpoint via
 *  `onBatch` (heartbeat + progresso real pro frontend) e checa o orçamento
 *  de tempo — estoura, para e devolve o que já processou, sem nunca
 *  segurar a invocação até a Vercel matar o processo no meio. */
export async function runBudgetedBatches<T>(
  items: T[],
  concurrency: number,
  deadline: number,
  handler: (item: T) => Promise<void>,
  onBatch: (processedInThisCall: number) => Promise<void>,
): Promise<{ processedCount: number; timedOut: boolean }> {
  let processedCount = 0
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    await Promise.allSettled(chunk.map((item) => handler(item)))
    processedCount += chunk.length
    await onBatch(processedCount)
    if (Date.now() >= deadline) return { processedCount, timedOut: true }
  }
  return { processedCount, timedOut: false }
}

export async function queueVtexSync(companyId: string, mode: 'full' | 'incremental', trigger: 'auto' | 'manual'): Promise<SyncRunRow> {
  const supabase = await getSupabaseAdmin()
  const connection = await loadVtexConnection(companyId)
  assertVtexCircuitClosed(connection.circuit_open_until)
  if (trigger === 'auto' && !isVtexSyncDue(connection.next_sync_at)) throw new VtexSyncNotDueError()
  await reclaimStaleVtexRun(supabase, companyId, connection.id)
  const { data: active } = await supabase.from('integration_sync_runs').select('*')
    .eq('company_id', companyId).eq('connection_id', connection.id).in('status', ['queued', 'running']).maybeSingle()
  if (active) return active as SyncRunRow
  const { data, error } = await supabase.from('integration_sync_runs').insert({ company_id: companyId, connection_id: connection.id, provider: 'vtex', mode, status: 'queued', stage: 'validate', counts: EMPTY_COUNTS, checkpoint: {} }).select('*').single()
  if (error) throw new Error(`Failed to queue VTEX sync: ${error.message}`)
  await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_queued', status: 'info', message: `VTEX ${mode} sync queued` })
  return data as SyncRunRow
}

export async function processVtexSyncRun(companyId: string, runId: string): Promise<SyncRunRow> {
  const supabase = await getSupabaseAdmin()
  const connection = await loadVtexConnection(companyId)
  const { data, error } = await supabase.from('integration_sync_runs').select('*').eq('id', runId).eq('company_id', companyId).eq('connection_id', connection.id).single()
  if (error || !data) throw new Error('VTEX_SYNC_RUN_NOT_FOUND')
  const run = data as SyncRunRow
  if (['success', 'partial', 'failed'].includes(run.status)) return run

  await claimSyncLock(supabase, companyId, connection.id, new Date())
  const counts = mergeCounts(run.counts)
  const checkpoint = run.checkpoint ?? {}
  const errors = [...(run.errors ?? [])]
  const deadline = Date.now() + RUN_TIME_BUDGET_MS

  try {
    const client = new VtexClient(credentialsFromConnection(connection))
    await updateRun(supabase, run, { status: 'running', started_at: new Date().toISOString() })
    await supabase.from('marketplace_connections').update({ status: 'syncing', last_error: null }).eq('id', connection.id).eq('company_id', companyId)

    if (run.stage === 'validate') {
      await client.getCategoryTree(1)
      run.stage = 'categories'
      await updateRun(supabase, run, { stage: run.stage })
    }

    if (run.stage === 'categories') {
      const categories = flattenVtexCategories(await client.getCategoryTree(10))
      if (categories.length > 0) {
        const { error: categoryError } = await supabase.from('marketplace_categories').upsert(categories.map((category) => ({
          company_id: companyId, connection_id: connection.id, provider: 'vtex',
          external_category_id: category.externalCategoryId, parent_external_id: category.parentExternalId,
          name: category.name, path: category.path, level: category.level, active: true, last_seen_at: new Date().toISOString(),
        })), { onConflict: 'company_id,connection_id,external_category_id' })
        if (categoryError) throw new Error(`Failed to persist VTEX categories: ${categoryError.message}`)
      }
      counts.categoriesFetched = categories.length
      run.stage = 'catalog'
      await updateRun(supabase, run, { stage: run.stage, counts })
    }

    if (run.stage === 'catalog') {
      const skuIds = await client.getSkuIds()
      checkpoint.skuTotal = skuIds.length
      const start = Number(checkpoint.skuOffset ?? 0)
      const batch = skuIds.slice(start, start + SKU_BATCH_SIZE)
      await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX catalog batch started', payload: { stage: 'catalog', batchSize: batch.length, offset: start, total: skuIds.length } })
      const batchStartedAt = Date.now()
      const { processedCount, timedOut } = await runBudgetedBatches(batch, SKU_CONCURRENCY, deadline, async (skuId) => {
        try {
          const sku = await client.getSku(skuId)
          const [priceResult, inventoryResult] = await Promise.allSettled([client.getPrice(skuId), client.getInventory(skuId)])
          const price = priceResult.status === 'fulfilled' ? priceResult.value : null
          const inventory = inventoryResult.status === 'fulfilled' ? inventoryResult.value : null
          if (price) counts.pricesFetched += 1
          if (inventory) counts.inventoriesFetched += 1
          const normalized = normalizeVtexSku(sku, price, inventory)
          const { error: productError } = await supabase.from('marketplace_products').upsert({ company_id: companyId, connection_id: connection.id, provider: 'vtex', ...normalized.product }, { onConflict: 'company_id,connection_id,external_product_id' })
          if (productError) throw new Error(productError.message)
          const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert({ company_id: companyId, connection_id: connection.id, provider: 'vtex', last_sync_at: new Date().toISOString(), ...normalized.inventory }, { onConflict: 'company_id,connection_id,external_product_id' })
          if (inventoryError) throw new Error(inventoryError.message)
          if (normalized.warehouseRows.length > 0) {
            const { error: warehouseError } = await supabase.from('marketplace_inventory_sources').upsert(normalized.warehouseRows.map((row) => ({ company_id: companyId, connection_id: connection.id, provider: 'vtex', last_sync_at: new Date().toISOString(), ...row })), { onConflict: 'company_id,connection_id,external_product_id,warehouse_id' })
            if (warehouseError) throw new Error(warehouseError.message)
          }
          counts.skusFetched += 1
          counts.productsFetched += 1
        } catch (itemError) {
          counts.errors += 1
          errors.push(`SKU ${skuId}: ${sanitizedError(itemError)}`)
        }
      }, async (processedInThisCall) => {
        // Checkpoint parcial dentro do próprio lote — se o orçamento estourar
        // no meio, o offset avança só até onde de fato processou, nunca fica
        // "processando" sem nada persistido.
        await updateRun(supabase, run, { checkpoint: { ...checkpoint, skuOffset: start + processedInThisCall }, counts, errors: errors.slice(-100) })
      })
      checkpoint.skuOffset = start + processedCount
      await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX catalog batch completed', payload: { stage: 'catalog', processed: processedCount, totalProcessed: checkpoint.skuOffset, durationMs: Date.now() - batchStartedAt } })
      if (timedOut || checkpoint.skuOffset < skuIds.length) {
        // Yield controlado (orçamento de tempo, não travamento) — devolve
        // `queued` em vez de `running`: o cron roda a cada 15min, bem acima
        // de HEARTBEAT_STALE_MINUTES=5, então uma run `running` recém-yieldada
        // seria erroneamente vista como stale pelo próximo `reclaimStaleVtexRun`
        // antes do cron legítimo conseguir retomá-la. `queued` fica fora do
        // alcance do reclaim (que só olha `status = 'running'`) e o próximo
        // tick do cron a resume normalmente pelo checkpoint salvo.
        await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
        return { ...run, checkpoint, counts, errors, status: 'queued' }
      }
      run.stage = 'orders'
      checkpoint.orderPage = checkpoint.orderPage ?? 1
      await updateRun(supabase, run, { stage: run.stage, checkpoint, counts, errors: errors.slice(-100) })
    }

    if (run.stage === 'orders') {
      const providerMetadata = connection.provider_metadata ?? {}
      const configuredMappings = normalizeVtexChannelMappings(providerMetadata.channelMappings ?? {})
      const mappings = await loadVtexChannelMappings(supabase, companyId, connection.id, configuredMappings)
      const channelResolutionCache: VtexChannelResolutionCache = new Map()
      const initialFrom = run.mode === 'incremental' && connection.last_success_at
        ? new Date(new Date(connection.last_success_at).getTime() - INCREMENTAL_OVERLAP_MS)
        : new Date(Date.now() - resolveVtexHistoryMonths(providerMetadata) * 30 * DAY_MS)
      const targetEnd = checkpoint.orderTargetEnd ? new Date(checkpoint.orderTargetEnd) : new Date()
      const windowStart = checkpoint.orderWindowStart ? new Date(checkpoint.orderWindowStart) : initialFrom
      let windowEnd = checkpoint.orderWindowEnd
        ? new Date(checkpoint.orderWindowEnd)
        : new Date(Math.min(windowStart.getTime() + ORDER_WINDOW_MS, targetEnd.getTime()))
      checkpoint.orderWindowStart = windowStart.toISOString()
      checkpoint.orderWindowEnd = windowEnd.toISOString()
      checkpoint.orderTargetEnd = targetEnd.toISOString()
      checkpoint.orderHistoryStart = checkpoint.orderHistoryStart ?? initialFrom.toISOString()
      let page = Number(checkpoint.orderPage ?? 1)
      let pagesProcessed = 0
      let totalPages = page
      let sourceTotalPages = page
      let ranOutOfTime = false
      do {
        const filterName = run.mode === 'incremental' ? 'f_lastChange' : 'f_creationDate'
        const filterField = run.mode === 'incremental' ? 'lastChange' : 'creationDate'
        const dateFilter = `${filterField}:[${windowStart.toISOString()} TO ${windowEnd.toISOString()}]`
        const pageStartedAt = Date.now()
        const list = await client.listOrders(`orderBy=creationDate,asc&page=${page}&per_page=${ORDER_PAGE_SIZE}&${filterName}=${encodeURIComponent(dateFilter)}`)
        sourceTotalPages = Number(list.paging?.pages ?? page)
        if (page === 1 && sourceTotalPages > MAX_ORDER_PAGES_PER_RUN && windowEnd.getTime() - windowStart.getTime() > MIN_ORDER_WINDOW_MS) {
          windowEnd = new Date(windowStart.getTime() + Math.floor((windowEnd.getTime() - windowStart.getTime()) / 2))
          checkpoint.orderWindowEnd = windowEnd.toISOString()
          checkpoint.orderPage = 1
          await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
          return { ...run, checkpoint, counts, errors, status: 'queued' }
        }
        totalPages = Math.min(sourceTotalPages, MAX_ORDER_PAGES_PER_RUN)
        await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX order page started', payload: { stage: 'orders', windowStart: checkpoint.orderWindowStart, windowEnd: checkpoint.orderWindowEnd, page, items: (list.list ?? []).length } })

        // Concorrência limitada (era 100% sequencial: 1 pedido = 1 chamada
        // HTTP à VTEX + ~5-10 round-trips de Supabase, em série — para uma
        // página de 30 isso sozinho já estourava o maxDuration da function
        // sem nunca devolver resposta. Cada lote também persiste checkpoint
        // e checa o orçamento de tempo, então uma página nunca fica "presa":
        // se estourar no meio, volta `running` com o que já foi processado
        // (reprocessar a mesma página no próximo tick é seguro — os upserts
        // downstream são idempotentes por company_id+connection_id+external id).
        const { timedOut } = await runBudgetedBatches(list.list ?? [], ORDER_CONCURRENCY, deadline, async (summary) => {
          try {
            const order = await client.getOrder(summary.orderId)
            const normalized = normalizeVtexOrder(order, mappings)
            const channel = await persistVtexChannelResolution(supabase, companyId, connection.id, normalized, channelResolutionCache)
            if (channel.discovered) {
              counts.channelsDiscovered += 1
              if (channel.resolved) counts.channelsResolved += 1
              else counts.channelsUnresolved += 1
              await logSyncEvent({
                companyId, connectionId: connection.id, provider: 'vtex', eventType: 'channel_discovered', status: 'info',
                message: normalized.channelResolutionStatus === 'resolved' ? 'VTEX channel resolved' : 'VTEX channel discovered for mapping review',
                payload: {
                  affiliateId: normalized.affiliateId,
                  externalSalesChannel: normalized.externalSalesChannel,
                  channelKey: normalized.channel,
                  resolutionStatus: normalized.channelResolutionStatus,
                },
              })
            }
            const persisted = await persistCanonicalOrder(supabase, {
              companyId, connectionId: connection.id, provider: 'vtex', sourceAccount: connection.external_account_id,
              externalOrderId: normalized.externalOrderId, marketplaceOrderId: normalized.marketplaceOrderId,
              affiliateId: normalized.affiliateId, externalSalesChannel: normalized.externalSalesChannel,
              externalMarketplaceName: normalized.externalMarketplaceName,
              channelResolutionStatus: normalized.channelResolutionStatus, canonicalOrderKey: normalized.canonicalOrderKey,
              salesChannel: normalized.channel, salesChannelDisplayName: normalized.channelDisplayName,
              salesChannelType: normalized.channelType, status: normalized.status, totalAmount: normalized.totalAmount,
              feeAmount: normalized.feeAmount, currency: normalized.currency, orderedAt: normalized.orderedAt,
              sourceUpdatedAt: normalized.sourceUpdatedAt, analyticsIncluded: normalized.analyticsIncluded,
              unavailableReason: normalized.unavailableReason,
              items: normalized.items.map((item) => ({ external_product_id: item.externalProductId, sku: item.sku, title: item.title, quantity: item.quantity, unit_price: item.unitPrice })),
            })
            counts.ordersFetched += 1
            if (persisted.inserted) counts.ordersInserted += 1
            else counts.ordersUpdated += 1
            if (persisted.deduplicated) counts.ordersDeduplicated += 1
          } catch (orderError) {
            counts.errors += 1
            errors.push(`Order ${summary.orderId}: ${sanitizedError(orderError)}`)
          }
        }, async () => {
          // Heartbeat + contadores reais a cada lote, SEM avançar orderPage —
          // se estourar o orçamento no meio da página, o próximo tick refaz
          // só esta página (idempotente), nunca perde o que já foi salvo.
          await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
        })
        await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX order page completed', payload: { stage: 'orders', page, totalProcessed: counts.ordersFetched, durationMs: Date.now() - pageStartedAt, timedOut } })
        if (timedOut) { ranOutOfTime = true; break }

        page += 1
        pagesProcessed += 1
        checkpoint.orderPage = page
        await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
      } while (page <= totalPages && pagesProcessed < MAX_ORDER_PAGES_PER_RUN)
      if (ranOutOfTime) {
        await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
        return { ...run, checkpoint, counts, errors, status: 'queued' }
      }
      if (sourceTotalPages > MAX_ORDER_PAGES_PER_RUN) {
        counts.errors += 1
        errors.push(`An hourly order window exceeded the VTEX ${MAX_ORDER_PAGES_PER_RUN}-page API limit and was preserved as partial.`)
      } else if (windowEnd.getTime() < targetEnd.getTime()) {
        const nextStart = windowEnd
        const nextEnd = new Date(Math.min(nextStart.getTime() + ORDER_WINDOW_MS, targetEnd.getTime()))
        checkpoint.orderWindowStart = nextStart.toISOString()
        checkpoint.orderWindowEnd = nextEnd.toISOString()
        checkpoint.orderPage = 1
        await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
        return { ...run, checkpoint, counts, errors, status: 'queued' }
      }
      run.stage = 'finalize'
      await updateRun(supabase, run, { stage: 'finalize', checkpoint, counts, errors: errors.slice(-100) })
    }

    const completedAt = new Date().toISOString()
    const finalStatus = errors.length > 0 ? 'partial' : 'success'
    await updateRun(supabase, run, { status: finalStatus, stage: 'complete', counts, errors: errors.slice(-100), completed_at: completedAt })
    await supabase.from('marketplace_connections').update({
      status: errors.length > 0 ? 'requires_attention' : 'connected',
      last_sync_at: completedAt,
      ...(errors.length === 0 ? { last_success_at: completedAt } : {}),
      next_sync_at: nextVtexSyncAt(new Date(completedAt)),
      last_error: errors[0] ?? null,
      failure_count: 0,
      circuit_open_until: null,
    }).eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected')
    await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: errors.length > 0 ? 'sync_partial' : 'sync_success', status: errors.length > 0 ? 'error' : 'success', message: errors.length > 0 ? 'VTEX sync completed with item errors' : 'VTEX sync completed', payload: { ...counts } })
    return { ...run, status: finalStatus, stage: 'complete', counts, errors }
  } catch (error) {
    const message = sanitizedError(error)
    const { failureCount, circuitOpenUntil } = nextVtexFailureState(Number(connection.failure_count ?? 0))
    await updateRun(supabase, run, { status: 'failed', errors: [...errors, message].slice(-100), completed_at: new Date().toISOString() })
    await supabase.from('marketplace_connections').update({ status: error instanceof VtexApiError && [401, 403].includes(error.status) ? 'requires_attention' : 'error', last_error: message, failure_count: failureCount, circuit_open_until: circuitOpenUntil }).eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected')
    await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_error', status: 'error', message: 'VTEX sync failed', payload: { code: error instanceof VtexApiError ? error.code : 'VTEX_SYNC_FAILED', stage: run.stage } })
    throw error
  } finally {
    await releaseSyncLock(supabase, companyId, connection.id)
  }
}
