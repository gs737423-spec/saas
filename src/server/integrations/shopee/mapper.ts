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
  price: number
  available_quantity: number
  sold_quantity: number
  permalink: string
  category_id: string
  raw_payload: ShopeeItem
}

export interface NormalizedInventoryRow {
  external_product_id: string
  sku: string | null
  title: string
  available_quantity: number
  sold_quantity_30d: number | null
  raw_payload: ShopeeItem
}

export interface NormalizedOrderRow {
  external_order_id: string
  status: string
  total_amount: number
  fee_amount: number
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

export function mapItemToProductRow(item: ShopeeItem, permalink: string | null): NormalizedProductRow {
  return {
    external_product_id: String(item.item_id),
    sku: item.item_sku ?? null,
    title: item.item_name,
    status: item.item_status,
    // TODO: preço real vem de get_item_base_info -> price_info, não
    // modelado ainda em ShopeeItem — confirmar campo exato contra a doc de
    // parceiro antes do primeiro sync real.
    price: 0,
    available_quantity: 0,
    sold_quantity: 0,
    permalink: permalink ?? '',
    category_id: item.category_id ? String(item.category_id) : '',
    raw_payload: item,
  }
}

export function mapItemToInventoryRow(item: ShopeeItem): NormalizedInventoryRow {
  return {
    external_product_id: String(item.item_id),
    sku: item.item_sku ?? null,
    title: item.item_name,
    available_quantity: 0,
    sold_quantity_30d: null,
    raw_payload: item,
  }
}

export function mapOrderToRow(order: ShopeeOrder): NormalizedOrderRow {
  return {
    external_order_id: order.order_sn,
    status: order.order_status,
    total_amount: order.total_amount,
    // TODO: Shopee não devolve comissão no payload do pedido como o
    // Mercado Livre — precisa de endpoint de escrow/fees separado
    // (get_escrow_detail). Fica 0 até implementarmos essa chamada.
    fee_amount: 0,
    currency: order.currency || SHOPEE_CURRENCY_FALLBACK,
    buyer_external_id: order.buyer_user_id ? String(order.buyer_user_id) : null,
    ordered_at: new Date(order.update_time * 1000).toISOString(),
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
