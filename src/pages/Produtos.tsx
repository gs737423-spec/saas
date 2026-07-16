import { useMemo, useState } from 'react'
import { defaultProductFilters } from '@/components/produtos/ProductFilters'
import type { ProductFilterState } from '@/components/produtos/ProductFilters'
import ProductKPIs from '@/components/produtos/ProductKPIs'
import ProductTable from '@/components/produtos/ProductTable'
import { products } from '@/data/mockData'
import { BASELINE_DAYS } from '@/lib/periods'
import { usePeriod } from '@/contexts/PeriodContext'

export default function Produtos() {
  const [filters, setFilters] = useState<ProductFilterState>(defaultProductFilters)
  const { period } = usePeriod()

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (filters.marketplaces.size > 0 && !filters.marketplaces.has(p.marketplace)) return false
      if (filters.categories.size > 0 && !filters.categories.has(p.category)) return false
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

  // Scale revenue + units to the globally-selected period (topbar calendar
  // dropdown). Both scale together so ratios (ticket médio, margin %) stay
  // realistic — only totals move.
  const periodProducts = useMemo(() => {
    const scale = (period.days / BASELINE_DAYS) * period.jitter
    return filteredProducts.map((p) => ({
      ...p,
      revenue: Math.round(p.revenue * scale),
      units: Math.max(0, Math.round(p.units * scale)),
    }))
  }, [filteredProducts, period])

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <div className="motion-block-in">
        <ProductKPIs products={periodProducts} />
      </div>

      <div className="motion-block-in motion-block-in-2">
        <ProductTable filteredProducts={periodProducts} filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  )
}
