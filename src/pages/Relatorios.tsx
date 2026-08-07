import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Printer, Loader2, FileBarChart2 } from 'lucide-react'
import { usePeriod } from '@/contexts/PeriodContext'
import type { ExecutiveSummaryLine, ExecutiveAlert } from '@/data/mockData'
import KPICards from '@/components/dashboard/KPICards'
import RealMarketplaceBreakdown from '@/components/dashboard/RealMarketplaceBreakdown'
import MKTOnlineLogo from '@/components/brand/MKTOnlineLogo'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import { apiFetchJson } from '@/lib/apiFetch'
import type { DashboardSummary } from '@/server/integrations/types'
import type { DashboardProductsResponse } from '@/server/dashboardProducts'
import type { OverviewKpi } from '@/data/mockData'

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Selo "dado real" só quando é real de verdade — em Modo Demonstração
// (source: 'demo') fica sem selo, igual Dashboard.tsx faz (ver comentário
// lá: marcar demo como "dado real" seria mentira pro cliente que exportar
// esse relatório).
function buildRealKpis(s: DashboardSummary): OverviewKpi[] {
  const tag = s.source === 'real' ? 'dado real' : undefined
  return [
    { key: 'gross', label: 'Faturamento Bruto', value: brl(s.grossRevenue), raw: s.grossRevenue, scalesWithPeriod: true, prefix: 'R$', change: s.grossRevenueChangePct, context: '', tag, tone: 'cyan', hero: true },
    { key: 'orders', label: 'Pedidos', value: s.ordersCount.toLocaleString('pt-BR'), raw: s.ordersCount, scalesWithPeriod: true, change: s.ordersCountChangePct, context: 'Volume consolidado', tag, tone: 'blue' },
    { key: 'ticket', label: 'Ticket Médio', value: brl(s.averageTicket), raw: s.averageTicket, scalesWithPeriod: false, prefix: 'R$', change: null, context: 'Bruto por pedido', tag, tone: 'violet' },
    { key: 'returns', label: 'Devoluções', value: brl(s.returnsAmount), raw: s.returnsAmount, scalesWithPeriod: true, prefix: 'R$', change: null, context: `${s.returnsCount.toLocaleString('pt-BR')} pedidos`, tag, tone: 'neutral' },
  ]
}

const LOW_STOCK_THRESHOLD = 10

const toneColor: Record<string, string> = {
  neutral: '#9EB3C9',
  positive: '#3BE38E',
  warning: '#FFC95A',
  danger: '#FF5E7D',
}

function SlideShell({ children, index, total }: { children: React.ReactNode; index: number; total: number }) {
  return (
    <div className="report-slide glass-panel relative flex min-h-[520px] w-full flex-col rounded-2xl p-6 sm:p-10">
      {children}
      <span className="report-slide__page absolute bottom-4 right-6 text-[11px] text-text-muted">
        {index + 1} / {total}
      </span>
    </div>
  )
}

export default function Relatorios() {
  const { period } = usePeriod()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [products, setProducts] = useState<DashboardProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      apiFetchJson<DashboardSummary>(`/api/dashboard/summary?days=${period.days}`),
      apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?days=${period.days}`),
    ]).then(([s, p]) => {
      if (!cancelled) {
        setSummary(s)
        setProducts(p)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  const isReal = summary?.source === 'real' || summary?.source === 'demo'
  const kpis = isReal ? buildRealKpis(summary!) : undefined

  const executiveLines: ExecutiveSummaryLine[] = useMemo(() => {
    if (!isReal || !summary) return []
    const items = products?.items ?? []
    const lowStock = items.filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
    const topProduct = [...items].sort((a, b) => b.revenue - a.revenue)[0]
    const withoutCost = items.filter((p) => p.costPrice === null).length

    const lines: ExecutiveSummaryLine[] = []
    lines.push({
      text: summary.grossRevenueChangePct !== null
        ? `Faturamento pago no período: R$ ${brl(summary.grossRevenue)}, ${summary.grossRevenueChangePct >= 0 ? 'crescimento' : 'queda'} de ${Math.abs(summary.grossRevenueChangePct).toFixed(1)}% vs período anterior.`
        : `Faturamento pago no período: R$ ${brl(summary.grossRevenue)} (sem período anterior pra comparar ainda).`,
      tone: summary.grossRevenueChangePct !== null && summary.grossRevenueChangePct < 0 ? 'warning' : 'neutral',
    })
    if (topProduct) {
      lines.push({ text: `Produto que mais faturou: ${topProduct.name} (R$ ${brl(topProduct.revenue)}, ${topProduct.units} unidades).`, tone: 'neutral' })
    }
    lines.push({
      text: `${lowStock.length} ${lowStock.length === 1 ? 'produto está' : 'produtos estão'} com estoque baixo (≤${LOW_STOCK_THRESHOLD} unidades).`,
      tone: lowStock.length > 0 ? 'danger' : 'positive',
    })
    if (withoutCost > 0) {
      lines.push({ text: `${withoutCost} ${withoutCost === 1 ? 'produto sem' : 'produtos sem'} custo cadastrado — margem incompleta em Produtos.`, tone: 'neutral' })
    }
    return lines
  }, [isReal, summary, products])

  const executiveAlerts: ExecutiveAlert[] = useMemo(() => {
    if (!isReal) return []
    const items = products?.items ?? []
    const alerts: ExecutiveAlert[] = []
    items
      .filter((p) => p.stock === 0)
      .slice(0, 4)
      .forEach((p) => alerts.push({ id: `stock-${p.id}`, rule: 'Estoque zerado', message: `${p.name} está sem estoque disponível.`, severity: 'danger', sku: p.sku ?? p.id }))
    items
      .filter((p) => p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD)
      .slice(0, 4)
      .forEach((p) => alerts.push({ id: `low-${p.id}`, rule: 'Estoque baixo', message: `${p.name} tem só ${p.stock} unidade(s) disponíveis.`, severity: 'warning', sku: p.sku ?? p.id }))
    return alerts.slice(0, 6)
  }, [isReal, products])

  const summaryLines = executiveLines
  const alerts = executiveAlerts

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (!isReal) {
    return <ConnectMarketplacePrompt icon={FileBarChart2} title="Conecte um marketplace pra gerar o relatório" description="O relatório executivo usa faturamento, produtos e estoque reais — conecte e sincronize o Mercado Livre primeiro." />
  }

  const slides = [
    <SlideShell key="cover" index={0} total={5}>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
        <MKTOnlineLogo mode="symbol" size="lg" />
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-text-primary">Relatório executivo</h1>
        <p className="text-sm text-text-secondary">Período: {period.label}</p>
        <p className="text-xs text-text-muted">Gerado em {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
      </div>
    </SlideShell>,

    <SlideShell key="kpis" index={1} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Indicadores do período</h2>
      <KPICards period={period} kpis={kpis} />
    </SlideShell>,

    <SlideShell key="gmv" index={2} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Faturamento por marketplace</h2>
      <RealMarketplaceBreakdown />
    </SlideShell>,

    <SlideShell key="summary" index={3} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Resumo executivo</h2>
      <ul className="flex flex-col gap-3">
        {summaryLines.map((line, i) => (
          <li key={i} className="flex items-start gap-2.5 text-sm text-text-secondary">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneColor[line.tone] }} />
            {line.text}
          </li>
        ))}
      </ul>
    </SlideShell>,

    <SlideShell key="alerts" index={4} total={5}>
      <h2 className="mb-4 text-lg font-semibold text-text-primary">Alertas prioritários</h2>
      <ul className="flex flex-col gap-3">
        {alerts.map((a) => (
          <li key={a.id} className="rounded-lg border border-border-subtle px-3 py-2.5">
            <p className="text-[13px] font-medium text-text-primary">{a.rule}</p>
            <p className="mt-0.5 text-xs text-text-muted">{a.message}</p>
          </li>
        ))}
        {alerts.length === 0 && <p className="text-sm text-text-muted">Nenhum alerta no momento.</p>}
      </ul>
    </SlideShell>,
  ]

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowRight') setSlide((s) => Math.min(s + 1, slides.length - 1))
      if (e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slides.length])

  return (
    <div className="report-viewer">
      <div className="report-toolbar mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSlide((s) => Math.max(s - 1, 0))}
            disabled={slide === 0}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs text-text-muted">Slide {slide + 1} de {slides.length}</span>
          <button
            onClick={() => setSlide((s) => Math.min(s + 1, slides.length - 1))}
            disabled={slide === slides.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 rounded-lg border border-border-default bg-accent-blue/10 px-3 py-1.5 text-xs font-medium text-accent-blue hover:bg-accent-blue/20"
        >
          <Printer className="h-3.5 w-3.5" /> Imprimir / exportar PDF
        </button>
      </div>

      <div className="report-onscreen">{slides[slide]}</div>
      <div className="report-print">{slides}</div>
    </div>
  )
}
