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

type ProductSortKey = 'sku' | 'name' | 'marketplace' | 'units' | 'stock' | 'revenue' | 'margin' | 'trend'
type ProductSortDir = 'asc' | 'desc'

export default function Produtos() {
  const [filters, setFilters] = useState<ProductFilterState>(defaultProductFilters)
  const { period } = usePeriod()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<{ key: ProductSortKey; dir: ProductSortDir }>({ key: 'revenue', dir: 'desc' })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    // Evita uma viagem ao servidor por tecla sem adiar os filtros de clique.
    const delay = filters.search ? window.setTimeout(load, 180) : window.setTimeout(load, 0)
    function load() {
      const params = new URLSearchParams(period.query)
      params.set('page', String(page))
      params.set('page_size', '100')
      params.set('sort', sort.key)
      params.set('direction', sort.dir)
      if (filters.search.trim()) params.set('search', filters.search.trim())
      if (filters.marketplaces.size > 0) params.set('marketplaces', JSON.stringify([...filters.marketplaces]))
      if (filters.categories.size > 0) params.set('categories', JSON.stringify([...filters.categories]))
      apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?${params}`).then((data) => {
        if (!cancelled) {
          setReal(data)
          setLoading(false)
        }
      })
    }
    return () => { cancelled = true; window.clearTimeout(delay) }
  }, [period.query, filters, page, sort])

  async function handleSetCost(product: DashboardProduct, costPrice: number) {
    const res = await apiFetch('/api/dashboard/products', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId: product.connectionId, externalProductId: product.id, costPrice }),
    })
    if (res.ok) {
      setReal((prev) => prev ? { ...prev, items: prev.items.map((p) => p.id === product.id && p.connectionId === product.connectionId ? { ...p, costPrice, margin: p.price !== null && p.price > 0 ? ((p.price - costPrice) / p.price) * 100 : null } : p) } : prev)
    }
  }

  const products = useMemo(() => real?.items ?? [], [real])

  function handleFiltersChange(next: ProductFilterState) {
    setFilters(next)
    setPage(1)
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (real?.source === 'real' && (real.pagination?.totalRows ?? real.items.length) === 0) {
    return <ConnectMarketplacePrompt title="Catálogo ainda não disponível" description="A conexão está ativa e o catálogo real está sendo sincronizado. Nenhum produto ilustrativo será exibido enquanto isso." />
  }

  if (real?.source === 'error' || real?.source === 'config_missing') {
    return <ConnectMarketplacePrompt title="Não foi possível carregar o catálogo agora" description={real.message ?? 'A conexão pode continuar com dados sincronizados. Tente novamente em instantes; nenhum produto foi removido.'} />
  }

  // Sem conexão — nenhum produto ilustrativo aparece fora do modo demo.
  if (!real || (real.source !== 'real' && real.source !== 'demo') || (real.pagination?.totalRows ?? real.items.length) === 0) {
    return <ConnectMarketplacePrompt title="Conecte um marketplace pra ver seu catálogo" description="Assim que sincronizar o Mercado Livre, seus produtos reais aparecem aqui — com estoque, vendas e tendência." />
  }

  return (
    <div className="workspace-page workspace-page--products">
      <div className="motion-block-in">
        <ProductKPIs products={products} metrics={real.metrics} />
      </div>

      <div className="motion-block-in motion-block-in-2 workspace-primary-panel">
        <ProductTable
          allProducts={products}
          filteredProducts={products}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          categoryOptions={real.categoryOptions ?? []}
          editable
          onSetCost={handleSetCost}
          serverPage={real.pagination}
          serverSort={sort}
          onServerSortChange={(key, dir) => { setSort({ key, dir }); setPage(1) }}
          onServerPageChange={setPage}
        />
      </div>
    </div>
  )
}
