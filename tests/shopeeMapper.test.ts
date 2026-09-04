import { describe, expect, it } from 'vitest'
import {
  extractShopeeAvailableQuantity,
  extractShopeePrice,
  mapItemToInventoryRow,
  mapItemToProductRow,
  mapOrderToRow,
  normalizeShopeeOrderStatus,
} from '../src/server/integrations/shopee/mapper.js'
import type { ShopeeItem, ShopeeOrder } from '../src/server/integrations/shopee/types.js'

const baseItem: ShopeeItem = {
  item_id: 123,
  item_name: 'Produto real',
  item_status: 'NORMAL',
}

const baseOrder: ShopeeOrder = {
  order_sn: 'ORDER-1',
  order_status: 'COMPLETED',
  create_time: 1_700_000_000,
  update_time: 1_700_086_400,
  total_amount: 199.9,
  currency: 'BRL',
  item_list: [],
}

describe('Shopee mapper data integrity', () => {
  it('reads verified price and stock fields when present', () => {
    const item: ShopeeItem = {
      ...baseItem,
      price_info: [{ current_price: 89.9, original_price: 99.9 }],
      stock_info_v2: { summary_info: { total_available_stock: 17 } },
    }

    expect(extractShopeePrice(item)).toBe(89.9)
    expect(extractShopeeAvailableQuantity(item)).toBe(17)
    expect(mapItemToProductRow(item, null).price).toBe(89.9)
    expect(mapItemToInventoryRow(item).available_quantity).toBe(17)
  })

  it('keeps unavailable price and stock unknown instead of fabricating zero', () => {
    expect(extractShopeePrice(baseItem)).toBeNull()
    expect(extractShopeeAvailableQuantity(baseItem)).toBeNull()
    expect(mapItemToProductRow(baseItem, null).price).toBeNull()
    expect(mapItemToInventoryRow(baseItem).available_quantity).toBeNull()
  })

  it('preserves a verified zero value', () => {
    const item: ShopeeItem = {
      ...baseItem,
      price_info: [{ current_price: 0 }],
      stock_info_v2: { summary_info: { total_available_stock: 0 } },
    }
    expect(extractShopeePrice(item)).toBe(0)
    expect(extractShopeeAvailableQuantity(item)).toBe(0)
  })

  it('normalizes the provider brand identity when available', () => {
    const row = mapItemToProductRow({ ...baseItem, brand: { brand_id: 42, display_brand_name: ' Marca Oficial ' } }, null)
    expect(row.brand_external_id).toBe('42')
    expect(row.brand_name).toBe('Marca Oficial')
  })

  it('uses order creation time and marks unavailable fees as unknown', () => {
    const row = mapOrderToRow(baseOrder)
    expect(row.ordered_at).toBe(new Date(baseOrder.create_time * 1000).toISOString())
    expect(row.ordered_at).not.toBe(new Date(baseOrder.update_time * 1000).toISOString())
    expect(row.fee_amount).toBeNull()
    expect(row.status).toBe('paid')
  })

  it('normalizes Shopee lifecycle statuses to the analytics contract', () => {
    expect(normalizeShopeeOrderStatus('READY_TO_SHIP')).toBe('paid')
    expect(normalizeShopeeOrderStatus('COMPLETED')).toBe('paid')
    expect(normalizeShopeeOrderStatus('TO_RETURN')).toBe('paid')
    expect(normalizeShopeeOrderStatus('RETURNED')).toBe('paid')
    expect(normalizeShopeeOrderStatus('CANCELLED')).toBe('cancelled')
    expect(normalizeShopeeOrderStatus('UNPAID')).toBe('unpaid')
  })

  it('keeps captured revenue while a return has no confirmed refund', () => {
    for (const orderStatus of ['TO_RETURN', 'RETURNED']) {
      const row = mapOrderToRow({ ...baseOrder, order_status: orderStatus })
      expect(row.status).toBe('paid')
      expect(row.total_amount).toBe(baseOrder.total_amount)
      expect(row.raw_payload.order_status).toBe(orderStatus)
    }
  })
})
