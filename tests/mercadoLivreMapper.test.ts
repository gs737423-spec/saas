import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { mapItemToInventoryRow, mapItemToProductRow, mapOrderToRow } from '../src/server/integrations/mercadolivre/mapper.js'
import type { MLItemDetail, MLOrder } from '../src/server/integrations/mercadolivre/types.js'

describe('Mercado Livre product identity', () => {
  it('normalizes the BRAND attribute without confusing it with SKU', () => {
    const item: MLItemDetail = {
      id: 'MLB1', title: 'Produto', status: 'active', price: 10,
      available_quantity: 1, sold_quantity: 0, permalink: 'https://example.test/item',
      category_id: 'MLB1', attributes: [
        { id: 'SELLER_SKU', value_name: 'SKU-1' },
        { id: 'BRAND', value_name: 'Marca Real' },
      ],
    }
    const row = mapItemToProductRow(item)
    expect(row.sku).toBe('SKU-1')
    expect(row.brand_name).toBe('Marca Real')
  })

  it('keeps missing price and stock unknown instead of fabricating zero', () => {
    const item: MLItemDetail = {
      id: 'MLB2', title: 'Produto sem snapshot', status: 'paused', price: null,
      available_quantity: null, sold_quantity: 0, permalink: 'https://example.test/item-2',
      category_id: 'MLB2', attributes: [],
    }

    expect(mapItemToProductRow(item).price).toBeNull()
    expect(mapItemToProductRow(item).available_quantity).toBeNull()
    expect(mapItemToInventoryRow(item).available_quantity).toBeNull()
  })

  it('does not turn a partially missing variation stock snapshot into zero', () => {
    const item: MLItemDetail = {
      id: 'MLB3', title: 'Produto com variações', status: 'active', price: null,
      available_quantity: null, sold_quantity: 0, permalink: 'https://example.test/item-3',
      category_id: 'MLB3', attributes: [],
      variations: [{ available_quantity: 4 }, { available_quantity: null }],
    }

    expect(mapItemToProductRow(item).available_quantity).toBeNull()
    expect(mapItemToProductRow(item).price).toBeNull()
  })

  it('omits unknown snapshots from upserts so a previous valid value survives', () => {
    const syncSource = readFileSync(new URL('../src/server/integrations/mercadolivre/sync.ts', import.meta.url), 'utf8')
    expect(syncSource).toContain('if (productRow.price === null) delete productPayload.price')
    expect(syncSource).toContain('if (productRow.available_quantity === null) delete productPayload.available_quantity')
    expect(syncSource).toContain('if (inventoryRow.available_quantity === null) delete inventoryPayload.available_quantity')
  })
})

describe('Mercado Livre refund normalization', () => {
  const order = (overrides: Partial<MLOrder> = {}): MLOrder => ({
    id: 10,
    status: 'paid',
    date_created: '2026-08-01T10:00:00Z',
    date_closed: '2026-08-01T10:05:00Z',
    total_amount: 100,
    currency_id: 'BRL',
    buyer: null,
    order_items: [{ item: { id: 'MLB1', title: 'Produto' }, quantity: 1, unit_price: 100, sale_fee: 12 }],
    ...overrides,
  })

  it('reads provider-confirmed refunded amounts and keeps the sale in revenue', () => {
    const row = mapOrderToRow(order({
      status: 'partially_refunded',
      payments: [{ id: 1, status: 'approved', transaction_amount: 100, transaction_amount_refunded: 25, date_last_modified: '2026-08-03T09:00:00Z' }],
    }))
    expect(row.status).toBe('paid')
    expect(row.refund_amount).toBe(25)
    expect(row.refund_status).toBe('known')
    expect(row.refund_updated_at).toBe('2026-08-03T09:00:00Z')
  })

  it('does not turn a missing payment field into a known zero', () => {
    const row = mapOrderToRow(order({ payments: [{ id: 1, status: 'approved', transaction_amount: 100 }] }))
    expect(row.refund_amount).toBeNull()
    expect(row.refund_status).toBe('unknown')
  })

  it('marks mixed payment coverage as partial and sums only informed refunds', () => {
    const row = mapOrderToRow(order({ payments: [
      { id: 1, transaction_amount_refunded: 10 },
      { id: 2 },
    ] }))
    expect(row.refund_amount).toBe(10)
    expect(row.refund_status).toBe('partial')
  })
})
