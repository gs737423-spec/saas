import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { claimSyncLock, releaseSyncLock } from '../syncLock.js'
import { logSyncEvent } from '../syncLog.js'
import { persistCanonicalOrder } from '../orderIdentity.js'
import { reconcileCatalogRows } from '../catalogReconciliation.js'
import { VtexApiError } from './errors.js'
import { VtexClient } from './client.js'
import { credentialsFromConnection, loadVtexConnection } from './connection.js'
import { autoResolveVtexAffiliatesFromRegistry, autoResolveVtexAffiliatesFromSalesChannels, autoResolveVtexSalesChannelsFromRegistry, ensureBaseSalesChannels, loadVtexChannelMappings, persistVtexChannelResolution, type VtexChannelResolutionCache } from './channelRegistry.js'
import { buildVtexRunConfig, normalizeVtexCheckpoint, vtexCatalogNeedsRevalidation, VTEX_CATALOG_DISCOVERY_VERSION, VTEX_CHECKPOINT_VERSION } from './checkpoint.js'
import { flattenVtexCategories, normalizeVtexOrder, normalizeVtexSku, priceFromComputedVtexPolicies } from './normalize.js'
import { normalizeVtexChannelMappings } from './validation.js'
import { findCanonicalChannel } from './channelResolution.js'
import { assertVtexCircuitClosed, isVtexSyncDue, nextVtexFailureState, nextVtexSyncAt, VtexSyncNotDueError } from './schedule.js'
import type { VtexSyncCheckpoint, VtexSyncCounts } from './types.js'

const SKU_BATCH_SIZE = 40
const ORDER_PAGE_SIZE = 30
// A OMS aceita no máximo 30 páginas. A janela temporal é reduzida até caber
// nesse limite; nunca pedimos a página 31, que a VTEX rejeita com HTTP 400.
const MAX_VTEX_OMS_ORDER_PAGES = 30
const ORDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
// A OMS rejeita intervalos de `lastChange` de 1 ms (400). Um segundo ainda
// permite isolar picos densos sem gerar filtro de data inválido.
const MIN_ORDER_WINDOW_MS = 1_000
const INCREMENTAL_OVERLAP_MS = 15 * 60 * 1000
export const VTEX_CHANNEL_DISCOVERY_VERSION = 3

export function vtexOrderQueryMode(mode: 'full' | 'incremental'): {
  filterName: 'f_creationDate' | 'f_lastChange'
  filterField: 'creationDate' | 'lastChange'
  orderBy: 'creationDate,asc' | 'lastChange,asc'
} {
  return mode === 'incremental'
    ? { filterName: 'f_lastChange', filterField: 'lastChange', orderBy: 'lastChange,asc' }
    : { filterName: 'f_creationDate', filterField: 'creationDate', orderBy: 'creationDate,asc' }
}

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
// Subido de 4/5 pra 8/10 (throughput real, ver commit b8837b2) — VTEX não
// documenta um limite fixo de requisições simultâneas por conta; o circuit
// breaker (CIRCUIT_FAILURE_THRESHOLD) já protege contra 429 sustentado,
// então esse é o teto seguro pra tentar antes de precisar recuar.
const ORDER_CONCURRENCY = 8
// Produção comprovou ~7 SKUs/s com 10 workers. A conta real de 17,7 mil
// SKUs levava ~45 min. 32 mantém concorrência limitada, muito abaixo do
// teto oficial do endpoint de catálogo, e reduz o estágio sem disparar uma
// avalanche de centenas de requests/round-trips simultâneos.
const SKU_CONCURRENCY = 32
const CHANNEL_RESOLUTION_BUDGET_MS = 25_000

/** Orçamento de tempo por invocação — bem abaixo do `maxDuration: 300` da
 *  function (api/cron/sync-vtex.ts, api/integrations/vtex/sync.ts), pra
 *  sempre sobrar margem de checar o orçamento, persistir checkpoint e
 *  responder HTTP antes da Vercel matar o processo no meio de um `await`
 *  (era exatamente isso que deixava a run presa pra sempre em `running`
 *  sem erro nenhum registrado). */
const RUN_TIME_BUDGET_MS = 210_000
export const VTEX_MAX_RUNTIME_MS = 300_000

/** Run sem heartbeat por mais que isso é considerada abandonada — nunca
 *  fica "sincronizando" pra sempre esperando um UPDATE manual no banco.
 *  Precisa ser estritamente maior que o maxDuration da function para um
 *  worker válido nunca ser reclamado no limite de 300 segundos. */
export const HEARTBEAT_STALE_MINUTES = 6
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

/** Catálogo completo pode durar dezenas de minutos em contas grandes. Para
 * incrementais, pedidos são a métrica operacional sensível ao tempo e
 * precisam chegar antes; a carga full preserva a ordem conservadora atual. */
export function nextVtexStageAfterCategories(mode: 'full' | 'incremental'): VtexSyncStage {
  return mode === 'incremental' ? 'orders' : 'catalog'
}

export function nextVtexStageAfterOrders(mode: 'full' | 'incremental'): VtexSyncStage {
  return mode === 'incremental' ? 'catalog' : 'finalize'
}

export function nextVtexStageAfterCatalog(checkpoint: Pick<VtexCatalogCheckpoint, 'ordersCompleted'>): VtexSyncStage {
  return checkpoint.ordersCompleted ? 'finalize' : 'orders'
}

export function isMissingVtexSku(error: unknown): boolean {
  return error instanceof VtexApiError && error.status === 404
}

export function vtexOrderResumePage(mode: 'full' | 'incremental', checkpointPage: number | undefined): number {
  // creationDate é imutável: na carga full, a paginação de uma janela
  // congelada pode continuar com segurança entre invocações. lastChange é
  // mutável: incremental reinicia a microjanela e confia nos upserts.
  if (mode !== 'full') return 1
  const page = Number(checkpointPage ?? 1)
  return Number.isInteger(page) && page > 0 ? page : 1
}

export function clearResolvedVtexSkuErrors(
  errors: string[],
  errorCount: number,
  resolvedSkuIds: Iterable<number>,
): { errors: string[]; errorCount: number } {
  const prefixes = new Set([...resolvedSkuIds].map((skuId) => `SKU ${skuId}:`))
  if (prefixes.size === 0) return { errors, errorCount }
  const remaining = errors.filter((message) => ![...prefixes].some((prefix) => message.startsWith(prefix)))
  return { errors: remaining, errorCount: Math.max(0, errorCount - (errors.length - remaining.length)) }
}

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

type VtexCatalogCheckpoint = VtexSyncCheckpoint & {
  catalogCycleStartedAt?: string
  catalogFailedSkuIds?: number[]
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
  shouldStop?: () => boolean,
): Promise<{ processedCount: number; timedOut: boolean }> {
  let processedCount = 0
  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency)
    await Promise.allSettled(chunk.map((item) => handler(item)))
    processedCount += chunk.length
    await onBatch(processedCount)
    if (shouldStop?.() || Date.now() >= deadline) return { processedCount, timedOut: true }
  }
  return { processedCount, timedOut: false }
}

/** Fallback de descoberta de catálogo: algumas contas VTEX não têm SKU
 *  algum na lista global (`getSkuIds`) porque o catálogo é modelado só por
 *  sales channel — `stockkeepingunitids` devolve `[]` mesmo com produtos
 *  reais publicados. Descobre os sales channels REAIS da conta (nunca um
 *  valor hardcoded como `1`) via `getSalesChannels`, busca SKUs em cada um e
 *  deduplica. Falha de UM canal (rede/permissão) não aborta os demais, mas
 *  marca o resultado como incompleto para obrigar o fallback paginado. Se
 *  `getSalesChannels` em si falhar ou não retornar nenhum canal ativo,
 *  devolve `[]` (o chamador decide se isso é catálogo vazio de verdade). */
export async function discoverVtexSkuIdsBySalesChannel(client: VtexClient, companyId: string, connectionId: string): Promise<{ skuIds: number[]; complete: boolean }> {
  let channels: Array<{ Id: number | string; IsActive?: boolean }> = []
  let channelsLoaded = true
  try {
    const raw = await client.getSalesChannels()
    channels = Array.isArray(raw) ? raw.filter((channel) => channel.IsActive !== false) : []
  } catch {
    channelsLoaded = false
    channels = []
  }
  if (channels.length === 0) {
    await logSyncEvent({
      companyId, connectionId, provider: 'vtex', eventType: 'sync_stage', status: 'info',
      message: 'VTEX global SKU discovery returned empty and no active sales channel was found for per-channel fallback',
      payload: { code: 'CATALOG_SALES_CHANNEL_DISCOVERY_EMPTY', stage: 'catalog' },
    })
    return { skuIds: [], complete: channelsLoaded }
  }

  const skuIds = new Set<number>()
  const perChannelCounts: Record<string, number> = {}
  let channelsSucceeded = 0
  for (const channel of channels) {
    try {
      const ids = await client.getSkuIdsBySalesChannel(channel.Id)
      if (Array.isArray(ids)) {
        channelsSucceeded += 1
        perChannelCounts[String(channel.Id)] = ids.length
        for (const id of ids) skuIds.add(id)
      } else {
        perChannelCounts[String(channel.Id)] = 0
      }
    } catch {
      // Canal isolado: um sales channel com erro (permissão específica,
      // canal desativado no meio do caminho) não derruba a descoberta dos
      // outros — só fica de fora do agregado.
      perChannelCounts[String(channel.Id)] = 0
    }
  }

  await logSyncEvent({
    companyId, connectionId, provider: 'vtex', eventType: 'sync_stage', status: 'info',
    message: 'VTEX catalog discovered via per-sales-channel fallback (global SKU list was empty)',
    payload: { code: 'CATALOG_SALES_CHANNEL_DISCOVERY_COMPLETED', stage: 'catalog', channelsChecked: channels.length, perChannelCounts, dedupedSkuTotal: skuIds.size },
  })
  return { skuIds: [...skuIds], complete: channelsSucceeded === channels.length }
}

const CATALOG_PAGINATION_PAGE_SIZE = 50

export interface VtexPaginatedDiscoveryResult {
  skuIds: number[]
  nextFrom: number
  done: boolean
  total: number | null
}

/** Terceiro nível de fallback, só tentado se a descoberta global E o
 *  fallback por sales channel devolverem `[]`. Existe porque catálogos
 *  grandes (comprovado em produção: 18k+ produtos ativos no admin da VTEX)
 *  fazem `stockkeepingunitids`/`stockkeepingunitidsbysaleschannel`
 *  devolverem vazio mesmo com produtos reais — esses dois endpoints não são
 *  confiáveis em volume. `GetProductAndSkuIds` é paginado por índice
 *  (`_from`/`_to`) e usa `range.total` do próprio payload como critério de
 *  parada — nunca assume um total.
 *
 *  Resumível: se o orçamento de tempo estourar no meio da paginação,
 *  devolve `done:false` com `nextFrom` na posição exata — o chamador
 *  persiste isso no checkpoint (`catalogPaginationFrom`) e a invocação
 *  seguinte continua dali, nunca do zero. */
export async function discoverVtexSkuIdsByPagination(
  client: VtexClient,
  companyId: string,
  connectionId: string,
  startFrom: number,
  deadline: number,
): Promise<VtexPaginatedDiscoveryResult> {
  const skuIds = new Set<number>()
  let from = Math.max(0, startFrom)
  let total: number | null = null
  let pagesFetched = 0

  while (total === null || from <= total) {
    if (Date.now() >= deadline) {
      await logSyncEvent({
        companyId, connectionId, provider: 'vtex', eventType: 'sync_stage', status: 'info',
        message: 'VTEX catalog pagination fallback yielded on time budget — resuming from the same offset next tick',
        payload: { code: 'CATALOG_PAGINATION_YIELDED', stage: 'catalog', nextFrom: from, total, pagesFetched },
      })
      return { skuIds: [...skuIds], nextFrom: from, done: false, total }
    }
    let page: { data: Record<string, number[]>; range: { total: number } } | null = null
    try {
      page = await client.getProductAndSkuIds(from, from + CATALOG_PAGINATION_PAGE_SIZE - 1)
    } catch (error) {
      if (error instanceof VtexApiError && [401, 403].includes(error.status)) throw error
      // Falha transitória no meio da paginação: para aqui (não avança
      // `from`), resume no próximo tick — mesma postura do resto do
      // catálogo, nunca insiste em loop apertado contra um erro persistente.
      await logSyncEvent({
        companyId, connectionId, provider: 'vtex', eventType: 'sync_stage', status: 'info',
        message: 'VTEX catalog pagination fallback hit a transient error mid-page — resuming from the same offset next tick',
        payload: { code: 'CATALOG_PAGINATION_ERROR', stage: 'catalog', nextFrom: from, total, pagesFetched },
      })
      return { skuIds: [...skuIds], nextFrom: from, done: false, total }
    }
    const rangeTotal = Number(page?.range?.total)
    total = Number.isFinite(rangeTotal) ? rangeTotal : total ?? 0
    for (const ids of Object.values(page?.data ?? {})) {
      if (Array.isArray(ids)) for (const id of ids) skuIds.add(id)
    }
    pagesFetched += 1
    from += CATALOG_PAGINATION_PAGE_SIZE
    if (total === 0) break // range.total ausente/zero na primeira página: catálogo vazio de verdade por essa via
  }

  await logSyncEvent({
    companyId, connectionId, provider: 'vtex', eventType: 'sync_stage', status: 'info',
    message: 'VTEX catalog discovered via paginated GetProductAndSkuIds fallback (global and per-sales-channel discovery were both empty)',
    payload: { code: 'CATALOG_PAGINATION_COMPLETED', stage: 'catalog', pagesFetched, total, dedupedSkuTotal: skuIds.size },
  })
  return { skuIds: [...skuIds], nextFrom: from, done: true, total }
}

export async function queueVtexSync(companyId: string, mode: 'full' | 'incremental', trigger: 'auto' | 'manual'): Promise<SyncRunRow> {
  const supabase = await getSupabaseAdmin()
  const connection = await loadVtexConnection(companyId)
  await reclaimStaleVtexRun(supabase, companyId, connection.id)
  // Uma run `queued` já existente (yield por orçamento de tempo, aguardando
  // o próximo tick) tem PRIORIDADE sobre a checagem de "due": ela não é uma
  // sync nova, é a MESMA execução continuando. `next_sync_at` só governa
  // quando iniciar uma sync do zero — nunca quando retomar uma já em
  // andamento. Sem isso, uma run interrompida ficava esperando o intervalo
  // de 24h (`VTEX_AUTO_SYNC_INTERVAL_MS`) inteiro antes do cron voltar a
  // tocar nela, mesmo rodando a cada poucos minutos.
  const { data: active } = await supabase.from('integration_sync_runs').select('*')
    .eq('company_id', companyId).eq('connection_id', connection.id).in('status', ['queued', 'running']).maybeSingle()
  if (active) {
    const activeRun = active as SyncRunRow
    if (activeRun.mode !== mode) {
      // O `mode` pedido (ex: `full` disparado manualmente após resolver um
      // mapeamento de canal) é silenciosamente ignorado quando já existe
      // uma run ativa de outro modo — sem log isso é invisível: o usuário
      // pede uma coisa, recebe outra, sem nenhum rastro em produção.
      await logSyncEvent({
        companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info',
        message: `VTEX ${mode} sync requested but an active ${activeRun.mode} run already exists — resuming the existing run instead`,
        payload: { code: 'SYNC_MODE_IGNORED_ACTIVE_RUN', requestedMode: mode, activeMode: activeRun.mode, activeRunId: activeRun.id },
      })
    }
    return activeRun
  }
  // O breaker impede uma NOVA execução. Uma run já criada e yieldada precisa
  // conseguir retomar o próprio checkpoint; bloqueá-la aqui deixava estado
  // ativo preso até o cooldown e contrariava a continuidade do cron.
  assertVtexCircuitClosed(connection.circuit_open_until)
  if (trigger === 'auto' && !isVtexSyncDue(connection.next_sync_at)) throw new VtexSyncNotDueError()
  // Snapshot da configuração NO MOMENTO DA CRIAÇÃO da run — a partir daqui
  // essa run usa esses valores até terminar. Mudar `historyMonths` na
  // conexão depois disso só afeta a PRÓXIMA run; nunca reescreve as regras
  // de uma run em andamento (foi exatamente isso que produziu o checkpoint
  // impossível encontrado em produção).
  const runConfig = buildVtexRunConfig(resolveVtexHistoryMonths(connection.provider_metadata), mode)
  const { data, error } = await supabase.from('integration_sync_runs').insert({ company_id: companyId, connection_id: connection.id, provider: 'vtex', mode, status: 'queued', stage: 'validate', counts: EMPTY_COUNTS, checkpoint: { version: VTEX_CHECKPOINT_VERSION, runConfig } }).select('*').single()
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
  if ((VTEX_SYNC_TERMINAL_STATUSES as readonly string[]).includes(run.status)) return run

  const syncLease = await claimSyncLock(supabase, companyId, connection.id, new Date())
  const counts = mergeCounts(run.counts)
  // Invariantes do checkpoint ANTES de processar qualquer coisa: migra
  // checkpoint sem versão, congela o snapshot de config e recalcula janelas
  // logicamente impossíveis (historyStart depois da janela atual, window
  // invertida, orderPage < 1). Nunca apaga pedido — checkpoint ruim é
  // ponteiro errado, e os upserts downstream são idempotentes.
  const fallbackConfig = buildVtexRunConfig(resolveVtexHistoryMonths(connection.provider_metadata), run.mode)
  const normalization = normalizeVtexCheckpoint(run.checkpoint, fallbackConfig)
  const checkpoint = normalization.checkpoint as VtexCatalogCheckpoint
  const runConfig = normalization.config
  if (normalization.normalized) {
    await logSyncEvent({
      companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info',
      message: 'VTEX sync checkpoint normalized before processing',
      payload: { code: 'CHECKPOINT_NORMALIZED', stage: run.stage, reasons: normalization.reasons, checkpointVersion: VTEX_CHECKPOINT_VERSION },
    })
  }
  const errors = [...(run.errors ?? [])]
  const deadline = Date.now() + RUN_TIME_BUDGET_MS

  try {
    const client = new VtexClient(credentialsFromConnection(connection))
    await updateRun(supabase, run, { status: 'running', started_at: new Date().toISOString() })
    await supabase.from('marketplace_connections').update({ status: 'syncing', last_error: null }).eq('id', connection.id).eq('company_id', companyId)

    // GATE DE REVALIDAÇÃO DE CATÁLOGO — cobre exatamente o caso real de
    // produção: uma run com `stage='orders'` (herdado de uma execução
    // anterior ao conceito de validação de catálogo, ou de um reclaim que
    // preservou `stage` cegamente) cujo checkpoint nunca provou que o
    // catálogo rodou (`catalogStatus` ausente/`'unknown'`). Decide-se
    // SOMENTE por `catalogStatus` — nunca por `stage` — e nunca reseta
    // nenhum campo de pedidos já presente no checkpoint (historyStart/
    // windowStart/windowEnd/targetEnd/orderPage ficam intocados). É uma
    // reentrada única: depois que `catalogStatus` sai de `'unknown'`, este
    // gate nunca mais dispara para esta run.
    const intentionalOrdersFirst = run.mode === 'incremental' && checkpoint.ordersPrioritized === true && checkpoint.ordersCompleted !== true
    if (['orders', 'finalize', 'complete'].includes(run.stage) && vtexCatalogNeedsRevalidation(checkpoint) && !intentionalOrdersFirst) {
      await logSyncEvent({
        companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info',
        message: 'VTEX run resumed at a post-catalog stage without proof the catalog stage ever ran — reentering catalog validation once before continuing orders',
        payload: { code: 'CATALOG_REVALIDATION_REQUIRED', previousStage: run.stage, catalogStatus: checkpoint.catalogStatus ?? 'unknown' },
      })
      run.stage = 'catalog'
      await updateRun(supabase, run, { stage: run.stage, checkpoint })
    }

    // Descoberta de canais é independente do estágio pesado de catálogo.
    // Antes ficava dentro de `stage === 'orders'`: numa conta com 17k SKUs,
    // os nomes oficiais podiam ficar pendentes por dezenas de minutos mesmo
    // já existindo relações reais affiliate -> salesChannel no banco.
    await ensureBaseSalesChannels(supabase, companyId)
    if ((checkpoint.affiliateRegistryVersion ?? 0) < VTEX_CHANNEL_DISCOVERY_VERSION) {
      const channelDeadline = Math.min(deadline, Date.now() + CHANNEL_RESOLUTION_BUDGET_MS)
      // Registry direto primeiro; a relação affiliate -> salesChannel só
      // examina o que continuou unresolved. Evita duas fontes confiáveis
      // disputarem a mesma linha em paralelo com last-write-wins.
      const [affiliateResult, salesChannelResult] = await Promise.all([
        autoResolveVtexAffiliatesFromRegistry(client, supabase, companyId, connection.id, channelDeadline),
        autoResolveVtexSalesChannelsFromRegistry(client, supabase, companyId, connection.id, channelDeadline),
      ])
      const relationshipResult = await autoResolveVtexAffiliatesFromSalesChannels(
        client, supabase, companyId, connection.id,
        channelDeadline,
      )
      // Falha/transbordo do enriquecimento não vira "checado". A versão só
      // avança quando a fonte oficial e todas as relações candidatas foram
      // examinadas; caso contrário, o próximo tick tenta novamente.
      const registriesCompleted = affiliateResult.completed && salesChannelResult.completed && relationshipResult.completed
      checkpoint.affiliateRegistryChecked = registriesCompleted
      if (registriesCompleted) checkpoint.affiliateRegistryVersion = VTEX_CHANNEL_DISCOVERY_VERSION
      await updateRun(supabase, run, { checkpoint })
      if (affiliateResult.checked + salesChannelResult.checked + relationshipResult.checked > 0) {
        await logSyncEvent({
          companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info',
          message: 'VTEX trusted channel registries auto-resolution checked',
          payload: {
            code: 'CHANNEL_REGISTRIES_CHECKED', stage: run.stage,
            affiliatesChecked: affiliateResult.checked,
            affiliatesResolved: affiliateResult.resolved,
            affiliatesCompleted: affiliateResult.completed,
            salesChannelsChecked: salesChannelResult.checked,
            salesChannelsResolved: salesChannelResult.resolved,
            salesChannelsCompleted: salesChannelResult.completed,
            relationshipsChecked: relationshipResult.checked,
            relationshipsResolved: relationshipResult.resolved,
            relationshipsAmbiguous: relationshipResult.ambiguous,
            relationshipsCompleted: relationshipResult.completed,
          },
        })
      }
    }

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
      checkpoint.ordersPrioritized = run.mode === 'incremental'
      run.stage = nextVtexStageAfterCategories(run.mode)
      await updateRun(supabase, run, { stage: run.stage, checkpoint, counts })
    }

    if (run.stage === 'catalog') {
      if (checkpoint.catalogStatus === undefined || checkpoint.catalogStatus === 'unknown') {
        checkpoint.catalogStatus = 'validating'
        checkpoint.catalogCycleStartedAt = new Date().toISOString()
        checkpoint.catalogFailedSkuIds = undefined
        await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX catalog validation started', payload: { code: 'CATALOG_VALIDATION_STARTED', stage: 'catalog' } })
      }
      checkpoint.catalogCycleStartedAt = checkpoint.catalogCycleStartedAt ?? new Date().toISOString()
      await updateRun(supabase, run, { checkpoint })

      let skuIds: number[] | null = null
      const retryingFailedSkus = Boolean(checkpoint.catalogFailedSkuIds?.length)
      if (retryingFailedSkus) {
        skuIds = checkpoint.catalogSkuIds ?? checkpoint.catalogFailedSkuIds ?? []
      } else if (checkpoint.catalogSkuIds && checkpoint.catalogSkuIds.length > 0) {
        // Lote já retomando um catálogo descoberto via fallback numa
        // invocação anterior — reusa a lista persistida em vez de
        // rechamar o endpoint global (não confiável em catálogos grandes,
        // ver comentário em types.ts em `catalogSkuIds`).
        skuIds = checkpoint.catalogSkuIds
      } else
      try {
        const rawSkuIds = await client.getSkuIds()
        // Validação defensiva de schema: um payload não-array (200 OK mas
        // corpo malformado) NUNCA pode virar `[]` em silêncio — isso é
        // exatamente o tipo de gap que fazia "0 produtos" ficar
        // indistinguível de "catálogo nunca validado de verdade".
        if (!Array.isArray(rawSkuIds)) {
          await logSyncEvent({
            companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'error',
            message: 'VTEX getSkuIds returned a non-array payload — not coerced to empty catalog',
            payload: { code: 'CATALOG_PAYLOAD_INVALID', stage: 'catalog', payloadType: typeof rawSkuIds },
          })
          throw new Error('VTEX_CATALOG_PAYLOAD_INVALID')
        }
        skuIds = rawSkuIds
      } catch (catalogError) {
        if (catalogError instanceof VtexApiError && [401, 403].includes(catalogError.status)) {
          // Erro de permissão é uma PROVA definitiva, não uma ambiguidade:
          // catalogStatus vira 'blocked' (terminal — o gate de revalidação
          // nunca mais reentra nesta run) e a conexão segue o mesmo padrão
          // já usado pro catch geral de 401/403 no final do arquivo.
          checkpoint.catalogStatus = 'blocked'
          checkpoint.catalogValidatedAt = new Date().toISOString()
          await logSyncEvent({
            companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'error',
            message: 'VTEX catalog endpoint denied access — marking catalog as blocked, connection requires attention',
            payload: { code: 'CATALOG_PERMISSION_DENIED', stage: 'catalog', httpStatus: catalogError.status, vtexErrorCode: catalogError.code },
          })
          await supabase.from('marketplace_connections').update({ status: 'requires_attention', last_error: 'VTEX_CATALOG_PERMISSION_REQUIRED' }).eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected')
          // Não retorna aqui: cai no bloco comum abaixo (`skuIds` continua
          // `null`, então o processamento de lote é pulado) que avança pra
          // `orders` e persiste checkpoint+counts+errors uma única vez.
        } else {
          // Qualquer outro erro (rede, 5xx, payload inválido) é tratado como
          // possivelmente transitório: NÃO marca `blocked` (que é terminal),
          // deixa `catalogStatus` como está (`'unknown'`/`'validating'`) pra
          // a run tentar de novo no próximo tick, e propaga o erro pro catch
          // geral do arquivo — que já sabe persistir/retry via
          // nextVtexFailureState/circuit breaker, sem duplicar essa lógica aqui.
          throw catalogError
        }
      }

      if (skuIds !== null && skuIds.length === 0 && !checkpoint.catalogSkuIds) {
        // Descoberta global vazia NÃO é prova de catálogo vazio nesta conta:
        // algumas contas VTEX modelam o catálogo só por sales channel, sem
        // afiliação global — `stockkeepingunitids` devolve `[]` mesmo
        // existindo produtos reais (comprovado: SKUs de pedidos já
        // importados respondem em `getSku`). Antes de aceitar "vazio",
        // descobre os sales channels REAIS da conta (nunca hardcoded) e
        // busca SKUs em cada um. Pula esse passo se já está retomando a
        // paginação (terceiro fallback) — sales channel já rodou e voltou
        // vazio numa invocação anterior, não precisa repetir a cada tick.
        const resumingPagination = checkpoint.catalogPaginationFrom !== undefined
        let salesChannelComplete = true
        if (!resumingPagination) {
          const salesChannelDiscovery = await discoverVtexSkuIdsBySalesChannel(client, companyId, connection.id)
          skuIds = salesChannelDiscovery.skuIds
          salesChannelComplete = salesChannelDiscovery.complete
        }

        if (resumingPagination || !salesChannelComplete || skuIds.length === 0) {
          // Terceiro nível de fallback, só tentado se global E sales channel
          // vieram vazios: catálogos grandes (comprovado em produção — 18k+
          // produtos ativos no admin da VTEX) fazem os dois endpoints acima
          // devolverem `[]` mesmo com produtos reais. `GetProductAndSkuIds` é
          // paginado por índice e nunca falha silenciosamente por volume.
          // Resumível: se estourar o orçamento no meio, devolve `queued` com
          // `catalogPaginationFrom` persistido — a próxima invocação continua
          // exatamente dali, sem tocar em pedidos/checkpoint de orders.
          const paginationFrom = Number(checkpoint.catalogPaginationFrom ?? 0)
          const pagination = await discoverVtexSkuIdsByPagination(client, companyId, connection.id, paginationFrom, deadline)
          const accumulatedPaginationSkuIds = [...new Set([
            ...(checkpoint.catalogPaginationSkuIds ?? []),
            ...skuIds,
            ...pagination.skuIds,
          ])]
          if (!pagination.done) {
            checkpoint.catalogPaginationFrom = pagination.nextFrom
            checkpoint.catalogPaginationSkuIds = accumulatedPaginationSkuIds
            checkpoint.catalogStatus = 'validating'
            await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
            return { ...run, checkpoint, counts, errors, status: 'queued' }
          }
          checkpoint.catalogPaginationFrom = undefined
          checkpoint.catalogPaginationSkuIds = undefined
          skuIds = accumulatedPaginationSkuIds
        }
      }

      if (skuIds !== null) {
        // `getSkuIds()` (com ou sem os fallbacks por sales channel/paginação)
        // retornando um array vazio é AMBÍGUO em runs antigas sem prova de
        // validação: pode ser um catálogo genuinamente vazio, mas também
        // pode ser uma run legada nunca processada de verdade. Com
        // `catalogStatus`, a ambiguidade desaparece: só marcamos `'empty'`
        // (estado terminal, validado por sucesso HTTP real em TODAS as
        // estratégias tentadas) quando a chamada teve sucesso E o array veio
        // vazio.
        if (skuIds.length === 0 && Number(checkpoint.skuOffset ?? 0) === 0) {
          checkpoint.catalogStatus = 'empty'
          checkpoint.catalogValidatedAt = new Date().toISOString()
          checkpoint.catalogDiscoveryVersion = VTEX_CATALOG_DISCOVERY_VERSION
          await logSyncEvent({
            companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info',
            message: 'VTEX catalog validated as genuinely empty (global, per-sales-channel and paginated discovery all returned zero SKU ids)',
            payload: { code: 'CATALOG_EMPTY_VALIDATED', stage: 'catalog', skuTotal: 0 },
          })
        }
        if (!retryingFailedSkus) {
          checkpoint.skuTotal = skuIds.length
          checkpoint.catalogSkuTotal = skuIds.length
        }
        // Preserve a descoberta completa até o catálogo realmente terminar.
        // Mesmo uma lista <= SKU_BATCH_SIZE pode atravessar o deadline no meio
        // do primeiro lote. Sem essa lista, um retry de item isolado substituiria
        // o conjunto original e poderia descartar a cauda ainda não processada.
        if (!retryingFailedSkus) checkpoint.catalogSkuIds = skuIds.length > 0 ? skuIds : undefined
        const start = Number(checkpoint.skuOffset ?? 0)
        // Passa TODO o restante pra `runBudgetedBatches` — ela já para
        // sozinha em `deadline` (RUN_TIME_BUDGET_MS=210s). Fatiar em
        // `SKU_BATCH_SIZE` aqui fazia o lote (40 itens, ~5 concorrentes)
        // terminar em segundos e devolver `timedOut:false` bem antes do
        // orçamento acabar — cada tick do cron desperdiçava quase todo o
        // tempo disponível, processando só 40 SKUs a cada ~15min pra um
        // catálogo de 17k+ (bug real de produção, conta climario).
        const batch = retryingFailedSkus ? (checkpoint.catalogFailedSkuIds ?? []) : skuIds.slice(start)
        await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX catalog batch started', payload: { code: 'CATALOG_SKU_IDS_LOADED', stage: 'catalog', batchSize: batch.length, offset: start, total: skuIds.length } })
        const batchStartedAt = Date.now()
        let priceFailures = 0
        let inventoryFailures = 0
        let catalogPermissionDenied = false
        let pricingReadConfirmed = false
        const failedSkuIds = new Set<number>()
        const resolvedRetrySkuIds = new Set<number>()
        const { processedCount, timedOut } = await runBudgetedBatches(batch, SKU_CONCURRENCY, deadline, async (skuId) => {
        try {
          const sku = await client.getSku(skuId)
          const [priceResult, inventoryResult] = await Promise.allSettled([client.getPrice(skuId), client.getInventory(skuId)])
          let price = priceResult.status === 'fulfilled' ? priceResult.value : null
          let priceRequestFailed = priceResult.status === 'rejected'
          // `GET /pricing/prices/{id}` devolve 404 quando não existe preço
          // base, mesmo que a política padrão tenha preço calculado. Só nesse
          // caso tentamos a rota calculada; 401/403/5xx preservam o erro
          // original e não disfarçam problema de credencial ou disponibilidade.
          if (
            (priceResult.status === 'rejected' && priceResult.reason instanceof VtexApiError && priceResult.reason.status === 404) ||
            (priceResult.status === 'fulfilled' && priceResult.value.basePrice == null)
          ) {
            const computedResult = await Promise.allSettled([client.getComputedPrices(skuId)])
            const computed = computedResult[0]
            if (computed.status === 'fulfilled') {
              const computedPrice = priceFromComputedVtexPolicies(computed.value)
              if (computedPrice) {
                price = computedPrice
                priceRequestFailed = false
              }
              pricingReadConfirmed = true
            } else if (!(computed.reason instanceof VtexApiError && computed.reason.status === 404)) {
              priceFailures += 1
              if (computed.reason instanceof VtexApiError && [401, 403].includes(computed.reason.status)) catalogPermissionDenied = true
            }
          }
          const inventory = inventoryResult.status === 'fulfilled' ? inventoryResult.value : null
          if (priceResult.status === 'rejected') {
            if (!(priceResult.reason instanceof VtexApiError && priceResult.reason.status === 404)) priceFailures += 1
            if (priceResult.reason instanceof VtexApiError && [401, 403].includes(priceResult.reason.status)) catalogPermissionDenied = true
          }
          if (inventoryResult.status === 'rejected') {
            if (!(inventoryResult.reason instanceof VtexApiError && inventoryResult.reason.status === 404)) inventoryFailures += 1
            if (inventoryResult.reason instanceof VtexApiError && [401, 403].includes(inventoryResult.reason.status)) catalogPermissionDenied = true
          }
          if (price) counts.pricesFetched += 1
          if (priceResult.status === 'fulfilled') pricingReadConfirmed = true
          if (inventory) counts.inventoriesFetched += 1
          const normalized = normalizeVtexSku(sku, price, inventory)
          // Falha de Pricing/Logistics não pode apagar um valor real obtido
          // numa sync anterior. Campos cujo request falhou são omitidos do
          // UPDATE; null só é persistido quando a resposta válida da VTEX
          // realmente não contém valor.
          const productPayload: Record<string, unknown> = { company_id: companyId, connection_id: connection.id, provider: 'vtex', last_seen_at: new Date().toISOString(), active: true, ...normalized.product }
          if (priceRequestFailed) delete productPayload.price
          if (inventoryResult.status === 'rejected') delete productPayload.available_quantity
          const { error: productError } = await supabase.from('marketplace_products').upsert(productPayload, { onConflict: 'company_id,connection_id,external_product_id' })
          if (productError) throw new Error(productError.message)
          if (inventoryResult.status === 'fulfilled') {
            const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert({ company_id: companyId, connection_id: connection.id, provider: 'vtex', last_sync_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), active: true, ...normalized.inventory }, { onConflict: 'company_id,connection_id,external_product_id' })
            if (inventoryError) throw new Error(inventoryError.message)
          }
          if (inventoryResult.status === 'fulfilled' && normalized.warehouseRows.length > 0) {
            const { error: warehouseError } = await supabase.from('marketplace_inventory_sources').upsert(normalized.warehouseRows.map((row) => ({ company_id: companyId, connection_id: connection.id, provider: 'vtex', last_sync_at: new Date().toISOString(), ...row })), { onConflict: 'company_id,connection_id,external_product_id,warehouse_id' })
            if (warehouseError) throw new Error(warehouseError.message)
          }
          counts.skusFetched += 1
          counts.productsFetched += 1
          if (retryingFailedSkus) resolvedRetrySkuIds.add(skuId)
        } catch (itemError) {
          // A listagem de IDs e o detalhe não são um snapshot atômico na
          // VTEX. Um SKU removido entre as duas chamadas retorna 404: isso é
          // ausência reconciliável, não falha da integração. Ao concluir a
          // travessia sem erro, a reconciliação por last_seen_at desativa o
          // snapshot antigo desse SKU.
          if (isMissingVtexSku(itemError)) {
            if (retryingFailedSkus) resolvedRetrySkuIds.add(skuId)
            return
          }
          failedSkuIds.add(skuId)
          const permissionDenied = itemError instanceof VtexApiError && [401, 403].includes(itemError.status)
          if (permissionDenied) catalogPermissionDenied = true
          if (retryingFailedSkus || permissionDenied) {
            counts.errors += 1
            errors.push(`SKU ${skuId}: ${sanitizedError(itemError)}`)
          }
        }
      }, async (processedInThisCall) => {
        // Checkpoint parcial dentro do próprio lote — se o orçamento estourar
        // no meio, o offset avança só até onde de fato processou, nunca fica
        // "processando" sem nada persistido.
        const retryTail = retryingFailedSkus ? batch.slice(processedInThisCall) : []
        await updateRun(supabase, run, {
          checkpoint: {
            ...checkpoint,
            skuOffset: retryingFailedSkus ? start : start + processedInThisCall,
            catalogFailedSkuIds: [...new Set([...failedSkuIds, ...retryTail])],
          },
          counts,
          errors: errors.slice(-100),
        })
      }, () => catalogPermissionDenied)
        if (retryingFailedSkus && resolvedRetrySkuIds.size > 0) {
          const resolved = clearResolvedVtexSkuErrors(errors, counts.errors, resolvedRetrySkuIds)
          errors.splice(0, errors.length, ...resolved.errors)
          counts.errors = resolved.errorCount
        }
        checkpoint.skuOffset = retryingFailedSkus ? start : start + processedCount
        const retryTail = retryingFailedSkus ? batch.slice(processedCount) : []
        checkpoint.catalogFailedSkuIds = [...new Set([...failedSkuIds, ...retryTail])]
        if (priceFailures > 0 || inventoryFailures > 0) {
          counts.errors += priceFailures + inventoryFailures
          errors.push(`Catalog enrichment incomplete: ${priceFailures} price request(s) and ${inventoryFailures} inventory request(s) failed.`)
        }
        await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: catalogPermissionDenied ? 'error' : 'info', message: 'VTEX catalog batch completed', payload: { code: 'CATALOG_BATCH_PROGRESS', stage: 'catalog', processed: processedCount, totalProcessed: checkpoint.skuOffset, priceFailures, inventoryFailures, durationMs: Date.now() - batchStartedAt } })
        if (catalogPermissionDenied) {
          checkpoint.catalogStatus = 'blocked'
          await supabase.from('marketplace_connections').update({ status: 'requires_attention', last_error: 'VTEX_CATALOG_ENRICHMENT_PERMISSION_REQUIRED' }).eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected')
          run.stage = nextVtexStageAfterCatalog(checkpoint)
          await updateRun(supabase, run, { status: 'queued', stage: run.stage, checkpoint, counts, errors: errors.slice(-100) })
          return { ...run, status: 'queued', checkpoint, counts, errors }
        }
        if (timedOut || checkpoint.skuOffset < skuIds.length) {
          // Yield controlado (orçamento de tempo, não travamento) — devolve
          // `queued` em vez de `running`: o cron pode rodar acima do TTL,
          // de HEARTBEAT_STALE_MINUTES, então uma run `running` recém-yieldada
          // seria erroneamente vista como stale pelo próximo `reclaimStaleVtexRun`
          // antes do cron legítimo conseguir retomá-la. `queued` fica fora do
          // alcance do reclaim (que só olha `status = 'running'`) e o próximo
          // tick do cron a resume normalmente pelo checkpoint salvo.
          // `catalogStatus` só vira 'completed'/'empty' quando o lote inteiro
          // terminou — enquanto há mais SKUs pra processar, fica 'partial'
          // (nunca terminal, pra reentrar sozinho pelo `stage==='catalog'` já
          // persistido, sem precisar do gate de revalidação).
          if (!['empty', 'blocked'].includes(checkpoint.catalogStatus ?? '')) checkpoint.catalogStatus = 'partial'
          await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
          return { ...run, checkpoint, counts, errors, status: 'queued' }
        }
        // `permissions.pricing` pode ter sido gravado antes da correção do
        // host da API de Pricing. Uma leitura autenticada atual é evidência
        // mais forte que esse probe legado e evita exibir falso "sem acesso".
        if (pricingReadConfirmed && connection.permissions?.pricing !== true) {
          const permissions = { ...(connection.permissions ?? {}), pricing: true }
          const { error: permissionUpdateError } = await supabase.from('marketplace_connections')
            .update({ permissions })
            .eq('id', connection.id).eq('company_id', companyId)
          if (permissionUpdateError) throw new Error(`Failed to persist VTEX pricing permission: ${permissionUpdateError.message}`)
          connection.permissions = permissions
        }
        if (failedSkuIds.size > 0 && !retryingFailedSkus) {
          checkpoint.catalogStatus = 'partial'
          await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
          return { ...run, checkpoint, counts, errors, status: 'queued' }
        }
        checkpoint.catalogSkuIds = undefined
        if (failedSkuIds.size > 0) {
          checkpoint.catalogStatus = 'partial'
        } else if (!['empty', 'blocked'].includes(checkpoint.catalogStatus ?? '')) {
          checkpoint.catalogFailedSkuIds = undefined
          checkpoint.catalogStatus = 'completed'
          checkpoint.catalogValidatedAt = new Date().toISOString()
          checkpoint.catalogDiscoveryVersion = VTEX_CATALOG_DISCOVERY_VERSION
        }
        if (
          ['completed', 'empty'].includes(checkpoint.catalogStatus ?? '') &&
          errors.length === 0 && counts.errors === 0 &&
          checkpoint.catalogCycleStartedAt
        ) {
          await reconcileCatalogRows(supabase, companyId, connection.id, checkpoint.catalogCycleStartedAt)
        }
        await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX catalog stage completed', payload: { code: 'CATALOG_COMPLETED', stage: 'catalog', catalogStatus: checkpoint.catalogStatus, total: skuIds.length } })
      }
      run.stage = nextVtexStageAfterCatalog(checkpoint)
      checkpoint.orderPage = checkpoint.orderPage ?? 1
      await updateRun(supabase, run, { stage: run.stage, checkpoint, counts, errors: errors.slice(-100) })
    }

    if (run.stage === 'orders') {
      const providerMetadata = connection.provider_metadata ?? {}
      const configuredMappings = normalizeVtexChannelMappings(providerMetadata.channelMappings ?? {})
      const mappings = await loadVtexChannelMappings(supabase, companyId, connection.id, configuredMappings)
      const channelResolutionCache: VtexChannelResolutionCache = new Map()
      // `runConfig.historyMonths` vem do SNAPSHOT da run, não da config
      // atual da conexão — trocar 12 -> 3 meses no sistema não mistura mais
      // regras dentro de uma run que já estava em andamento.
      const initialFrom = run.mode === 'incremental' && connection.last_success_at
        ? new Date(new Date(connection.last_success_at).getTime() - INCREMENTAL_OVERLAP_MS)
        : new Date(Date.now() - runConfig.historyMonths * 30 * DAY_MS)
      const targetEnd = checkpoint.orderTargetEnd ? new Date(checkpoint.orderTargetEnd) : new Date()
      const backfillFloor = checkpoint.orderBackfillFloor
        ? new Date(checkpoint.orderBackfillFloor)
        : checkpoint.orderHistoryStart
          ? new Date(checkpoint.orderHistoryStart)
          : initialFrom
      let windowEnd = checkpoint.orderWindowEnd ? new Date(checkpoint.orderWindowEnd) : targetEnd
      let windowStart = checkpoint.orderWindowStart
        ? new Date(checkpoint.orderWindowStart)
        : new Date(Math.max(backfillFloor.getTime(), windowEnd.getTime() - runConfig.windowMs))
      // Checkpoints gravados por versões anteriores podiam conter uma
      // janela abaixo do piso OMS: reduzir 1,7s pela metade produzia 850ms.
      // Recuperamos expandindo para trás, em vez de avançar o cursor: a
      // pequena sobreposição é idempotente pelos upserts canônicos e nunca
      // pula pedidos que já estavam dentro do intervalo inválido.
      if (windowEnd.getTime() - windowStart.getTime() < MIN_ORDER_WINDOW_MS) {
        windowStart = new Date(windowEnd.getTime() - MIN_ORDER_WINDOW_MS)
        await logSyncEvent({
          companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info',
          message: 'VTEX order window clamped to OMS minimum duration',
          payload: { code: 'ORDER_WINDOW_CLAMPED', stage: 'orders', minimumMs: MIN_ORDER_WINDOW_MS, windowStart: windowStart.toISOString(), windowEnd: windowEnd.toISOString() },
        })
      }
      checkpoint.orderTraversal = 'recent_first'
      checkpoint.orderBackfillFloor = backfillFloor.toISOString()
      checkpoint.orderWindowStart = windowStart.toISOString()
      checkpoint.orderWindowEnd = windowEnd.toISOString()
      checkpoint.orderTargetEnd = targetEnd.toISOString()
      checkpoint.orderHistoryStart = checkpoint.orderHistoryStart ?? initialFrom.toISOString()
      while (true) {
        // Primeiro divide por tempo até caber no limite de páginas da OMS.
        // Se um bucket de creationDate for indivisível e denso, a carga full
        // pode continuar da página persistida porque a ordenação é imutável.
        const initialPage = vtexOrderResumePage(run.mode, checkpoint.orderPage)
        let page = initialPage
        checkpoint.orderPage = page
        let totalPages = page
        let sourceTotalPages = page
        let ranOutOfTime = false
        let ordersPermissionDenied = false
        do {
        const { filterName, filterField, orderBy } = vtexOrderQueryMode(run.mode)
        const dateFilter = `${filterField}:[${windowStart.toISOString()} TO ${windowEnd.toISOString()}]`
        const pageStartedAt = Date.now()
        const list = await client.listOrders(`orderBy=${orderBy}&page=${page}&per_page=${ORDER_PAGE_SIZE}&${filterName}=${encodeURIComponent(dateFilter)}`)
        sourceTotalPages = Number(list.paging?.pages ?? page)
        if (page === 1 && sourceTotalPages > MAX_VTEX_OMS_ORDER_PAGES && windowEnd.getTime() - windowStart.getTime() > MIN_ORDER_WINDOW_MS) {
          // Mantém a metade MAIS RECENTE e tenta de novo nesta mesma
          // invocação. Antes, cada halving devolvia `queued` e desperdiçava
          // um ciclo inteiro do cron (5-15 min) sem importar um pedido.
          const currentWindowMs = windowEnd.getTime() - windowStart.getTime()
          const nextWindowMs = Math.max(MIN_ORDER_WINDOW_MS, Math.ceil(currentWindowMs / 2))
          windowStart = new Date(windowEnd.getTime() - nextWindowMs)
          checkpoint.orderWindowStart = windowStart.toISOString()
          checkpoint.orderWindowEnd = windowEnd.toISOString()
          checkpoint.orderPage = 1
          await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
          await logSyncEvent({ companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'info', message: 'VTEX order window reduced inside the current invocation', payload: { code: 'ORDER_WINDOW_SHRUNK', stage: 'orders', windowStart: checkpoint.orderWindowStart, windowEnd: checkpoint.orderWindowEnd, sourceTotalPages } })
          if (Date.now() >= deadline) {
            await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
            return { ...run, checkpoint, counts, errors, status: 'queued' }
          }
          continue
        }
        // `lastChange` pode concentrar milhares de atualizações no mesmo
        // segundo. A OMS não aceita uma janela menor e limita a paginação a
        // 30 páginas; insistir na página 31 só repete os mesmos 900 pedidos.
        // Marcamos a condição explicitamente para o cron reiniciar em full,
        // onde `creationDate` é imutável e distribui esses pedidos sem pular
        // registros. Nenhum pedido existente é modificado nesse fallback.
        if (page === 1 && sourceTotalPages > MAX_VTEX_OMS_ORDER_PAGES) {
          if (run.mode === 'incremental') throw new Error('VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT')
          throw new Error('VTEX_ORDER_CREATION_WINDOW_DENSE_PAGE_LIMIT')
        }
        if (page === initialPage) totalPages = sourceTotalPages
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
            const effectiveDefinition = findCanonicalChannel(channel.canonicalChannel)
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
              channelResolutionStatus: channel.resolutionStatus, canonicalOrderKey: normalized.canonicalOrderKey,
              salesChannel: channel.canonicalChannel,
              salesChannelDisplayName: effectiveDefinition?.displayName ?? (channel.canonicalChannel === normalized.channel ? normalized.channelDisplayName : channel.canonicalChannel),
              salesChannelType: effectiveDefinition?.channelType ?? (channel.canonicalChannel === normalized.channel ? normalized.channelType : 'marketplace'),
              status: normalized.status, totalAmount: normalized.totalAmount,
              feeAmount: normalized.feeAmount, feeStatus: 'unknown', currency: normalized.currency, orderedAt: normalized.orderedAt,
              refundAmount: null, refundStatus: 'unknown', refundUpdatedAt: null,
              sourceUpdatedAt: normalized.sourceUpdatedAt, analyticsIncluded: normalized.analyticsIncluded,
              unavailableReason: normalized.unavailableReason,
              items: normalized.items.map((item) => ({ external_product_id: item.externalProductId, sku: item.sku, title: item.title, quantity: item.quantity, unit_price: item.unitPrice })),
            })
            counts.ordersFetched += 1
            if (persisted.inserted) counts.ordersInserted += 1
            else counts.ordersUpdated += 1
            if (persisted.deduplicated) counts.ordersDeduplicated += 1
          } catch (orderError) {
            // 401/403 é diferente de qualquer outro erro de item: a
            // credencial foi revogada/perdeu permissão, não é um pedido
            // específico com payload ruim. Insistir pedido a pedido até
            // estourar o orçamento da invocação só gasta chamadas
            // HTTP e round-trips de Supabase à toa — mesmo padrão já usado
            // no estágio catalog (VTEX_CATALOG_PERMISSION_REQUIRED).
            if (orderError instanceof VtexApiError && [401, 403].includes(orderError.status)) {
              ordersPermissionDenied = true
            }
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
        if (ordersPermissionDenied) {
          await logSyncEvent({
            companyId, connectionId: connection.id, provider: 'vtex', eventType: 'sync_stage', status: 'error',
            message: 'VTEX orders endpoint denied access mid-page — stopping order fetch instead of retrying item by item until budget runs out',
            payload: { code: 'ORDERS_PERMISSION_DENIED', stage: 'orders', page },
          })
          await supabase.from('marketplace_connections').update({ status: 'requires_attention', last_error: 'VTEX_ORDERS_PERMISSION_REQUIRED' }).eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected')
          const completedAt = new Date().toISOString()
          await updateRun(supabase, run, { status: 'partial', stage: 'complete', checkpoint, counts, errors: errors.slice(-100), completed_at: completedAt })
          return { ...run, status: 'partial', stage: 'complete', checkpoint, counts, errors }
        }
        if (timedOut) { ranOutOfTime = true; break }

        page += 1
        checkpoint.orderPage = page
        await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
        } while (page <= totalPages)
        if (ranOutOfTime) {
        // Full usa creationDate imutável e retoma a mesma página (refazê-la
        // quando o timeout ocorreu no meio é idempotente). Incremental usa
        // lastChange mutável e reinicia a microjanela para não pular shifts.
        checkpoint.orderPage = run.mode === 'full' ? page : 1
        await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
          return { ...run, checkpoint, counts, errors, status: 'queued' }
        }
        if (windowStart.getTime() > backfillFloor.getTime()) {
          const nextEnd = windowStart
          const nextStart = new Date(Math.max(backfillFloor.getTime(), nextEnd.getTime() - runConfig.windowMs))
          windowEnd = nextEnd
          windowStart = nextStart
          checkpoint.orderWindowStart = nextStart.toISOString()
          checkpoint.orderWindowEnd = nextEnd.toISOString()
          checkpoint.orderPage = 1
          await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
          if (Date.now() >= deadline) {
            await updateRun(supabase, run, { status: 'queued', checkpoint, counts, errors: errors.slice(-100) })
            return { ...run, checkpoint, counts, errors, status: 'queued' }
          }
          continue
        }
        break
      }
      checkpoint.ordersCompleted = true
      if (run.mode === 'incremental') {
        // O pedido já foi percorrido por completo, mesmo que catálogo/estoque
        // continuem enriquecendo. A UI pode reportar freshness de pedidos sem
        // aguardar 17k SKUs; o watermark definitivo só avança no finalize.
        await supabase.from('marketplace_connections')
          .update({ orders_last_sync_at: new Date().toISOString() })
          .eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected')
      }
      run.stage = nextVtexStageAfterOrders(run.mode)
      await updateRun(supabase, run, { stage: run.stage, checkpoint, counts, errors: errors.slice(-100) })
    }

    if (run.stage !== 'finalize') return { ...run, checkpoint, counts, errors }

    const completedAt = new Date().toISOString()
    const finalStatus = errors.length > 0 ? 'partial' : 'success'
    const { data: finalizedConnection, error: connectionFinalizeError } = await supabase.from('marketplace_connections').update({
      status: errors.length > 0 ? 'requires_attention' : 'connected',
      last_sync_at: completedAt,
      // `last_success_at` is the order watermark, not the wall-clock finish
      // time. Advancing it past the frozen target would permanently skip
      // updates that happened while this run was executing.
      ...(errors.length === 0 ? { last_success_at: checkpoint.orderTargetEnd ?? completedAt } : {}),
      ...(errors.length === 0 ? {
        catalog_last_sync_at: completedAt,
        inventory_last_sync_at: completedAt,
        orders_last_sync_at: completedAt,
      } : {}),
      next_sync_at: nextVtexSyncAt(new Date(completedAt)),
      last_error: errors[0] ?? null,
      failure_count: 0,
      circuit_open_until: null,
    }).eq('id', connection.id).eq('company_id', companyId).neq('status', 'disconnected').select('id').maybeSingle()
    if (connectionFinalizeError || !finalizedConnection) {
      throw new Error(`VTEX_CONNECTION_FINALIZE_NOT_APPLIED${connectionFinalizeError ? `: ${connectionFinalizeError.message}` : ''}`)
    }
    await updateRun(supabase, run, { status: finalStatus, stage: 'complete', counts, errors: errors.slice(-100), completed_at: completedAt })
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
    await releaseSyncLock(supabase, syncLease)
  }
}
