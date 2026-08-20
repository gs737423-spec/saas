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
}

async function loadConnection(companyId: string): Promise<ConnectionRow> {
  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('id, status, seller_id, access_token_encrypted, refresh_token_encrypted, token_expires_at')
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
  await supabase
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
    const itemIds = await searchUserItemIds(connection.seller_id!, accessToken)
    // Teto de segurança atingido — catálogo real tem mais itens do que o sync
    // trouxe. Não é um erro (sync continua normalmente pros itens buscados),
    // mas o cliente precisa saber que o catálogo está incompleto, não achar
    // que só tem esses produtos. Vira aviso visível em "Atividade recente".
    if (itemIds.length >= MAX_ITEMS_FIRST_SYNC) {
      errors.push(`Catálogo tem mais de ${MAX_ITEMS_FIRST_SYNC} produtos — sync trouxe só os primeiros ${MAX_ITEMS_FIRST_SYNC}, o restante não foi importado.`)
    }

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
        const { error: productError } = await supabase.from('marketplace_products').upsert(
          {
            company_id: companyId,
            connection_id: connection.id,
            provider: 'mercadolivre',
            ...productRow,
            category_name: categoryName,
          },
          { onConflict: 'company_id,connection_id,external_product_id' }
        )
        if (productError) throw new Error(`Failed to upsert product ${itemId}: ${productError.message}`)
        productsImported += 1

        const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert(
          {
            company_id: companyId,
            connection_id: connection.id,
            provider: 'mercadolivre',
            last_sync_at: new Date().toISOString(),
            ...inventoryRow,
          },
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

    let orders: MLOrder[] = []
    try {
      const result = await searchOrders(connection.seller_id!, accessToken)
      orders = result.orders
      if (result.truncated) {
        errors.push(`Mais pedidos no último ano do que o sync conseguiu importar de uma vez (limite ${orders.length}) — histórico mais antigo pode estar incompleto, rode o sync de novo em breve.`)
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
          totalAmount: orderRow.total_amount, feeAmount: orderRow.fee_amount,
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

    await supabase
      .from('marketplace_connections')
      .update({ last_sync_at: finishedAt.toISOString(), status: 'connected', last_error: lastErrorSummary })
      .eq('id', connection.id)
      .eq('company_id', companyId)
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

    await supabase.from('marketplace_connections').update({ status: 'error', last_error: message }).eq('id', connection.id).eq('company_id', companyId)
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
