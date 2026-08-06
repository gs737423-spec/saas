import { useEffect, useState } from 'react'
import { Loader2, Trophy, Ticket, ShoppingCart, TrendingUp, Percent, AlertTriangle, Store } from 'lucide-react'
import type { FinanceOverview, MarketplaceFinance } from '@/data/financeShapes'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import RealMarketplaceBreakdown from '@/components/dashboard/RealMarketplaceBreakdown'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
}

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface KpiSpec {
  icon: typeof Trophy
  label: string
  value: string
  marketplace: string
  detail: string
  tone: 'cyan' | 'emerald' | 'blue' | 'violet' | 'amber' | 'rose'
}

const toneClass: Record<KpiSpec['tone'], string> = {
  cyan: 'bg-accent-cyan/10 text-accent-cyan',
  emerald: 'bg-accent-emerald/10 text-accent-emerald',
  blue: 'bg-accent-blue/10 text-accent-blue',
  violet: 'bg-accent-violet/10 text-accent-violet',
  amber: 'bg-accent-amber/10 text-accent-amber',
  rose: 'bg-accent-rose/10 text-accent-rose',
}

/** 6 KPIs comparativos entre marketplaces — cada um é "quem lidera nessa
 *  métrica", derivado 100% de MarketplaceFinance já carregado (sem fetch
 *  extra). "Canal em atenção" = maior queda de D-30 (ou null se nenhum caiu). */
function buildComparisonKpis(rows: MarketplaceFinance[]): KpiSpec[] {
  const byNet = [...rows].sort((a, b) => b.netValue - a.netValue)
  const byTicket = [...rows].sort((a, b) => b.averageTicket - a.averageTicket)
  const byOrders = [...rows].sort((a, b) => b.ordersCount - a.ordersCount)
  const byGrowth = [...rows].sort((a, b) => (b.growth.d30 ?? -Infinity) - (a.growth.d30 ?? -Infinity))
  const byFeeImpact = [...rows]
    .map((r) => ({ r, pct: r.grossRevenue > 0 ? (r.fees / r.grossRevenue) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
  const worstGrowth = [...rows].filter((r) => r.growth.d30 !== null).sort((a, b) => (a.growth.d30 ?? 0) - (b.growth.d30 ?? 0))[0]

  const kpis: KpiSpec[] = [
    { icon: Trophy, label: 'Líder em líquido', value: `R$ ${brl(byNet[0].netValue)}`, marketplace: byNet[0].marketplace, detail: `${((byNet[0].netValue / rows.reduce((s, r) => s + r.netValue, 0 || 1)) * 100).toFixed(1)}% do líquido total`, tone: 'amber' },
    { icon: Ticket, label: 'Melhor ticket', value: `R$ ${brl(byTicket[0].averageTicket)}`, marketplace: byTicket[0].marketplace, detail: `${byTicket[0].ordersCount} pedidos`, tone: 'cyan' },
    { icon: ShoppingCart, label: 'Mais pedidos', value: byOrders[0].ordersCount.toLocaleString('pt-BR'), marketplace: byOrders[0].marketplace, detail: `ticket R$ ${brl(byOrders[0].averageTicket)}`, tone: 'blue' },
    { icon: TrendingUp, label: 'Maior crescimento', value: byGrowth[0].growth.d30 !== null ? `${byGrowth[0].growth.d30 >= 0 ? '+' : ''}${byGrowth[0].growth.d30.toFixed(1)}%` : '—', marketplace: byGrowth[0].marketplace, detail: `líquido R$ ${brl(byGrowth[0].netValue)}`, tone: 'emerald' },
    { icon: Percent, label: 'Maior impacto de comissão', value: `${byFeeImpact[0].pct.toFixed(1)}%`, marketplace: byFeeImpact[0].r.marketplace, detail: `R$ ${brl(byFeeImpact[0].r.fees)} retidos`, tone: 'violet' },
    { icon: AlertTriangle, label: 'Canal em atenção', value: worstGrowth ? worstGrowth.marketplace : '—', marketplace: worstGrowth ? worstGrowth.marketplace : '', detail: worstGrowth ? `Atenção · ${worstGrowth.growth.d30!.toFixed(1)}%` : 'Nenhum canal em queda', tone: 'rose' },
  ]
  return kpis
}

function KpiCard({ kpi }: { kpi: KpiSpec }) {
  return (
    <div className="glass-panel flex flex-col gap-2 rounded-xl p-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{kpi.label}</span>
        <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${toneClass[kpi.tone]}`}><kpi.icon className="h-3.5 w-3.5" /></span>
      </div>
      <p className="text-xl font-bold text-text-primary">{kpi.value}</p>
      {kpi.marketplace && <p className="text-[11px] text-text-secondary">{kpi.marketplace}</p>}
      <p className="text-[10px] text-text-muted">{kpi.detail}</p>
    </div>
  )
}

export default function Marketplaces() {
  const { period } = usePeriod()
  const [data, setData] = useState<FinanceApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<FinanceApiResponse>(`/api/dashboard/finance?days=${period.days}`).then((res) => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  const rows = (data?.byMarketplace ?? []).filter((m) => m.grossRevenue > 0)

  if (!data || !data.ok || rows.length === 0) {
    return (
      <ConnectMarketplacePrompt
        icon={Store}
        title="Conecte um marketplace pra comparar canais"
        description="Assim que houver pedido pago sincronizado de um marketplace, o comparativo de faturamento, comissão e ticket médio aparece aqui."
      />
    )
  }

  const kpis = buildComparisonKpis(rows)

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {kpis.map((kpi) => <KpiCard key={kpi.label} kpi={kpi} />)}
      </div>

      <div className="motion-block-in">
        <RealMarketplaceBreakdown />
      </div>
    </div>
  )
}
