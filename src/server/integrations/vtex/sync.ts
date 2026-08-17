import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { claimSyncLock, releaseSyncLock } from '../syncLock.js'
import { logSyncEvent } from '../syncLog.js'
import { persistCanonicalOrder } from '../orderIdentity.js'
import { VtexApiError } from './errors.js'
import { VtexClient } from './client.js'
import { credentialsFromConnection, loadVtexConnection } from './connection.js'
import { loadVtexChannelMappings, persistVtexChannelResolution } from './channelRegistry.js'
import { flattenVtexCategories, normalizeVtexOrder, normalizeVtexSku } from './normalize.js'
import { normalizeVtexChannelMappings } from './validation.js'
import { assertVtexCircuitClosed, isVtexSyncDue, nextVtexFailureState, nextVtexSyncAt, VtexSyncNotDueError } from './schedule.js'
import type { VtexSyncCheckpoint, VtexSyncCounts } from './types.js'

const SKU_BATCH_SIZE = 40
const ORDER_PAGE_SIZE = 30
const MAX_ORDER_PAGES_PER_RUN = 30
const HISTORY_DAYS = 365
const ORDER_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const MIN_ORDER_WINDOW_MS = 60 * 60 * 1000

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

async function updateRun(supabase: SupabaseClient, run: SyncRunRow, patch: Record<string, unknown>): Promise<void> {
  const { error } = await supabase.from('integration_sync_runs').update(patch).eq('id', run.id).eq('company_id', run.company_id).eq('connection_id', run.connection_id)
  if (error) throw new Error(`Failed to update VTEX sync run: ${error.message}`)
}

export async function queueVtexSync(companyId: string, mode: 'full' | 'incremental', trigger: 'auto' | 'manual'): Promise<SyncRunRow> {
  const supabase = await getSupabaseAdmin()
  const connection = await loadVtexConnection(companyId)
  assertVtexCircuitClosed(connection.circuit_open_until)
  if (trigger === 'auto' && !isVtexSyncDue(connection.next_sync_at)) throw new VtexSyncNotDueError()
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
      const start = Number(checkpoint.skuOffset ?? 0)
      const batch = skuIds.slice(start, start + SKU_BATCH_SIZE)
      for (const skuId of batch) {
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
      }
      checkpoint.skuOffset = start + batch.length
      if (checkpoint.skuOffset < skuIds.length) {
        await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100), status: errors.length ? 'running' : 'running' })
        return { ...run, checkpoint, counts, errors, status: 'running' }
      }
      run.stage = 'orders'
      checkpoint.orderPage = checkpoint.orderPage ?? 1
      await updateRun(supabase, run, { stage: run.stage, checkpoint, counts, errors: errors.slice(-100) })
    }

    if (run.stage === 'orders') {
      const providerMetadata = connection.provider_metadata ?? {}
      const configuredMappings = normalizeVtexChannelMappings(providerMetadata.channelMappings ?? {})
      const mappings = await loadVtexChannelMappings(supabase, companyId, connection.id, configuredMappings)
      const initialFrom = run.mode === 'incremental' && connection.last_success_at
        ? new Date(new Date(connection.last_success_at).getTime() - 15 * 60 * 1000)
        : new Date(Date.now() - HISTORY_DAYS * 24 * 60 * 60 * 1000)
      const targetEnd = checkpoint.orderTargetEnd ? new Date(checkpoint.orderTargetEnd) : new Date()
      const windowStart = checkpoint.orderWindowStart ? new Date(checkpoint.orderWindowStart) : initialFrom
      let windowEnd = checkpoint.orderWindowEnd
        ? new Date(checkpoint.orderWindowEnd)
        : new Date(Math.min(windowStart.getTime() + ORDER_WINDOW_MS, targetEnd.getTime()))
      checkpoint.orderWindowStart = windowStart.toISOString()
      checkpoint.orderWindowEnd = windowEnd.toISOString()
      checkpoint.orderTargetEnd = targetEnd.toISOString()
      let page = Number(checkpoint.orderPage ?? 1)
      let pagesProcessed = 0
      let totalPages = page
      let sourceTotalPages = page
      do {
        const filterName = run.mode === 'incremental' ? 'f_lastChange' : 'f_creationDate'
        const filterField = run.mode === 'incremental' ? 'lastChange' : 'creationDate'
        const dateFilter = `${filterField}:[${windowStart.toISOString()} TO ${windowEnd.toISOString()}]`
        const list = await client.listOrders(`orderBy=creationDate,asc&page=${page}&per_page=${ORDER_PAGE_SIZE}&${filterName}=${encodeURIComponent(dateFilter)}`)
        sourceTotalPages = Number(list.paging?.pages ?? page)
        if (page === 1 && sourceTotalPages > MAX_ORDER_PAGES_PER_RUN && windowEnd.getTime() - windowStart.getTime() > MIN_ORDER_WINDOW_MS) {
          windowEnd = new Date(windowStart.getTime() + Math.floor((windowEnd.getTime() - windowStart.getTime()) / 2))
          checkpoint.orderWindowEnd = windowEnd.toISOString()
          checkpoint.orderPage = 1
          await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
          return { ...run, checkpoint, counts, errors, status: 'running' }
        }
        totalPages = Math.min(sourceTotalPages, MAX_ORDER_PAGES_PER_RUN)
        for (const summary of list.list ?? []) {
          try {
            const order = await client.getOrder(summary.orderId)
            const normalized = normalizeVtexOrder(order, mappings)
            const channel = await persistVtexChannelResolution(supabase, companyId, connection.id, normalized)
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
        }
        page += 1
        pagesProcessed += 1
        checkpoint.orderPage = page
        await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
      } while (page <= totalPages && pagesProcessed < MAX_ORDER_PAGES_PER_RUN)
      if (sourceTotalPages > MAX_ORDER_PAGES_PER_RUN) {
        counts.errors += 1
        errors.push(`An hourly order window exceeded the VTEX ${MAX_ORDER_PAGES_PER_RUN}-page API limit and was preserved as partial.`)
      } else if (windowEnd.getTime() < targetEnd.getTime()) {
        const nextStart = windowEnd
        const nextEnd = new Date(Math.min(nextStart.getTime() + ORDER_WINDOW_MS, targetEnd.getTime()))
        checkpoint.orderWindowStart = nextStart.toISOString()
        checkpoint.orderWindowEnd = nextEnd.toISOString()
        checkpoint.orderPage = 1
        await updateRun(supabase, run, { checkpoint, counts, errors: errors.slice(-100) })
        return { ...run, checkpoint, counts, errors, status: 'running' }
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
