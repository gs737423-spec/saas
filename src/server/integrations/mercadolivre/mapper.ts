import type { MLItemDetail, MLOrder } from './types.js'

function extractSku(item: MLItemDetail): string | null {
  if (item.seller_custom_field) return item.seller_custom_field
  const skuAttr = item.attributes?.find((a) => a.id === 'SELLER_SKU')
  return skuAttr?.value_name ?? null
}

/** Anúncio com variações (tamanho/cor) não tem `available_quantity` no nível
 *  raiz — o estoque real é a soma de cada variação. Sem variações, usa o
 *  campo raiz direto (pode vir null em anúncios pausados/sem preço ativo). */
function extractAvailableQuantity(item: MLItemDetail): number {
  if (item.variations && item.variations.length > 0) {
    return item.variations.reduce((sum, v) => sum + (v.available_quantity ?? 0), 0)
  }
  return item.available_quantity ?? 0
}

function extractPrice(item: MLItemDetail): number {
  if (item.price != null) return item.price
  if (item.variations && item.variations.length > 0) {
    const withPrice = item.variations.find((v) => v.price != null)
    if (withPrice?.price != null) return withPrice.price
  }
  return 0
}

export interface NormalizedProductRow {
  external_product_id: string
  sku: string | null
  title: string
  status: string
  price: number
  available_quantity: number
  sold_quantity: number
  permalink: string
  category_id: string
  raw_payload: MLItemDetail
}

/** The dashboard/UI must never read `MLItemDetail` field names directly — this is the
 *  only place that translates Mercado Livre's raw shape into the internal model. */
export function mapItemToProductRow(item: MLItemDetail): NormalizedProductRow {
  return {
    external_product_id: item.id,
    sku: extractSku(item),
    title: item.title,
    status: item.status,
    price: extractPrice(item),
    available_quantity: extractAvailableQuantity(item),
    sold_quantity: item.sold_quantity,
    permalink: item.permalink,
    category_id: item.category_id,
    raw_payload: item,
  }
}

export interface NormalizedInventoryRow {
  external_product_id: string
  sku: string | null
  title: string
  available_quantity: number
  sold_quantity_30d: number | null
  raw_payload: MLItemDetail
}

export function mapItemToInventoryRow(item: MLItemDetail): NormalizedInventoryRow {
  return {
    external_product_id: item.id,
    sku: extractSku(item),
    title: item.title,
    available_quantity: extractAvailableQuantity(item),
    // TODO: /items/{id} only exposes lifetime `sold_quantity`, not a rolling 30-day
    // figure. A real 30d number requires aggregating from orders once that endpoint
    // is validated (see docs/integrations/mercadolivre-sync.md) — left null until then
    // rather than guessing.
    sold_quantity_30d: null,
    raw_payload: item,
  }
}

export interface NormalizedOrderRow {
  external_order_id: string
  status: string
  total_amount: number
  fee_amount: number
  currency: string
  buyer_external_id: string | null
  ordered_at: string
  raw_payload: MLOrder
}

export interface NormalizedOrderItemRow {
  external_product_id: string
  sku: string | null
  title: string
  quantity: number
  unit_price: number
}

/** O dashboard nunca deve ler o shape cru de `MLOrder` — só este mapper traduz
 *  pra o modelo interno (mesma regra do mapItemTo* acima). */
export function mapOrderToRow(order: MLOrder): NormalizedOrderRow {
  const feeAmount = order.order_items.reduce((sum, oi) => sum + (oi.sale_fee ?? 0), 0)
  return {
    external_order_id: String(order.id),
    status: order.status,
    total_amount: order.total_amount,
    fee_amount: feeAmount,
    currency: order.currency_id,
    buyer_external_id: order.buyer ? String(order.buyer.id) : null,
    ordered_at: order.date_closed ?? order.date_created,
    raw_payload: order,
  }
}

export function mapOrderItems(order: MLOrder): NormalizedOrderItemRow[] {
  return order.order_items.map((oi) => ({
    external_product_id: oi.item.id,
    sku: oi.item.seller_sku ?? null,
    title: oi.item.title,
    quantity: oi.quantity,
    unit_price: oi.unit_price,
  }))
}
