import { useEffect, useMemo, useState } from 'react'
import { Boxes, FileBarChart2, LayoutDashboard, Loader2, PackageSearch, Printer } from 'lucide-react'
import { usePeriod } from '@/contexts/PeriodContext'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import RealMarketplaceBreakdown from '@/components/dashboard/RealMarketplaceBreakdown'
import { apiFetchJson } from '@/lib/apiFetch'
import type { DashboardSummary } from '@/server/integrations/types'
import type { DashboardProduct, DashboardProductsResponse } from '@/server/dashboardProducts'

type ReportType = 'executive' | 'products' | 'inventory'

const reportTypes: { key: ReportType; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'executive', label: 'Visão executiva', icon: LayoutDashboard },
  { key: 'products', label: 'Produtos', icon: PackageSearch },
  { key: 'inventory', label: 'Estoque', icon: Boxes },
]

const brl = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const LOW_STOCK_THRESHOLD = 10

export default function Relatorios() {
  const { period } = usePeriod()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [products, setProducts] = useState<DashboardProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [reportType, setReportType] = useState<ReportType>('executive')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError(false)
    Promise.all([
      apiFetchJson<DashboardSummary>(`/api/dashboard/summary?days=${period.days}`),
      apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?days=${period.days}`),
    ]).then(([summaryResponse, productsResponse]) => {
      if (cancelled) return
      setSummary(summaryResponse)
      setProducts(productsResponse)
      setLoadError(!summaryResponse || !productsResponse)
      setLoading(false)
    })
    return () => { cancelled = true }
  }, [period.days])

  const productItems = useMemo(() => products?.items ?? [], [products])
  const topProducts = useMemo(
    () => [...productItems].sort((a, b) => b.revenue - a.revenue).slice(0, 8),
    [productItems],
  )
  const lowStockProducts = useMemo(
    () => productItems.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).sort((a, b) => a.stock - b.stock),
    [productItems],
  )

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Carregando relatórios...
      </div>
    )
  }

  const hasSupportedData = summary && (summary.source === 'real' || summary.source === 'demo')
  if (!hasSupportedData) {
    return <ConnectMarketplacePrompt icon={FileBarChart2} title="Conecte um marketplace pra gerar relatórios" description="Os relatórios usam somente faturamento, produtos e estoque disponíveis na plataforma." />
  }

  return (
    <div className="report-center">
      <div className="flex justify-end">
        <button type="button" onClick={() => window.print()} className="report-toolbar control-inactive motion-chip inline-flex h-9 items-center gap-1.5 self-start rounded-lg border px-3 text-xs font-semibold sm:self-auto">
          <Printer className="h-3.5 w-3.5" /> Imprimir relatório
        </button>
      </div>

      <div className="enterprise-toolbar enterprise-filter-surface rounded-lg border border-border-subtle" aria-label="Tipos de relatório">
        <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Relatório</span>
        {reportTypes.map(({ key, label, icon: Icon }) => (
          <button key={key} type="button" onClick={() => setReportType(key)} className={`motion-chip inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[11.5px] font-semibold ${reportType === key ? 'control-active' : 'control-inactive'}`} aria-pressed={reportType === key}>
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
        <span className="ml-auto text-[11px] text-text-muted">Período: <strong className="font-semibold text-text-secondary">{period.label}</strong></span>
      </div>

      {loadError && (
        <div className="rounded-lg border border-warning-border bg-warning-bg px-3 py-2 text-[12px] text-text-secondary">
          Parte das informações não pôde ser atualizada. Os blocos disponíveis continuam abaixo.
        </div>
      )}

      {reportType === 'executive' && <ExecutiveReport summary={summary} productItems={productItems} periodLabel={period.label} />}
      {reportType === 'products' && <ProductsReport products={topProducts} />}
      {reportType === 'inventory' && <InventoryReport products={lowStockProducts} />}
    </div>
  )
}

function ExecutiveReport({ summary, productItems, periodLabel }: { summary: DashboardSummary; productItems: DashboardProduct[]; periodLabel: string }) {
  const lowStock = productItems.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length
  const withoutCost = productItems.filter((product) => product.costPrice === null).length
  const metrics = [
    ['Faturamento bruto', `R$ ${brl(summary.grossRevenue)}`],
    ['Pedidos', summary.ordersCount.toLocaleString('pt-BR')],
    ['Ticket médio', `R$ ${brl(summary.averageTicket)}`],
    ['Produtos com estoque baixo', lowStock.toLocaleString('pt-BR')],
  ]
  return (
    <>
      <section className="report-center__section app-panel-section enterprise-section rounded-xl">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Visão executiva</h2>
            <p className="text-[11px] text-text-muted">{periodLabel} · fonte {summary.source === 'real' ? 'sincronizada' : 'de demonstração'}</p>
          </div>
        </div>
        <div className="report-center__metric-grid">
          {metrics.map(([label, value]) => <Metric key={label} label={label} value={value} />)}
        </div>
        {withoutCost > 0 && <p className="mt-3 text-[11.5px] text-text-secondary">{withoutCost} {withoutCost === 1 ? 'produto está sem custo cadastrado' : 'produtos estão sem custo cadastrado'}; análises de margem podem ficar incompletas.</p>}
      </section>
      <section className="report-center__section">
        <RealMarketplaceBreakdown />
      </section>
    </>
  )
}

function ProductsReport({ products }: { products: DashboardProduct[] }) {
  return (
    <ReportTableSection title="Produtos por faturamento" subtitle="Dados disponíveis no período selecionado." products={products} empty="Nenhum produto disponível para este período." />
  )
}

function InventoryReport({ products }: { products: DashboardProduct[] }) {
  return (
    <ReportTableSection title="Estoque prioritário" subtitle={`Produtos com até ${LOW_STOCK_THRESHOLD} unidades disponíveis.`} products={products} empty="Nenhum produto com estoque baixo no período." />
  )
}

function ReportTableSection({ title, subtitle, products, empty }: { title: string; subtitle: string; products: DashboardProduct[]; empty: string }) {
  return (
    <section className="report-center__section glass-panel enterprise-section rounded-xl">
      <div className="mb-3">
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <p className="text-[11.5px] text-text-muted">{subtitle}</p>
      </div>
      {products.length === 0 ? <p className="py-8 text-center text-sm text-text-muted">{empty}</p> : (
        <div className="overflow-x-auto rounded-lg border border-border-subtle">
          <table className="enterprise-table w-full min-w-[640px] text-left text-sm">
            <thead><tr className="text-[10px] font-semibold uppercase tracking-wider text-text-secondary"><th className="px-3 py-2">Produto</th><th className="px-3 py-2">SKU</th><th className="px-3 py-2">Marketplace</th><th className="px-3 py-2 text-right">Faturamento</th><th className="px-3 py-2 text-right">Estoque</th></tr></thead>
            <tbody>{products.map((product) => <tr key={product.id} className="border-t border-border-subtle"><td className="max-w-[320px] truncate px-3 py-2 font-medium text-text-primary">{product.name}</td><td className="px-3 py-2 font-mono text-[11px] text-text-muted">{product.sku ?? '—'}</td><td className="px-3 py-2 text-text-secondary">{product.marketplace}</td><td className="px-3 py-2 text-right font-mono text-text-primary">R$ {brl(product.revenue)}</td><td className="px-3 py-2 text-right font-mono text-text-secondary">{product.stock}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-1 font-mono text-lg font-bold text-text-primary">{value}</p></div>
}
