import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { encryptSecret, decryptSecret } from '../crypto.js'
import { logSyncEvent } from '../syncLog.js'
import type { SyncSummary } from '../types.js'
import type { ShopeeOrder } from './types.js'
import { getItemBaseInfoBatch, searchShopItemIds, searchOrders, ShopeeApiError } from './client.js'
import { mapItemToInventoryRow, mapItemToProductRow, mapOrderToRow, mapOrderItems } from './mapper.js'
import { refreshAccessToken } from './auth.js'
import { claimSyncLock, heartbeatSyncLock, releaseSyncLock } from '../syncLock.js'
import { directCanonicalOrderKey, persistCanonicalOrder } from '../orderIdentity.js'
import { nextIntegrationFailureState, nextScheduledSyncAt } from '../syncSchedule.js'
import { advanceHistoricalWindow, canReconcileCatalog, catalogCheckpoint, historicalWindow, narrowHistoricalWindow } from '../continuity.js'

export class ConnectionMissingError extends Error {}

const ITEM_BATCH_SIZE = 50

interface ConnectionRow {
  id: string
  status: string
  seller_id: string | null // reaproveita a mesma coluna genérica — aqui guarda o shop_id da Shopee
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  sync_interval_minutes: number
  failure_count: number
  catalog_checkpoint: unknown
  orders_checkpoint: unknown
}

async function loadConnection(companyId: string): Promise<ConnectionRow> {
  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('id, status, seller_id, access_token_encrypted, refresh_token_encrypted, token_expires_at, sync_interval_minutes, failure_count, catalog_checkpoint, orders_checkpoint')
    .eq('provider', 'shopee')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load Shopee connection: ${error.message}`)
  if (!data || !data.access_token_encrypted || !data.refresh_token_encrypted || !data.seller_id) {
    throw new ConnectionMissingError('No connected Shopee shop found — run OAuth first.')
  }
  return data
}

/** Access token da Shopee dura só 4h (bem mais curto que o do Mercado
 *  Livre) — checagem de expiração antes de todo sync é ainda mais
 *  necessária aqui. */
async function ensureValidAccessToken(connection: ConnectionRow, companyId: string): Promise<string> {
  const isExpired = connection.token_expires_at ? new Date(connection.token_expires_at) <= new Date() : false

  if (!isExpired) {
    return decryptSecret(connection.access_token_encrypted!)
  }

  const refreshToken = decryptSecret(connection.refresh_token_encrypted!)
  const refreshed = await refreshAccessToken(refreshToken, connection.seller_id!)

  const supabase = await getSupabaseAdmin()
  const { error: tokenPersistError } = await supabase
    .from('marketplace_connections')
    .update({
      access_token_encrypted: encryptSecret(refreshed.access_token),
      refresh_token_encrypted: encryptSecret(refreshed.refresh_token),
      token_expires_at: new Date(Date.now() + refreshed.expire_in * 1000).toISOString(),
      status: 'connected',
      last_error: null,
    })
    .eq('id', connection.id)
    .eq('company_id', companyId)
  if (tokenPersistError) throw new Error(`Failed to persist refreshed Shopee token: ${tokenPersistError.message}`)

  await logSyncEvent({
    companyId,
    connectionId: connection.id,
    provider: 'shopee',
    eventType: 'token_refreshed',
    status: 'success',
    message: 'Access token refreshed before sync',
  })

  return refreshed.access_token
}

/**
 * Sync completo de produtos + estoque + pedidos da loja Shopee conectada.
 * Mesmo padrão do runMercadoLivreSync — grava nas mesmas tabelas
 * (marketplace_products/inventory/orders/order_items), só com provider
 * 'shopee'. Dashboard e resto do app não distinguem a origem.
 */
export async function runShopeeSync(companyId: string): Promise<SyncSummary> {
  const startedAt = new Date()
  const supabase = await getSupabaseAdmin()
  const connection = await loadConnection(companyId)
  const lease = await claimSyncLock(supabase, companyId, connection.id, startedAt)

  await logSyncEvent({
    companyId,
    connectionId: connection.id,
    provider: 'shopee',
    eventType: 'sync_started',
    status: 'info',
    startedAt,
  })

  const errors: string[] = []
  let productsImported = 0
  let inventoryUpdated = 0
  let ordersImported = 0

  try {
    const accessToken = await ensureValidAccessToken(connection, companyId)
    await heartbeatSyncLock(supabase, lease)
    const shopId = connection.seller_id!
    const catalogCycle = catalogCheckpoint(connection.catalog_checkpoint, startedAt)
    const itemSearch = await searchShopItemIds(accessToken, shopId, catalogCycle.nextOffset)
    const itemIds = itemSearch.records
    // Atingir o limite por execução é continuação normal: o next_offset fica
    // no checkpoint. Cursor sem avanço, por outro lado, exige atenção.
    if (itemSearch.partial && itemSearch.reason?.includes('sem avanço')) errors.push(itemSearch.reason)

    const catalogErrorStart = errors.length
    for (let i = 0; i < itemIds.length; i += ITEM_BATCH_SIZE) {
      const batch = itemIds.slice(i, i + ITEM_BATCH_SIZE)
      try {
        const items = await getItemBaseInfoBatch(batch, accessToken, shopId)
        const returnedItemIds = new Set(items.map((item) => item.item_id))
        const missingItemIds = batch.filter((itemId) => !returnedItemIds.has(itemId))
        if (missingItemIds.length > 0) {
          errors.push(`Shopee não devolveu detalhes de ${missingItemIds.length} produto(s) do lote; ciclo não será reconciliado.`)
        }
        for (const item of items) {
          try {
            const productRow = mapItemToProductRow(item, null)
            const inventoryRow = mapItemToInventoryRow(item)

            // cost_price nunca entra aqui de propósito — sempre informado
            // pelo cliente, mesma regra do Mercado Livre.
            const productPayload: Record<string, unknown> = { company_id: companyId, connection_id: connection.id, provider: 'shopee', last_seen_at: new Date().toISOString(), active: true, ...productRow, category_name: null }
            if (productRow.price === null) delete productPayload.price
            if (productRow.available_quantity === null) delete productPayload.available_quantity
            if (productRow.sold_quantity === null) delete productPayload.sold_quantity
            const { error: productError } = await supabase.from('marketplace_products').upsert(
              productPayload,
              { onConflict: 'company_id,connection_id,external_product_id' }
            )
            if (productError) throw new Error(`Failed to upsert product ${item.item_id}: ${productError.message}`)
            productsImported += 1

            const inventoryPayload: Record<string, unknown> = { company_id: companyId, connection_id: connection.id, provider: 'shopee', last_sync_at: new Date().toISOString(), last_seen_at: new Date().toISOString(), active: true, ...inventoryRow }
            if (inventoryRow.available_quantity === null) delete inventoryPayload.available_quantity
            const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert(
              inventoryPayload,
              { onConflict: 'company_id,connection_id,external_product_id' }
            )
            if (inventoryError) throw new Error(`Failed to upsert inventory ${item.item_id}: ${inventoryError.message}`)
            inventoryUpdated += 1
          } catch (itemErr) {
            errors.push(itemErr instanceof Error ? itemErr.message : `Unknown error processing item ${item.item_id}`)
          }
        }
      } catch (batchErr) {
        const message = batchErr instanceof ShopeeApiError
          ? batchErr.message
          : batchErr instanceof Error ? batchErr.message : 'Unknown error fetching item batch'
        errors.push(message)
      }
      await heartbeatSyncLock(supabase, lease)
    }

    const catalogErrorCount = errors.length - catalogErrorStart
    const catalogTraversalComplete = itemSearch.complete === true
    const catalogHadErrors = catalogCycle.hadErrors || catalogErrorCount > 0
    const catalogTraversalSucceeded = canReconcileCatalog(catalogTraversalComplete, catalogHadErrors ? 1 : 0)
    // A API pagina por offset sobre uma coleção que pode mudar entre ticks.
    // Até existir cursor/snapshot estável validado, uma travessia completa
    // atualiza freshness mas nunca desativa itens por ausência.
    const catalogCanReconcile = false
    const catalogFinishedAt = new Date().toISOString()
    const { error: catalogCheckpointError } = await supabase.from('marketplace_connections').update({
      catalog_checkpoint: {
        cycleStartedAt: catalogCycle.cycleStartedAt,
        nextOffset: catalogTraversalComplete ? 0 : itemSearch.nextOffset ?? 0,
        processed: catalogCycle.processed + itemIds.length,
        complete: catalogTraversalComplete,
        hadErrors: catalogHadErrors,
        reconciled: catalogCanReconcile,
      },
      ...(catalogTraversalSucceeded ? {
        catalog_last_sync_at: catalogFinishedAt,
        inventory_last_sync_at: catalogFinishedAt,
      } : {}),
    }).eq('id', connection.id).eq('company_id', companyId)
    if (catalogCheckpointError) throw new Error(`Failed to persist Shopee catalog checkpoint: ${catalogCheckpointError.message}`)

    let orders: ShopeeOrder[] = []
    const orderWindow = historicalWindow(connection.orders_checkpoint, startedAt, 90, 15)
    let ordersWindowComplete = false
    let ordersWindowTruncated = false
    const orderErrorStart = errors.length
    try {
      const orderSearch = await searchOrders(accessToken, shopId, orderWindow.from, orderWindow.to)
      orders = orderSearch.records
      if (orderSearch.partial) {
        ordersWindowTruncated = orderSearch.truncated === true
        errors.push(orderSearch.reason ?? 'Pedidos Shopee parcialmente importados.')
      }
      else ordersWindowComplete = true
    } catch (searchErr) {
      const message = searchErr instanceof ShopeeApiError
        ? searchErr.message
        : searchErr instanceof Error ? searchErr.message : 'Unknown error fetching orders'
      errors.push(message)
    }

    for (const order of orders) {
      try {
        const orderRow = mapOrderToRow(order)
        await persistCanonicalOrder(supabase, {
          companyId, connectionId: connection.id, provider: 'shopee',
          externalOrderId: orderRow.external_order_id,
          canonicalOrderKey: directCanonicalOrderKey('shopee', orderRow.external_order_id),
          salesChannel: 'shopee', status: orderRow.status,
          totalAmount: orderRow.total_amount, feeAmount: orderRow.fee_amount, feeStatus: 'unknown',
          refundAmount: null, refundStatus: 'unknown', refundUpdatedAt: null,
          currency: orderRow.currency, orderedAt: orderRow.ordered_at,
          items: mapOrderItems(order),
        })
        ordersImported += 1
      } catch (orderErr) {
        errors.push(orderErr instanceof Error ? orderErr.message : `Unknown error processing order ${order.order_sn}`)
      }
    }


    const canAdvanceOrders = ordersWindowComplete && errors.length === orderErrorStart
    const ordersCheckpoint = canAdvanceOrders
      ? advanceHistoricalWindow(orderWindow)
      : ordersWindowTruncated ? narrowHistoricalWindow(orderWindow) : orderWindow.checkpoint
    const { error: ordersCheckpointError } = await supabase.from('marketplace_connections').update({
      orders_checkpoint: ordersCheckpoint,
      ...(canAdvanceOrders && orderWindow.isLatestWindow ? { orders_last_sync_at: new Date().toISOString() } : {}),
    }).eq('id', connection.id).eq('company_id', companyId)
    if (ordersCheckpointError) throw new Error(`Failed to persist Shopee orders checkpoint: ${ordersCheckpointError.message}`)

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const hadPartialFailures = errors.length > 0 && (productsImported > 0 || ordersImported > 0)

    const lastErrorSummary = errors.length > 1 ? `${errors.length} avisos/erros: ${errors.slice(0, 5).join(' | ')}` : errors[0] ?? null
    const connectionPatch = errors.length === 0
      ? {
          last_sync_at: finishedAt.toISOString(), status: 'connected', last_error: null,
          failure_count: 0, circuit_open_until: null,
          next_sync_at: nextScheduledSyncAt(connection.sync_interval_minutes, finishedAt),
        }
      : {
          status: 'requires_attention', last_error: lastErrorSummary,
          ...(() => {
            const failure = nextIntegrationFailureState(connection.failure_count, finishedAt)
            return { failure_count: failure.failureCount, circuit_open_until: failure.circuitOpenUntil, next_sync_at: failure.nextSyncAt }
          })(),
        }
    const { error: connectionUpdateError } = await supabase
      .from('marketplace_connections')
      .update(connectionPatch)
      .eq('id', connection.id)
      .eq('company_id', companyId)
    if (connectionUpdateError) throw new Error(`Failed to persist Shopee sync outcome: ${connectionUpdateError.message}`)
    await logSyncEvent({
      companyId,
      connectionId: connection.id,
      provider: 'shopee',
      eventType: errors.length === 0 ? 'sync_success' : hadPartialFailures ? 'sync_partial' : 'sync_error',
      status: errors.length === 0 ? 'success' : hadPartialFailures ? 'success' : 'error',
      message: errors.length === 0 ? `Synced ${productsImported} products, ${ordersImported} orders` : `${errors.length} item(s) failed during sync`,
      payload: { productsImported, inventoryUpdated, ordersImported, errorCount: errors.length, partial: errors.length > 0 },
      startedAt,
      finishedAt,
    })

    return { productsImported, inventoryUpdated, ordersImported, errors, durationMs, source: 'real' }
  } catch (err) {
    const finishedAt = new Date()
    const message = err instanceof Error ? err.message : 'Unknown sync failure'

    const failure = nextIntegrationFailureState(connection.failure_count, finishedAt)
    await supabase.from('marketplace_connections').update({
      status: 'requires_attention', last_error: message,
      failure_count: failure.failureCount, circuit_open_until: failure.circuitOpenUntil, next_sync_at: failure.nextSyncAt,
    }).eq('id', connection.id).eq('company_id', companyId)
    await logSyncEvent({
      companyId,
      connectionId: connection.id,
      provider: 'shopee',
      eventType: 'sync_error',
      status: 'error',
      message,
      startedAt,
      finishedAt,
    })

    return { productsImported, inventoryUpdated, ordersImported, errors: [message], durationMs: finishedAt.getTime() - startedAt.getTime(), source: 'real' }
  } finally {
    await releaseSyncLock(supabase, lease)
  }
}
