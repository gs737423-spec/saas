import { useMemo, useState } from 'react'
import ProductFilters from '@/components/produtos/ProductFilters'
import { defaultProductFilters } from '@/components/produtos/ProductFilters'
import type { ProductFilterState } from '@/components/produtos/ProductFilters'
import ProductKPIs from '@/components/produtos/ProductKPIs'
import ProductTable from '@/components/produtos/ProductTable'
import { products } from '@/data/mockData'
import { buildPeriodOptions, BASELINE_DAYS } from '@/lib/periods'

const periodOptions = buildPeriodOptions()

export default function Produtos() {
  const [filters, setFilters] = useState<ProductFilterState>(defaultProductFilters)

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.marketplaces.size > 0 && !filters.marketplaces.has(p.marketplace)) return false
      if (filters.category !== 'all' && p.category !== filters.category) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !p.sku.toLowerCase().includes(q) &&
          !p.category.toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [filters])

  // Scale revenue + units to the selected period. Both scale together so
  // ratios (ticket médio, margin %) stay realistic — only totals move.
  const periodProducts = useMemo(() => {
    const period = periodOptions.find((p) => p.key === filters.period) ?? periodOptions[0]
    const scale = (period.days / BASELINE_DAYS) * period.jitter
    return filteredProducts.map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * scale),
      units: Math.max(0, Math.round(p.units * scale)),
    }))
  }, [filteredProducts, filters.period])

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <ProductFilters filters={filters} onChange={setFilters} />

      <ProductKPIs products={periodProducts} />

      <ProductTable filteredProducts={periodProducts} />
    </div>
  )
}
