import type { ShopeeItem, ShopeeOrder } from './types.js'

// Mesmo shape de coluna que o Mercado Livre usa (ver
// mercadolivre/mapper.ts) — sync.ts e o resto do dashboard não sabem de
// qual provider veio o dado, só leem essas colunas. Tipos próprios (não
// reaproveita os do ML) porque `raw_payload` tem formato diferente por
// provider.

export interface NormalizedProductRow {
  external_product_id: string
  sku: string | null
  title: string
  status: string
  price: number | null
  available_quantity: number | null
  sold_quantity: number | null
  permalink: string
  category_id: string
  brand_name: string | null
  brand_external_id: string | null
  raw_payload: ShopeeItem
}

export interface NormalizedInventoryRow {
  external_product_id: string
  sku: string | null
  title: string
  available_quantity: number | null
  sold_quantity_30d: number | null
  raw_payload: ShopeeItem
}

export interface NormalizedOrderRow {
  external_order_id: string
  status: string
  total_amount: number
  fee_amount: number | null
  currency: string
  buyer_external_id: string | null
  ordered_at: string
  raw_payload: ShopeeOrder
}

export interface NormalizedOrderItemRow {
  external_product_id: string
  sku: string | null
  title: string
  quantity: number
  unit_price: number
}

const SHOPEE_CURRENCY_FALLBACK = 'BRL'

function finiteNonNegative(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

export function extractShopeePrice(item: ShopeeItem): number | null {
  for (const price of item.price_info ?? []) {
    const current = finiteNonNegative(price.current_price)
    if (current !== null) return current
    const original = finiteNonNegative(price.original_price)
    if (original !== null) return original
  }
  return null
}

export function extractShopeeAvailableQuantity(item: ShopeeItem): number | null {
  const summary = finiteNonNegative(item.stock_info_v2?.summary_info?.total_available_stock)
  if (summary !== null) return summary

  const legacyStocks = item.stock_info ?? []
  if (legacyStocks.length === 0) return null
  const values = legacyStocks.map((stock) => finiteNonNegative(stock.current_stock ?? stock.normal_stock))
  return values.every((value) => value !== null)
    ? values.reduce<number>((sum, value) => sum + (value ?? 0), 0)
    : null
}

export function normalizeShopeeOrderStatus(status: string): string {
  const normalized = status.trim().toUpperCase()
  if (['CANCELLED', 'IN_CANCEL'].includes(normalized)) return 'cancelled'
  // TO_RETURN/RETURNED describe fulfillment, not proof of a financial refund.
  // Until refund ingestion is available, keep captured revenue classified paid.
  if (['READY_TO_SHIP', 'PROCESSED', 'SHIPPED', 'COMPLETED', 'TO_RETURN', 'RETURNED'].includes(normalized)) return 'paid'
  return normalized.toLowerCase() || 'unknown'
}

export function mapItemToProductRow(item: ShopeeItem, permalink: string | null): NormalizedProductRow {
  return {
    external_product_id: String(item.item_id),
    sku: item.item_sku ?? null,
    title: item.item_name,
    status: item.item_status,
    price: extractShopeePrice(item),
    available_quantity: extractShopeeAvailableQuantity(item),
    sold_quantity: finiteNonNegative(item.sold),
    permalink: permalink ?? '',
    category_id: item.category_id ? String(item.category_id) : '',
    brand_name: item.brand?.display_brand_name?.trim() || item.brand?.original_brand_name?.trim() || null,
    brand_external_id: item.brand?.brand_id == null ? null : String(item.brand.brand_id),
    raw_payload: item,
  }
}

export function mapItemToInventoryRow(item: ShopeeItem): NormalizedInventoryRow {
  return {
    external_product_id: String(item.item_id),
    sku: item.item_sku ?? null,
    title: item.item_name,
    available_quantity: extractShopeeAvailableQuantity(item),
    sold_quantity_30d: null,
    raw_payload: item,
  }
}

export function mapOrderToRow(order: ShopeeOrder): NormalizedOrderRow {
  return {
    external_order_id: order.order_sn,
    status: normalizeShopeeOrderStatus(order.order_status),
    total_amount: order.total_amount,
    // O detalhe do pedido não comprova as taxas. `null` preserva a diferença
    // entre "sem taxa" e "taxa ainda não importada".
    fee_amount: null,
    currency: order.currency || SHOPEE_CURRENCY_FALLBACK,
    buyer_external_id: order.buyer_user_id ? String(order.buyer_user_id) : null,
    ordered_at: new Date(order.create_time * 1000).toISOString(),
    raw_payload: order,
  }
}

export function mapOrderItems(order: ShopeeOrder): NormalizedOrderItemRow[] {
  return order.item_list.map((oi) => ({
    external_product_id: String(oi.item_id),
    sku: oi.item_sku ?? null,
    title: oi.item_name,
    quantity: oi.model_quantity_purchased,
    unit_price: oi.model_discounted_price,
  }))
}
