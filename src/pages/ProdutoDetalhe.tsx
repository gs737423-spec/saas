import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { products, stockItems, getProductStatus, getProductHealthScore } from '@/data/mockData'
import ProdutoHeader from '@/components/produto-detalhe/ProdutoHeader'
import ProdutoKPIs from '@/components/produto-detalhe/ProdutoKPIs'
import SalesTrendChart from '@/components/produto-detalhe/SalesTrendChart'
import ProdutoHealthScore from '@/components/produto-detalhe/ProdutoHealthScore'
import MarketplacePerformanceBreakdown from '@/components/produto-detalhe/MarketplacePerformanceBreakdown'
import ProdutoAtividade from '@/components/produto-detalhe/ProdutoAtividade'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'
import type { DashboardProduct, DashboardProductsResponse } from '@/server/dashboardProducts'

// Produto real (marketplace conectado de verdade) não tem histórico diário
// nem "atividade" por produto ainda — só o que já existe em orders/order_items
// e marketplace_products/inventory. Card enxuto, honesto sobre o que falta,
// em vez de reaproveitar os componentes mock (que assumem 4 marketplaces,
// meta, sparkline diário — nada disso existe pra dado real hoje).
function ProdutoDetalheReal({ product }: { product: DashboardProduct }) {
  return (
    <div className="space-y-3">
      <Link to="/app/produtos" className="flex w-fit items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Produtos
      </Link>

      <div className="glass-panel rounded-2xl p-5">
        <h1 className="text-lg font-bold tracking-tight text-text-primary">{product.name}</h1>
        <p className="mt-1 text-xs text-text-muted">
          {product.sku ?? product.id} · {product.category ?? 'Sem categoria'} · {product.marketplace}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">R$ {product.revenue.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-text-muted">faturamento no período</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">{product.units.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-text-muted">unidades vendidas</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">{product.stock.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-text-muted">estoque disponível</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">{product.margin !== null ? `${product.margin.toFixed(0)}%` : '—'}</p>
          <p className="text-[11px] text-text-muted">{product.margin !== null ? 'margem' : 'defina o custo em Produtos'}</p>
        </div>
      </div>

      <div className="glass-panel rounded-2xl p-5 text-center text-xs text-text-muted">
        Histórico diário de vendas e feed de atividade por produto ainda não existem pra dado real — dependem de uma tabela de série temporal que não foi criada ainda.
      </div>
    </div>
  )
}

export default function ProdutoDetalhe() {
  const { sku } = useParams<{ sku: string }>()
  const { period } = usePeriod()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)
  const [loadingReal, setLoadingReal] = useState(true)

  const mockProduct = products.find((p) => p.sku === sku)

  useEffect(() => {
    if (mockProduct) {
      setLoadingReal(false)
      return
    }
    let cancelled = false
    apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?days=${period.days}`).then((data) => {
      if (!cancelled) {
        setReal(data)
        setLoadingReal(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [mockProduct, period.days])

  if (mockProduct) {
    const stock = stockItems.find((s) => s.sku === mockProduct.sku)
    const status = getProductStatus(mockProduct.sku)
    const health = getProductHealthScore(mockProduct, stock, status)

    return (
      <div className="space-y-2 sm:space-y-2.5">
        <ProdutoHeader product={mockProduct} status={status} stock={stock} />
        <ProdutoKPIs product={mockProduct} stock={stock} />
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_420px]">
          <SalesTrendChart sku={mockProduct.sku} />
          <ProdutoHealthScore health={health} stock={stock} />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <MarketplacePerformanceBreakdown product={mockProduct} />
          <ProdutoAtividade sku={mockProduct.sku} />
        </div>
      </div>
    )
  }

  if (loadingReal) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  const realProduct = real?.items.find((p) => p.sku === sku || p.id === sku)

  if (realProduct) {
    return <ProdutoDetalheReal product={realProduct} />
  }

  return (
    <div className="glass-panel rounded-2xl p-6 text-center">
      <p className="text-sm font-medium text-text-primary">Produto não encontrado</p>
      <p className="mt-1 text-[13px] text-text-muted">Nenhum produto com o identificador "{sku}" foi encontrado.</p>
      <Link to="/app/produtos" className="mt-4 inline-block rounded-lg bg-accent-blue/10 px-4 py-2 text-[13px] font-medium text-accent-blue hover:bg-accent-blue/20">
        Voltar para Produtos
      </Link>
    </div>
  )
}
