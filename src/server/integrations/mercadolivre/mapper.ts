import type { MLItemDetail } from './types.js'

function extractSku(item: MLItemDetail): string | null {
  if (item.seller_custom_field) return item.seller_custom_field
  const skuAttr = item.attributes?.find((a) => a.id === 'SELLER_SKU')
  return skuAttr?.value_name ?? null
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
    price: item.price,
    available_quantity: item.available_quantity,
    sold_quantity: item.sold_quantity,
    permalink: item.permalink,
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
    available_quantity: item.available_quantity,
    // TODO: /items/{id} only exposes lifetime `sold_quantity`, not a rolling 30-day
    // figure. A real 30d number requires aggregating from orders once that endpoint
    // is validated (see docs/integrations/mercadolivre-sync.md) — left null until then
    // rather than guessing.
    sold_quantity_30d: null,
    raw_payload: item,
  }
}
