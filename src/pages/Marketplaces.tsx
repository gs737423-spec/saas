import { useEffect, useState } from 'react'
import { Loader2, Crown, Receipt, ShoppingCart, TrendingUp, Store } from 'lucide-react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'
import { fillAllMarketplaces, type FinanceOverview, type MarketplaceFinance } from '@/data/financeShapes'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import RevenueByChannelChart from '@/components/marketplaces/RevenueByChannelChart'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
}

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// KPIs verdicto — mesmo desenho aprovado (borda colorida à esquerda, ícone
// pequeno), 100% derivado do MarketplaceFinance já carregado.
function ChannelKPIVerdict({ rows }: { rows: MarketplaceFinance[] }) {
  const byNet = [...rows].sort((a, b) => b.netValue - a.netValue)
  const byTicket = [...rows].sort((a, b) => b.averageTicket - a.averageTicket)
  const byOrders = [...rows].sort((a, b) => b.ordersCount - a.ordersCount)
  const byGrowth = [...rows].sort((a, b) => (b.growth.d30 ?? -Infinity) - (a.growth.d30 ?? -Infinity))
  const totalNet = rows.reduce((s, r) => s + r.netValue, 0)

  const verdicts = [
    { label: 'Líder em Líquido', value: `R$ ${brl(byNet[0].netValue)}`, channel: byNet[0].marketplace, sub: `${totalNet > 0 ? pct((byNet[0].netValue / totalNet) * 100) : '0,0'}% do líquido total`, icon: Crown, tone: '#3BE38E' },
    { label: 'Melhor Ticket', value: `R$ ${brl2(byTicket[0].averageTicket)}`, channel: byTicket[0].marketplace, sub: `${brl(byTicket[0].ordersCount)} pedidos`, icon: Receipt, tone: '#194B9B' },
    { label: 'Mais Pedidos', value: brl(byOrders[0].ordersCount), channel: byOrders[0].marketplace, sub: `ticket R$ ${brl2(byOrders[0].averageTicket)}`, icon: ShoppingCart, tone: '#3A8DFF' },
    { label: 'Maior Crescimento', value: byGrowth[0].growth.d30 !== null ? `+${pct(byGrowth[0].growth.d30)}%` : '—', channel: byGrowth[0].marketplace, sub: `líquido R$ ${brl(byGrowth[0].netValue)}`, icon: TrendingUp, tone: '#5B8DEF' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {verdicts.map((v) => {
        const brand = getMarketplaceColor(v.channel)
        return (
          <div key={v.label} className="overview-glass overview-card-hover relative flex h-full min-h-[98px] min-w-0 flex-col overflow-hidden rounded-sm p-2.5">
            <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: brand }} />
            <div className="mb-1.5 flex min-h-[28px] items-start justify-between gap-1.5">
              <span className="min-w-0 text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">{v.label}</span>
              <v.icon className="h-3.5 w-3.5 shrink-0" style={{ color: v.tone }} />
            </div>
            <div className="font-mono text-[16px] font-bold leading-none tracking-tight text-text-primary">{v.value}</div>
            <div className="mt-auto flex items-center gap-1.5 pt-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: brand }} />
              <span className="truncate text-[11px] font-medium text-text-secondary">{v.channel}</span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-text-muted">{v.sub}</div>
          </div>
        )
      })}
    </div>
  )
}

interface MiniChartProps {
  title: string
  question: string
  data: { marketplace: Marketplace; value: number; display: string }[]
  maxValue?: number
}

function MiniBarChart({ title, question, data, maxValue }: MiniChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div>
      <div className="mb-0.5 text-[13px] font-semibold text-text-primary">{title}</div>
      <div className="mb-2.5 text-[11px] text-text-muted">{question}</div>
      <div className="space-y-2">
        {data.map((d) => {
          const brand = getMarketplaceColor(d.marketplace)
          return (
            <div key={d.marketplace} className="flex items-center gap-2.5">
              <span className="w-20 shrink-0 truncate text-[11.5px] text-text-secondary">{d.marketplace}</span>
              <div className="overview-track h-2 flex-1 overflow-hidden rounded-full">
                <div className="h-full rounded-full" style={{ width: `${(d.value / max) * 100}%`, background: `linear-gradient(90deg, ${brand}66, ${brand})` }} />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[12px] font-semibold text-text-primary">{d.display}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// 4 rankings — mesmos dados de ChannelKPIVerdict, sem fetch novo.
function ChannelMiniCharts({ rows }: { rows: MarketplaceFinance[] }) {
  const totalGross = rows.reduce((s, r) => s + r.grossRevenue, 0)

  const byShare = [...rows].sort((a, b) => b.netValue - a.netValue).map((m) => ({
    marketplace: m.marketplace,
    value: totalGross > 0 ? (m.grossRevenue / totalGross) * 100 : 0,
    display: `${pct(totalGross > 0 ? (m.grossRevenue / totalGross) * 100 : 0)}%`,
  }))
  const byTicket = [...rows].sort((a, b) => b.averageTicket - a.averageTicket).map((m) => ({
    marketplace: m.marketplace, value: m.averageTicket, display: `R$ ${brl2(m.averageTicket)}`,
  }))
  const byOrders = [...rows].sort((a, b) => b.ordersCount - a.ordersCount).map((m) => ({
    marketplace: m.marketplace, value: m.ordersCount, display: brl(m.ordersCount),
  }))

  return (
    <div className="workspace-channel-summary overview-glass motion-panel rounded-2xl p-3.5 sm:p-4">
      <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
        <MiniBarChart title="Participação" question="De quem depende o líquido?" data={byShare} maxValue={100} />
        <MiniBarChart title="Ticket Médio" question="Quem tem o maior ticket médio?" data={byTicket} />
        <MiniBarChart title="Pedidos" question="Quem traz mais volume?" data={byOrders} />
      </div>
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

  if (!data || !data.ok || data.byMarketplace.length === 0) {
    return (
      <ConnectMarketplacePrompt
        icon={Store}
        title="Conecte um marketplace pra comparar canais"
        description="Assim que houver pedido pago sincronizado de um marketplace, o comparativo de faturamento e ticket médio aparece aqui."
      />
    )
  }

  // Sempre os 4 canais, na ordem canônica — canal sem pedido no período vem
  // zerado, nunca some da tela (estrutura não muda por quantidade de
  // marketplace conectado, ver decisão 2026-08-06).
  const rows = fillAllMarketplaces(data.byMarketplace)

  return (
    <div className="workspace-page workspace-page--marketplaces">
      <div className="motion-block-in">
        <ChannelKPIVerdict rows={rows} />
      </div>

      <div className="workspace-marketplace-analysis">
        <div className="motion-block-in motion-block-in-2 workspace-primary-panel">
          <RevenueByChannelChart />
        </div>

        <div className="motion-block-in motion-block-in-3 workspace-marketplace-summary">
          <ChannelMiniCharts rows={rows} />
        </div>
      </div>
    </div>
  )
}
