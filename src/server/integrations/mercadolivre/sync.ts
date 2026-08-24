import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { encryptSecret, decryptSecret } from '../crypto.js'
import { logSyncEvent } from '../syncLog.js'
import type { SyncSummary } from '../types.js'
import type { MLOrder } from './types.js'
import { getItemDetail, getCategory, searchUserItemIds, searchOrders, MercadoLivreApiError, MAX_ITEMS_FIRST_SYNC } from './client.js'
import { mapItemToInventoryRow, mapItemToProductRow, mapOrderToRow, mapOrderItems } from './mapper.js'
import { refreshAccessToken } from './auth.js'
import { claimSyncLock, heartbeatSyncLock, releaseSyncLock } from '../syncLock.js'
import { directCanonicalOrderKey, persistCanonicalOrder } from '../orderIdentity.js'
import { nextIntegrationFailureState, nextScheduledSyncAt } from '../syncSchedule.js'
import { advanceHistoricalWindow, canReconcileCatalog, catalogCheckpoint, historicalWindow, narrowHistoricalWindow } from '../continuity.js'

export class ConnectionMissingError extends Error {}

/** Roda `fn` pra cada item de `items` com no máximo `concurrency` em voo ao
 *  mesmo tempo. Catálogo grande (até 2000 itens) sequencial de 1 em 1
 *  estourava o timeout da serverless function (cada getItemDetail é 1
 *  request HTTP); concorrência limitada mantém a folga de rate limit do
 *  Mercado Livre (1500 req/min por vendedor) e corta o tempo total em ~8x. */
async function runWithConcurrency<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let index = 0
  async function worker() {
    while (index < items.length) {
      const current = items[index]
      index += 1
      await fn(current)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
}

interface ConnectionRow {
  id: string
  status: string
  seller_id: string | null
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
    .eq('provider', 'mercadolivre')
    .eq('company_id', companyId)
    .maybeSingle()

  if (error) throw new Error(`Failed to load Mercado Livre connection: ${error.message}`)
  if (!data || !data.access_token_encrypted || !data.refresh_token_encrypted || !data.seller_id) {
    throw new ConnectionMissingError('No connected Mercado Livre account found — run OAuth first.')
  }
  return data
}

/** Ensures we have a live access token, refreshing it first if the stored one has expired.
 *  Returns the plaintext access token — caller must never persist or log it. */
async function ensureValidAccessToken(connection: ConnectionRow, companyId: string): Promise<string> {
  const isExpired = connection.token_expires_at ? new Date(connection.token_expires_at) <= new Date() : false

  if (!isExpired) {
    return decryptSecret(connection.access_token_encrypted!)
  }

  const refreshToken = decryptSecret(connection.refresh_token_encrypted!)
  const refreshed = await refreshAccessToken(refreshToken)

  const supabase = await getSupabaseAdmin()
  const { error: tokenPersistError } = await supabase
    .from('marketplace_connections')
    .update({
      access_token_encrypted: encryptSecret(refreshed.access_token),
      // Mercado Livre nem sempre emite um refresh_token novo a cada
      // refresh — quando omitido, mantém o que já estava salvo em vez de
      // gravar undefined por cima.
      refresh_token_encrypted: refreshed.refresh_token ? encryptSecret(refreshed.refresh_token) : connection.refresh_token_encrypted,
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      status: 'connected',
      last_error: null,
    })
    .eq('id', connection.id)
    .eq('company_id', companyId)
  if (tokenPersistError) throw new Error(`Failed to persist refreshed Mercado Livre token: ${tokenPersistError.message}`)

  await logSyncEvent({
    companyId,
    connectionId: connection.id,
    provider: 'mercadolivre',
    eventType: 'token_refreshed',
    status: 'success',
    message: 'Access token refreshed before sync',
  })

  return refreshed.access_token
}

/**
 * Runs a full products + inventory + orders sync for the connected Mercado
 * Livre account. Orders power revenue/ticket/product-history aggregation —
 * see docs/integrations/mercadolivre-sync.md.
 */
export async function runMercadoLivreSync(companyId: string): Promise<SyncSummary> {
  const startedAt = new Date()
  const supabase = await getSupabaseAdmin()
  const connection = await loadConnection(companyId)

  const lease = await claimSyncLock(supabase, companyId, connection.id, startedAt)

  await logSyncEvent({
    companyId,
    connectionId: connection.id,
    provider: 'mercadolivre',
    eventType: 'sync_started',
    status: 'info',
    startedAt,
  })

  const errors: string[] = []
  let productsImported = 0
  let inventoryUpdated = 0
  let ordersImported = 0
  // Nome de categoria é a mesma dúzia de valores repetida em todo o
  // catálogo — cacheia por sync em vez de 1 chamada de API por produto.
  const categoryNameCache = new Map<string, string | null>()
  // /orders/search só devolve `seller_sku` do item, sem os `attributes[]`
  // que o catálogo tem — se o vendedor cadastrou o SKU via atributo (não via
  // campo customizado), o pedido não teria de onde puxar. Guarda o SKU já
  // resolvido de cada produto no loop de itens (roda antes) pra reaproveitar
  // no loop de pedidos, sem chamada nova à API do Mercado Livre.
  const skuByProductId = new Map<string, string | null>()

  try {
    const accessToken = await ensureValidAccessToken(connection, companyId)
    await heartbeatSyncLock(supabase, lease)
    const catalogCycle = catalogCheckpoint(connection.catalog_checkpoint, startedAt)
    const itemSearch = await searchUserItemIds(connection.seller_id!, accessToken)
    // O cursor scan expira em minutos, então a lista de IDs é varrida na mesma
    // invocação. O checkpoint persistente guarda apenas a posição do lote de
    // detalhes; nunca tenta reutilizar um cursor externo já expirado.
    const catalogOffset = Math.min(catalogCycle.nextOffset, itemSearch.ids.length)
    const itemIds = itemSearch.ids.slice(catalogOffset, catalogOffset + MAX_ITEMS_FIRST_SYNC)
    const reachedCatalogEnd = itemSearch.complete && catalogOffset + itemIds.length >= itemSearch.ids.length
    if (!itemSearch.complete) {
      errors.push('Catálogo Mercado Livre excedeu o limite seguro de varredura de IDs; nenhuma reconciliação foi executada.')
    }

    const catalogErrorStart = errors.length
    await runWithConcurrency(itemIds, 8, async (itemId) => {
      try {
        const detail = await getItemDetail(itemId, accessToken)
        const productRow = mapItemToProductRow(detail)
        const inventoryRow = mapItemToInventoryRow(detail)
        skuByProductId.set(productRow.external_product_id, productRow.sku)

        let categoryName = categoryNameCache.get(productRow.category_id)
        if (categoryName === undefined) {
          categoryName = await getCategory(productRow.category_id, accessToken)
            .then((c) => c.name)
            .catch(() => null) // categoria não é crítica — segue sem nome se a chamada falhar
          categoryNameCache.set(productRow.category_id, categoryName)
        }

        // cost_price nunca entra aqui de propósito — é sempre o cliente quem
        // informa (nenhum marketplace expõe o custo do vendedor), e o
        // upsert só sobrescreve as colunas presentes no payload.
        const productPayload: Record<string, unknown> = {
          company_id: companyId,
          connection_id: connection.id,
          provider: 'mercadolivre',
          ...productRow,
          category_name: categoryName,
          last_seen_at: new Date().toISOString(),
          active: true,
        }
        if (productRow.price === null) delete productPayload.price
        if (productRow.available_quantity === null) delete productPayload.available_quantity
        const { error: productError } = await supabase.from('marketplace_products').upsert(
          productPayload,
          { onConflict: 'company_id,connection_id,external_product_id' }
        )
        if (productError) throw new Error(`Failed to upsert product ${itemId}: ${productError.message}`)
        productsImported += 1

        const inventoryPayload: Record<string, unknown> = {
          company_id: companyId,
          connection_id: connection.id,
          provider: 'mercadolivre',
          last_sync_at: new Date().toISOString(),
          last_seen_at: new Date().toISOString(),
          active: true,
          ...inventoryRow,
        }
        if (inventoryRow.available_quantity === null) delete inventoryPayload.available_quantity
        const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert(
          inventoryPayload,
          { onConflict: 'company_id,connection_id,external_product_id' }
        )
        if (inventoryError) throw new Error(`Failed to upsert inventory ${itemId}: ${inventoryError.message}`)
        inventoryUpdated += 1
      } catch (itemErr) {
        const message = itemErr instanceof MercadoLivreApiError
          ? itemErr.message
          : itemErr instanceof Error ? itemErr.message : `Unknown error processing item ${itemId}`
        errors.push(message)
      }
    })
    await heartbeatSyncLock(supabase, lease)

    const catalogErrorCount = errors.length - catalogErrorStart
    const catalogHadErrors = catalogCycle.hadErrors || catalogErrorCount > 0
    const catalogTraversalSucceeded = canReconcileCatalog(reachedCatalogEnd, catalogHadErrors ? 1 : 0)
    // O scan de IDs é reconstruído a cada invocação e o offset persistido não
    // representa um snapshot congelado. Desativar ausentes nesse conjunto
    // mutável pode ocultar anúncios válidos; só reativaremos reconciliação
    // quando o ciclo possuir identidade estável comprovada.
    const catalogCanReconcile = false
    const catalogFinishedAt = new Date().toISOString()
    const { error: catalogCheckpointError } = await supabase.from('marketplace_connections').update({
      catalog_checkpoint: {
        cycleStartedAt: catalogCycle.cycleStartedAt,
        nextOffset: reachedCatalogEnd ? 0 : catalogOffset + itemIds.length,
        processed: catalogCycle.processed + itemIds.length,
        complete: reachedCatalogEnd,
        hadErrors: catalogHadErrors,
        reconciled: catalogCanReconcile,
      },
      ...(catalogTraversalSucceeded ? {
        catalog_last_sync_at: catalogFinishedAt,
        inventory_last_sync_at: catalogFinishedAt,
      } : {}),
    }).eq('id', connection.id).eq('company_id', companyId)
    if (catalogCheckpointError) throw new Error(`Failed to persist Mercado Livre catalog checkpoint: ${catalogCheckpointError.message}`)

    let orders: MLOrder[] = []
    const orderWindow = historicalWindow(connection.orders_checkpoint, startedAt, 365, 30)
    let ordersWindowComplete = false
    let ordersWindowTruncated = false
    const orderErrorStart = errors.length
    try {
      const result = await searchOrders(connection.seller_id!, accessToken, orderWindow.from, orderWindow.to)
      orders = result.orders
      if (result.truncated) {
        ordersWindowTruncated = true
        errors.push(`A janela de pedidos Mercado Livre excedeu o limite ${orders.length}; checkpoint não avançou para evitar lacuna histórica.`)
      } else {
        ordersWindowComplete = true
      }
    } catch (searchErr) {
      const message = searchErr instanceof MercadoLivreApiError
        ? searchErr.message
        : searchErr instanceof Error ? searchErr.message : 'Unknown error fetching orders'
      errors.push(message)
    }

    // Erro em 1 pedido não pode abortar os demais — mesmo padrão de
    // isolamento por item que o loop de produtos já usa acima.
    for (const order of orders) {
      try {
        const orderRow = mapOrderToRow(order)
        await persistCanonicalOrder(supabase, {
          companyId, connectionId: connection.id, provider: 'mercadolivre',
          externalOrderId: orderRow.external_order_id,
          canonicalOrderKey: directCanonicalOrderKey('mercadolivre', orderRow.external_order_id),
          salesChannel: 'mercadolivre', status: orderRow.status,
          // `sale_fee` cobre a tarifa de venda por item, mas não comprova o
          // conjunto completo de deduções financeiras do pedido.
          totalAmount: orderRow.total_amount, feeAmount: orderRow.fee_amount, feeStatus: 'partial',
          refundAmount: orderRow.refund_amount, refundStatus: orderRow.refund_status,
          refundUpdatedAt: orderRow.refund_updated_at,
          currency: orderRow.currency, orderedAt: orderRow.ordered_at,
          items: mapOrderItems(order).map((item) => ({ ...item, sku: item.sku ?? skuByProductId.get(item.external_product_id) ?? null })),
        })
        ordersImported += 1

      } catch (orderErr) {
        const message = orderErr instanceof MercadoLivreApiError
          ? orderErr.message
          : orderErr instanceof Error ? orderErr.message : `Unknown error processing order ${order.id}`
        errors.push(message)
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
    if (ordersCheckpointError) throw new Error(`Failed to persist Mercado Livre orders checkpoint: ${ordersCheckpointError.message}`)

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const hadPartialFailures = errors.length > 0 && productsImported > 0

    // Junta até 5 erros num resumo (não só o primeiro) — múltiplas falhas
    // viravam uma mensagem só antes, escondendo que havia mais de um problema.
    const lastErrorSummary = errors.length === 0
      ? null
      : errors.length === 1
        ? errors[0]
        : `${errors.length} erros: ${errors.slice(0, 5).join(' | ')}${errors.length > 5 ? ` (e mais ${errors.length - 5})` : ''}`

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
    if (connectionUpdateError) throw new Error(`Failed to persist Mercado Livre sync outcome: ${connectionUpdateError.message}`)
    await logSyncEvent({
      companyId,
      connectionId: connection.id,
      provider: 'mercadolivre',
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

    const failure = nextIntegrationFailureState(connection.failure_count, finishedAt)
    await supabase.from('marketplace_connections').update({
      status: 'requires_attention', last_error: message,
      failure_count: failure.failureCount, circuit_open_until: failure.circuitOpenUntil, next_sync_at: failure.nextSyncAt,
    }).eq('id', connection.id).eq('company_id', companyId)
    await logSyncEvent({
      companyId,
      connectionId: connection.id,
      provider: 'mercadolivre',
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
