import { useMemo, useState } from 'react'
import ProductFilters from '@/components/produtos/ProductFilters'
import { defaultProductFilters } from '@/components/produtos/ProductFilters'
import type { ProductFilterState } from '@/components/produtos/ProductFilters'
import ProductKPIs from '@/components/produtos/ProductKPIs'
import ProductTable from '@/components/produtos/ProductTable'
import Top5Products from '@/components/produtos/Top5Products'
import CategoryPerformance from '@/components/produtos/CategoryPerformance'
import ProductAlerts from '@/components/produtos/ProductAlerts'
import ProductOpportunities from '@/components/produtos/ProductOpportunities'
import { products } from '@/data/mockData'

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

  return (
    <div className="space-y-3 sm:space-y-4">
      <ProductFilters filters={filters} onChange={setFilters} />

      <ProductKPIs />

      {/* Main table + side intelligence rail */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ProductTable filteredProducts={filteredProducts} />
        <div className="flex flex-col gap-4">
          <Top5Products />
          <ProductAlerts />
        </div>
      </div>

      {/* Category performance + product opportunities */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CategoryPerformance />
        <ProductOpportunities />
      </div>
    </div>
  )
}
