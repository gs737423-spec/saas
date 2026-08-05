import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { defaultProductFilters } from '@/components/produtos/ProductFilters'
import type { ProductFilterState } from '@/components/produtos/ProductFilters'
import ProductKPIs from '@/components/produtos/ProductKPIs'
import ProductTable from '@/components/produtos/ProductTable'
import { products as mockProducts } from '@/data/mockData'
import { BASELINE_DAYS } from '@/lib/periods'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'
import type { DashboardProduct, DashboardProductsResponse } from '@/server/dashboardProducts'

export default function Produtos() {
  const [filters, setFilters] = useState<ProductFilterState>(defaultProductFilters)
  const { period } = usePeriod()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?days=${period.days}`).then((data) => {
      if (!cancelled) setReal(data)
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  const isReal = real?.source === 'real' && real.items.length > 0

  const allProducts: DashboardProduct[] = useMemo(() => {
    if (isReal) return real!.items

    // Demo: mesma forma que o dado real (DashboardProduct), escalado pelo
    // período global — nunca mistura tipo diferente na tabela/KPIs.
    const scale = (period.days / BASELINE_DAYS) * period.jitter
    return mockProducts.map((p) => ({
      id: String(p.id),
      sku: p.sku,
      name: p.name,
      marketplace: 'Mercado Livre' as const,
      category: p.category,
      price: 0,
      costPrice: null,
      margin: p.margin,
      stock: p.stock,
      revenue: Math.round(p.revenue * scale),
      units: Math.max(0, Math.round(p.units * scale)),
      trend: p.trend,
      sharePct: p.sharePct,
    }))
  }, [isReal, real, period])

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      if (filters.marketplaces.size > 0 && !filters.marketplaces.has(p.marketplace)) return false
      if (filters.categories.size > 0 && (!p.category || !filters.categories.has(p.category))) return false
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !p.name.toLowerCase().includes(q) &&
          !(p.sku ?? '').toLowerCase().includes(q) &&
          !(p.category ?? '').toLowerCase().includes(q)
        ) return false
      }
      return true
    })
  }, [allProducts, filters])

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {real && real.source === 'demo' && (
        <div className="flex items-center gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-xs font-medium text-accent-amber">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Dados de demonstração — conecte um marketplace em Conexões pra ver o catálogo real.
        </div>
      )}

      <div className="motion-block-in">
        <ProductKPIs products={filteredProducts} />
      </div>

      <div className="motion-block-in motion-block-in-2">
        <ProductTable filteredProducts={filteredProducts} filters={filters} onFiltersChange={setFilters} />
      </div>
    </div>
  )
}
