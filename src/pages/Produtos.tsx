import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { defaultProductFilters } from '@/components/produtos/ProductFilters'
import type { ProductFilterState } from '@/components/produtos/ProductFilters'
import ProductKPIs from '@/components/produtos/ProductKPIs'
import ProductTable from '@/components/produtos/ProductTable'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetch, apiFetchJson } from '@/lib/apiFetch'
import type { DashboardProduct, DashboardProductsResponse } from '@/server/dashboardProducts'
import { categoryItemFromProduct } from '@/lib/categoryAdapters'
import { getCategoryOptions, matchesCategoryFilter } from '@/lib/categoryAnalytics'

export default function Produtos() {
  const [filters, setFilters] = useState<ProductFilterState>(defaultProductFilters)
  const { period } = usePeriod()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?days=${period.days}`).then((data) => {
      if (!cancelled) {
        setReal(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  async function handleSetCost(product: DashboardProduct, costPrice: number) {
    const res = await apiFetch('/api/dashboard/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ externalProductId: product.id, costPrice }),
    })
    if (res.ok) {
      setReal((prev) => prev ? { ...prev, items: prev.items.map((p) => p.id === product.id ? { ...p, costPrice, margin: p.price !== null && p.price > 0 ? ((p.price - costPrice) / p.price) * 100 : null } : p) } : prev)
    }
  }

  const filteredProducts = useMemo(() => {
    const items = real?.items ?? []
    return items.filter((p) => {
      if (filters.marketplaces.size > 0 && !filters.marketplaces.has(p.marketplace)) return false
      if (!matchesCategoryFilter(categoryItemFromProduct(p), filters.categories)) return false
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
  }, [real, filters])

  const categoryOptions = useMemo(() => getCategoryOptions((real?.items ?? []).map(categoryItemFromProduct)), [real])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (real?.source === 'real' && real.items.length === 0) {
    return <ConnectMarketplacePrompt title="Catálogo ainda não disponível" description="A conexão está ativa e o catálogo real está sendo sincronizado. Nenhum produto ilustrativo será exibido enquanto isso." />
  }

  // Sem conexão — nenhum produto ilustrativo aparece fora do modo demo.
  if (!real || (real.source !== 'real' && real.source !== 'demo') || real.items.length === 0) {
    return <ConnectMarketplacePrompt title="Conecte um marketplace pra ver seu catálogo" description="Assim que sincronizar o Mercado Livre, seus produtos reais aparecem aqui — com estoque, vendas e tendência." />
  }

  return (
    <div className="workspace-page workspace-page--products">
      <div className="motion-block-in">
        <ProductKPIs products={filteredProducts} />
      </div>

      <div className="motion-block-in motion-block-in-2 workspace-primary-panel">
        <ProductTable allProducts={real.items} filteredProducts={filteredProducts} filters={filters} onFiltersChange={setFilters} categoryOptions={categoryOptions} editable onSetCost={handleSetCost} />
      </div>
    </div>
  )
}
