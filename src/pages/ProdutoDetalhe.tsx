import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Loader2, Receipt, ShoppingCart, Tag, Percent, Boxes, Clock, TrendingUp, TrendingDown, PieChart,
} from 'lucide-react'
import { getMarketplaceColor, getMarketplaceBadge } from '@/data/mockData'
import { useTheme } from '@/contexts/ThemeContext'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'
import { selectDashboardProductMatches, type DashboardProduct, type DashboardProductsResponse, type ProductSalesResponse } from '@/server/dashboardProducts'
import SalesTrendChart from '@/components/produto-detalhe/SalesTrendChart'
import ProdutoHealthScore, { computeHealthBreakdown } from '@/components/produto-detalhe/ProdutoHealthScore'
import MarketplacePerformanceBreakdown from '@/components/produto-detalhe/MarketplacePerformanceBreakdown'

type ProductStatus = 'Saudável' | 'Atenção' | 'Crítico' | 'Parado'

const statusConfig: Record<ProductStatus, { color: string; bg: string; border: string; dot: string }> = {
  'Saudável': { color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20', dot: '#3BE38E' },
  'Atenção': { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20', dot: '#FFC95A' },
  'Crítico': { color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20', dot: '#FF5E7D' },
  'Parado': { color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20', dot: '#9061F9' },
}

// Cobertura (dias de estoque no ritmo de venda do período) — mesma lógica
// de src/components/estoque/RealInventoryTable.tsx, campo real derivado,
// nunca fabricado.
function coverageDays(p: DashboardProduct, periodDays: number): number | null {
  if (p.units <= 0) return null
  const dailyRate = p.units / periodDays
  return dailyRate > 0 ? p.stock / dailyRate : null
}

function classifyStatus(p: DashboardProduct, cov: number | null): ProductStatus {
  if (p.units === 0 && p.stock > 0) return 'Parado'
  if (cov !== null && cov < 7) return 'Crítico'
  if (cov !== null && cov < 15) return 'Atenção'
  return 'Saudável'
}

function ProdutoHeader({ product, status, summary }: { product: DashboardProduct; status: ProductStatus; summary: string }) {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const mp = getMarketplaceColor(product.marketplace)
  const cfg = statusConfig[status]

  return (
    <div className="glass-panel glass-panel-hover relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-50 blur-3xl" style={{ background: `radial-gradient(circle, ${cfg.dot}35, transparent 70%)` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70" style={{ background: `linear-gradient(90deg, transparent, ${cfg.dot}, transparent)` }} />

      <button
        type="button"
        onClick={() => navigate(-1)}
        className="relative mb-4 flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </button>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="line-clamp-2 break-words text-xl font-bold tracking-tight text-text-primary sm:text-2xl" title={product.name}>{product.name}</h1>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
              {status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
            <span className="font-mono">{product.sku ?? product.id}</span>
            <span>·</span>
            <span>{product.category ?? 'Sem categoria'}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5 font-medium" style={{ color: getMarketplaceBadge(product.marketplace, theme).text }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
              {product.marketplace}
            </span>
          </div>

          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-text-secondary">{summary}</p>
        </div>
      </div>
    </div>
  )
}

function ProdutoKPIs({ product, cov }: { product: DashboardProduct; cov: number | null }) {
  const positive = (product.trend ?? 0) >= 0
  const avgTicket = product.units > 0 ? product.revenue / product.units : 0

  const cards = [
    { label: 'Faturamento', value: `R$ ${product.revenue.toLocaleString('pt-BR')}`, context: 'no período', icon: Receipt, primary: '#3A8DFF', secondary: '#6366F1' },
    { label: 'Pedidos', value: product.units.toLocaleString('pt-BR'), context: 'unidades vendidas', icon: ShoppingCart, primary: '#3BE38E', secondary: '#6366F1' },
    { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(2)}`, context: 'média por pedido', icon: Tag, primary: '#194B9B', secondary: '#3A8DFF' },
    { label: 'Margem', value: product.margin !== null ? `${product.margin.toFixed(0)}%` : '—', context: product.margin !== null ? 'sobre o faturamento' : 'defina o custo do produto', icon: Percent, primary: '#FFC95A', secondary: '#FFC95A' },
    { label: 'Estoque Atual', value: String(product.stock), context: 'unidades disponíveis', icon: Boxes, primary: '#6366F1', secondary: '#3A8DFF' },
    { label: 'Cobertura', value: cov !== null ? `${Math.round(cov)} dias` : '—', context: 'no ritmo de venda do período', icon: Clock, primary: '#FF5E7D', secondary: '#FF5E7D' },
    { label: 'Tendência', value: product.trend !== null ? `${positive ? '+' : ''}${product.trend.toFixed(1)}%` : '—', context: 'vs período anterior', icon: positive ? TrendingUp : TrendingDown, primary: positive ? '#3BE38E' : '#FF5E7D', secondary: '#FFC95A' },
    { label: 'Participação', value: `${product.sharePct.toFixed(1)}%`, context: 'do faturamento do catálogo', icon: PieChart, primary: '#194B9B', secondary: '#6366F1' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
          <div className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100" style={{ background: `radial-gradient(circle, ${c.primary}40, transparent 68%)` }} />
          <div className="pointer-events-none absolute -bottom-16 -left-14 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60" style={{ background: `radial-gradient(circle, ${c.secondary}22, transparent 70%)` }} />
          <div className="relative mb-3 flex items-center justify-between">
            <span className="text-xs font-medium text-text-secondary">{c.label}</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${c.primary}14`, boxShadow: `0 0 20px -5px ${c.primary}99, inset 0 0 0 1px ${c.primary}33` }}>
              <c.icon className="h-[18px] w-[18px]" style={{ color: c.primary }} />
            </div>
          </div>
          <div className="relative truncate text-lg font-bold leading-tight tracking-tight text-text-primary">{c.value}</div>
          <div className="relative mt-1 truncate text-[10.5px] text-text-muted">{c.context}</div>
        </div>
      ))}
    </div>
  )
}

function buildSummary(product: DashboardProduct, status: ProductStatus, cov: number | null): string {
  if (status === 'Parado') return `Sem venda no período, com ${product.stock} unidades em estoque. Vale revisar preço, anúncio ou visibilidade neste canal.`
  if (status === 'Crítico') return `Estoque cobre só ${cov !== null ? Math.round(cov) : '—'} dias no ritmo de venda atual — risco real de ruptura, considere repor.`
  if (status === 'Atenção') return `Cobertura de estoque apertada (${cov !== null ? Math.round(cov) : '—'} dias). Fique de olho antes que vire crítico.`
  return `Vendendo de forma saudável — R$ ${product.revenue.toLocaleString('pt-BR')} no período, ${product.units} unidades.`
}

// Um SKU pode estar anunciado em mais de um marketplace ao mesmo tempo —
// cada `matches[i]` é um anúncio (1 linha em marketplace_products). A tela
// usa o de maior faturamento como "principal" pro header/KPIs e detalha o
// breakdown por marketplace embaixo.
function ProdutoDetalheReal({ matches, periodDays, sales }: { matches: DashboardProduct[]; periodDays: number; sales: ProductSalesResponse | null }) {
  const sorted = [...matches].sort((a, b) => b.revenue - a.revenue)
  const main = sorted[0]
  const cov = coverageDays(main, periodDays)
  const status = classifyStatus(main, cov)
  const summary = buildSummary(main, status, cov)
  const { score, breakdown } = computeHealthBreakdown(main.trend, main.margin, cov)

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <ProdutoHeader product={main} status={status} summary={summary} />
      <ProdutoKPIs product={main} cov={cov} />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_360px]">
        <SalesTrendChart product={main} periodDays={periodDays} points={sales?.points ?? []} source={sales?.source === 'demo' ? 'demo' : 'real'} unavailable={!sales?.ok} />
        <ProdutoHealthScore status={status} score={score} breakdown={breakdown} coverageDays={cov} stock={main.stock} />
      </div>

      {matches.length > 1 && <MarketplacePerformanceBreakdown matches={matches} />}
    </div>
  )
}

export default function ProdutoDetalhe() {
  const { sku } = useParams<{ sku: string }>()
  const [searchParams] = useSearchParams()
  const exactReference = {
    connectionId: searchParams.get('connection'),
    externalProductId: searchParams.get('product'),
  }
  const { period } = usePeriod()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)
  const [loadingReal, setLoadingReal] = useState(true)
  const [sales, setSales] = useState<ProductSalesResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?${period.query}`).then((data) => {
      if (!cancelled) {
        setReal(data)
        setLoadingReal(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.query])

  useEffect(() => {
    if (!real?.ok) return
    if (real.source === 'demo') {
      setSales({ ok: true, source: 'demo', points: [], lastSyncAt: new Date().toISOString() })
      return
    }
    const productMatches = selectDashboardProductMatches(real.items, sku, exactReference)
    if (productMatches.length === 0) return
    const refs = productMatches.map((product) => ({ connectionId: product.connectionId, externalProductId: product.id }))
    void apiFetchJson<ProductSalesResponse>(`/api/dashboard/product-sales?${period.query}&refs=${encodeURIComponent(JSON.stringify(refs))}`).then(setSales)
  }, [period.query, real, sku, exactReference.connectionId, exactReference.externalProductId])

  if (loadingReal) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  // Um SKU vendido em 2+ marketplaces produz 2+ linhas em items (1 por
  // anúncio/conexão) — pega todas, não só a primeira, senão o
  // faturamento/estoque dos outros marketplaces some da tela sem aviso.
  const matches = selectDashboardProductMatches(real?.items ?? [], sku, exactReference)

  if (matches.length > 0) {
    return <ProdutoDetalheReal matches={matches} periodDays={period.days} sales={sales} />
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
