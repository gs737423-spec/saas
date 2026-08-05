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

export class ShopeeApiError extends Error {
  constructor(message: string, public status: number, public path: string) {
    super(message)
  }
}

async function shopeeFetch<T>(path: string, accessToken: string, shopId: string, extraParams: Record<string, string> = {}): Promise<T> {
  const { timestamp, sign, partnerId } = signShopRequest(path, accessToken, shopId)
  const url = new URL(`${SHOPEE_API_HOST}${path}`)
  url.searchParams.set('partner_id', partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', sign)
  url.searchParams.set('access_token', accessToken)
  url.searchParams.set('shop_id', shopId)
  for (const [key, value] of Object.entries(extraParams)) url.searchParams.set(key, value)

  const res = await fetch(url.toString())
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new ShopeeApiError(`Shopee API ${res.status} on ${path}: ${body.slice(0, 300)}`, res.status, path)
  }
  return (await res.json()) as T
}

/** Paginates GET /api/v2/product/get_item_list. */
export async function searchShopItemIds(accessToken: string, shopId: string): Promise<number[]> {
  const ids: number[] = []
  let offset = 0

  while (ids.length < MAX_ITEMS_FIRST_SYNC) {
    const page = await shopeeFetch<ShopeeItemListResponse>('/api/v2/product/get_item_list', accessToken, shopId, {
      offset: String(offset),
      page_size: String(ITEMS_PAGE_SIZE),
      item_status: 'NORMAL',
    })
    const items = page.response.item ?? []
    ids.push(...items.map((i) => i.item_id))
    if (!page.response.has_next_page || items.length === 0) break
    offset = page.response.next_offset ?? offset + items.length
  }

  return ids.slice(0, MAX_ITEMS_FIRST_SYNC)
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
export async function searchOrders(accessToken: string, shopId: string): Promise<ShopeeOrder[]> {
  const orderSns: string[] = []
  let cursor = ''

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
    if (!page.response.more || results.length === 0) break
    cursor = page.response.next_cursor ?? ''
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

  return orders
}
