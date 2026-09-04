import { describe, expect, it } from 'vitest'
import { selectDashboardProductMatches, type DashboardProduct } from '../src/server/dashboardProducts.js'

const base = {
  sku: 'SKU-1', name: 'Produto', marketplace: 'Mercado Livre' as const,
  categoryId: null, category: null, price: 10, costPrice: null, margin: null,
  stock: 1, revenue: 0, units: 0, trend: null, sharePct: 0,
}

describe('product detail identity', () => {
  const items: DashboardProduct[] = [
    { ...base, id: '100', connectionId: 'ml' },
    { ...base, id: '100', connectionId: 'shopee', marketplace: 'Shopee' },
  ]

  it('uses connection plus external product id when the explicit reference exists', () => {
    expect(selectDashboardProductMatches(items, 'SKU-1', { connectionId: 'ml', externalProductId: '100' })).toEqual([items[0]])
  })

  it('keeps legacy SKU links compatible without pretending the match is exact', () => {
    expect(selectDashboardProductMatches(items, 'SKU-1')).toHaveLength(2)
  })
})
