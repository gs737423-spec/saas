import { signShopRequest, SHOPEE_API_HOST } from './auth.js'
import type {
  ShopeeItem,
  ShopeeItemBaseInfoResponse,
  ShopeeItemListResponse,
  ShopeeOrder,
  ShopeeOrderDetailResponse,
  ShopeeOrderListResponse,
} from './types.js'

export const MAX_ITEMS_FIRST_SYNC = 2000
const ITEMS_PAGE_SIZE = 50
export const MAX_ORDERS_FIRST_SYNC = 2000
const ORDERS_PAGE_SIZE = 50
// Limite documentado da Shopee pra get_order_detail por chamada.
const ORDER_DETAIL_BATCH_SIZE = 50
const REQUEST_TIMEOUT_MS = 15_000
const MAX_RETRIES = 4
const RETRY_BASE_MS = 500

export class ShopeeApiError extends Error {
  constructor(message: string, public status: number, public path: string) {
    super(message)
  }
}

function retryAfterMs(value: string | null, now = Date.now()): number | null {
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const date = Date.parse(value)
  return Number.isNaN(date) ? null : Math.max(0, date - now)
}

function retryDelayMs(attempt: number, retryAfter: string | null): number {
  const instructed = retryAfterMs(retryAfter)
  if (instructed !== null) return instructed
  const exponential = RETRY_BASE_MS * 2 ** attempt
  return exponential + Math.floor(Math.random() * exponential * 0.5)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function shopeeFetch<T>(path: string, accessToken: string, shopId: string, extraParams: Record<string, string> = {}, attempt = 0): Promise<T> {
  const { timestamp, sign, partnerId } = signShopRequest(path, accessToken, shopId)
  const url = new URL(`${SHOPEE_API_HOST}${path}`)
  url.searchParams.set('partner_id', partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', sign)
  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('shop_id', shopId)
  for (const [key, value] of Object.entries(extraParams)) url.searchParams.set(key, value)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch(url.toString(), { signal: controller.signal })
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      clearTimeout(timeout)
      await sleep(retryDelayMs(attempt, null))
      return shopeeFetch<T>(path, accessToken, shopId, extraParams, attempt + 1)
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ShopeeApiError(`Shopee API timeout (${REQUEST_TIMEOUT_MS}ms) on ${path}`, 0, path)
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }

  if ((res.status === 429 || res.status >= 500) && attempt < MAX_RETRIES) {
    clearTimeout(timeout)
    await sleep(retryDelayMs(attempt, res.headers.get('retry-after')))
    return shopeeFetch<T>(path, accessToken, shopId, extraParams, attempt + 1)
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ShopeeApiError(`Shopee API ${res.status} on ${path}: ${body.slice(0, 300)}`, res.status, path)
  }
  return (await res.json()) as T
}

export interface ShopeeSearchResult<T> {
  records: T[]
  partial: boolean
  reason?: string
}

/** Paginates GET /api/v2/product/get_item_list. */
export async function searchShopItemIds(accessToken: string, shopId: string): Promise<ShopeeSearchResult<number>> {
  const ids: number[] = []
  let offset = 0
  let hasMore = false

  while (ids.length < MAX_ITEMS_FIRST_SYNC) {
    const page = await shopeeFetch<ShopeeItemListResponse>('/api/v2/product/get_item_list', accessToken, shopId, {
      offset: String(offset),
      page_size: String(ITEMS_PAGE_SIZE),
      item_status: 'NORMAL',
    })
    const items = page.response.item ?? []
    ids.push(...items.map((i) => i.item_id))
    hasMore = page.response.has_next_page
    if (!hasMore || items.length === 0) break
    const nextOffset = page.response.next_offset ?? offset + items.length
    if (nextOffset <= offset) {
      return { records: ids.slice(0, MAX_ITEMS_FIRST_SYNC), partial: true, reason: `Shopee devolveu offset sem avanço (${nextOffset}).` }
    }
    offset = nextOffset
  }

  const partial = hasMore && ids.length >= MAX_ITEMS_FIRST_SYNC
  return {
    records: ids.slice(0, MAX_ITEMS_FIRST_SYNC),
    partial,
    reason: partial ? `Catálogo Shopee excede o limite seguro de ${MAX_ITEMS_FIRST_SYNC} itens por execução.` : undefined,
  }
}

/** GET /api/v2/product/get_item_base_info — em lote (até 50 ids por chamada
 *  segundo a doc pública; ajustar se a Shopee documentar outro teto). */
export async function getItemBaseInfoBatch(itemIds: number[], accessToken: string, shopId: string): Promise<ShopeeItem[]> {
  if (itemIds.length === 0) return []
  const res = await shopeeFetch<ShopeeItemBaseInfoResponse>('/api/v2/product/get_item_base_info', accessToken, shopId, {
    item_id_list: itemIds.join(','),
  })
  return res.response.item_list ?? []
}

/** Paginates GET /api/v2/order/get_order_list (por cursor, mais recente
 *  primeiro), depois busca detalhe em lote via get_order_detail. */
export async function searchOrders(accessToken: string, shopId: string): Promise<ShopeeSearchResult<ShopeeOrder>> {
  const orderSns: string[] = []
  let cursor = ''
  let hasMore = false

  while (orderSns.length < MAX_ORDERS_FIRST_SYNC) {
    const page = await shopeeFetch<ShopeeOrderListResponse>('/api/v2/order/get_order_list', accessToken, shopId, {
      time_range_field: 'create_time',
      time_from: String(Math.floor(Date.now() / 1000) - 90 * 86400),
      time_to: String(Math.floor(Date.now() / 1000)),
      page_size: String(ORDERS_PAGE_SIZE),
      cursor,
    })
    const results = page.response.order_list ?? []
    orderSns.push(...results.map((o) => o.order_sn))
    hasMore = page.response.more
    if (!hasMore || results.length === 0) break
    const nextCursor = page.response.next_cursor ?? ''
    if (!nextCursor || nextCursor === cursor) {
      return { records: [], partial: true, reason: 'Shopee devolveu cursor de pedidos sem avanço; detalhes não foram importados para evitar resultado ambíguo.' }
    }
    cursor = nextCursor
  }

  const capped = orderSns.slice(0, MAX_ORDERS_FIRST_SYNC)
  const orders: ShopeeOrder[] = []
  for (let i = 0; i < capped.length; i += ORDER_DETAIL_BATCH_SIZE) {
    const batch = capped.slice(i, i + ORDER_DETAIL_BATCH_SIZE)
    const detail = await shopeeFetch<ShopeeOrderDetailResponse>('/api/v2/order/get_order_detail', accessToken, shopId, {
      order_sn_list: batch.join(','),
    })
    orders.push(...(detail.response.order_list ?? []))
  }

  const partial = hasMore && orderSns.length >= MAX_ORDERS_FIRST_SYNC
  return {
    records: orders,
    partial,
    reason: partial ? `Pedidos Shopee excedem o limite seguro de ${MAX_ORDERS_FIRST_SYNC} por execução (janela de 90 dias).` : undefined,
  }
}
