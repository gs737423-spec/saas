import { describe, expect, it } from 'vitest'
import { categoryKey, getCategoryMetrics, getCategoryOptions, getCategoryProducts, getTopCategory, matchesCategoryFilter, UNCATEGORISED_KEY } from '../src/lib/categoryAnalytics'

const item = (id: string, categoryId: string | null, categoryName: string | null, revenue: number, units = 1, stock: number | null = 1) => ({ id, name: id, sku: id, marketplace: 'Mercado Livre', categoryId, categoryName, revenue, units, stock })

describe('category analytics', () => {
  const items = [
    item('a', 'CAT-1', 'Acessórios', 100, 3, 5),
    item('b', 'CAT-1', 'Acessórios', 250, 7, 9),
    item('c', 'CAT-2', 'Casa', 200, 4, 6),
    item('d', null, null, 50, 1, 2),
  ]

  it('uses the existing category id as identity', () => {
    expect(categoryKey(items[0])).toBe('id:CAT-1')
  })

  it('calculates the top category by revenue', () => {
    expect(getTopCategory(items)).toMatchObject({ key: 'id:CAT-1', revenue: 350, productCount: 2 })
  })

  it('filters and sorts drawer products by revenue', () => {
    expect(getCategoryProducts(items, 'id:CAT-1').map((product) => product.id)).toEqual(['b', 'a'])
  })

  it('aggregates revenue, sales and inventory correctly', () => {
    expect(getCategoryMetrics(items, 'id:CAT-1')).toMatchObject({ revenue: 350, units: 10, stock: 14 })
  })

  it('does not fabricate a category stock total when a product has no inventory data', () => {
    const withUnknownInventory = [...items, item('unknown', 'CAT-1', 'Acessórios', 20, 1, null)]
    expect(getCategoryMetrics(withUnknownInventory, 'id:CAT-1')).toMatchObject({ stock: null })
  })

  it('exposes uncategorised products as a filterable option', () => {
    expect(getCategoryOptions(items)).toContainEqual({ key: UNCATEGORISED_KEY, label: 'Sem categoria' })
    expect(getCategoryProducts(items, UNCATEGORISED_KEY).map((product) => product.id)).toEqual(['d'])
  })

  it('returns an empty result for an unknown category', () => {
    expect(getCategoryMetrics(items, 'missing')).toBeNull()
  })

  it('composes a selected category with additional filters', () => {
    const selected = new Set(['id:CAT-1'])
    const result = items.filter((product) => matchesCategoryFilter(product, selected) && product.stock >= 9)
    expect(result.map((product) => product.id)).toEqual(['b'])
  })
})
