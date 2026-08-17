import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { encryptSecret, decryptSecret } from '../crypto.js'
import { logSyncEvent } from '../syncLog.js'
import type { SyncSummary } from '../types.js'
import type { ShopeeOrder } from './types.js'
import { getItemBaseInfoBatch, searchShopItemIds, searchOrders, ShopeeApiError } from './client.js'
import { mapItemToInventoryRow, mapItemToProductRow, mapOrderToRow, mapOrderItems } from './mapper.js'
import { refreshAccessToken } from './auth.js'
import { claimSyncLock, releaseSyncLock } from '../syncLock.js'
import { directCanonicalOrderKey, persistCanonicalOrder } from '../orderIdentity.js'

export class ConnectionMissingError extends Error {}

const ITEM_BATCH_SIZE = 50

interface ConnectionRow {
  id: string
  status: string
  seller_id: string | null // reaproveita a mesma coluna genérica — aqui guarda o shop_id da Shopee
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: string | null
}

async function loadConnection(companyId: string): Promise<ConnectionRow> {
  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('id, status, seller_id, access_token_encrypted, refresh_token_encrypted, token_expires_at')
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
  await supabase
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
  await claimSyncLock(supabase, companyId, connection.id, startedAt)

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
    const shopId = connection.seller_id!
    const itemIds = await searchShopItemIds(accessToken, shopId)

    for (let i = 0; i < itemIds.length; i += ITEM_BATCH_SIZE) {
      const batch = itemIds.slice(i, i + ITEM_BATCH_SIZE)
      try {
        const items = await getItemBaseInfoBatch(batch, accessToken, shopId)
        for (const item of items) {
          try {
            const productRow = mapItemToProductRow(item, null)
            const inventoryRow = mapItemToInventoryRow(item)

            // cost_price nunca entra aqui de propósito — sempre informado
            // pelo cliente, mesma regra do Mercado Livre.
            const { error: productError } = await supabase.from('marketplace_products').upsert(
              { company_id: companyId, connection_id: connection.id, provider: 'shopee', ...productRow, category_name: null },
              { onConflict: 'company_id,connection_id,external_product_id' }
            )
            if (productError) throw new Error(`Failed to upsert product ${item.item_id}: ${productError.message}`)
            productsImported += 1

            const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert(
              { company_id: companyId, connection_id: connection.id, provider: 'shopee', last_sync_at: new Date().toISOString(), ...inventoryRow },
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
    }

    let orders: ShopeeOrder[] = []
    try {
      orders = await searchOrders(accessToken, shopId)
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
          totalAmount: orderRow.total_amount, feeAmount: orderRow.fee_amount,
          currency: orderRow.currency, orderedAt: orderRow.ordered_at,
          items: mapOrderItems(order),
        })
        ordersImported += 1
      } catch (orderErr) {
        errors.push(orderErr instanceof Error ? orderErr.message : `Unknown error processing order ${order.order_sn}`)
      }
    }

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const hadPartialFailures = errors.length > 0 && productsImported > 0

    await supabase
      .from('marketplace_connections')
      .update({ last_sync_at: finishedAt.toISOString(), status: 'connected', last_error: errors[0] ?? null })
      .eq('id', connection.id)
      .eq('company_id', companyId)
    await releaseSyncLock(supabase, companyId, connection.id)

    await logSyncEvent({
      companyId,
      connectionId: connection.id,
      provider: 'shopee',
      eventType: errors.length === 0 ? 'sync_success' : hadPartialFailures ? 'sync_partial' : 'sync_error',
      status: errors.length === 0 ? 'success' : hadPartialFailures ? 'success' : 'error',
      message: errors.length === 0 ? `Synced ${productsImported} products, ${ordersImported} orders` : `${errors.length} item(s) failed during sync`,
      payload: { productsImported, inventoryUpdated, ordersImported, errorCount: errors.length },
      startedAt,
      finishedAt,
    })

    return { productsImported, inventoryUpdated, ordersImported, errors, durationMs, source: 'real' }
  } catch (err) {
    const finishedAt = new Date()
    const message = err instanceof Error ? err.message : 'Unknown sync failure'

    await supabase.from('marketplace_connections').update({ status: 'error', last_error: message }).eq('id', connection.id).eq('company_id', companyId)
    await releaseSyncLock(supabase, companyId, connection.id)

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
  }
}
