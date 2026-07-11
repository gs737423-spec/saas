import { channelOverview, getMarketplaceColor } from '@/data/mockData'

const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface MiniChartProps {
  title: string
  question: string
  data: { marketplace: string; value: number; display: string }[]
  maxValue?: number
}

function MiniBarChart({ title, question, data, maxValue }: MiniChartProps) {
  const max = maxValue ?? Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="overview-glass rounded-[18px] p-3.5">
      <div className="mb-0.5 text-[11px] font-semibold text-text-primary">{title}</div>
      <div className="mb-3 text-[10px] text-text-muted">{question}</div>
      <div className="space-y-2">
        {data.map((d) => {
          const brand = getMarketplaceColor(d.marketplace as any)
          return (
            <div key={d.marketplace} className="flex items-center gap-2">
              <span className="w-16 shrink-0 truncate text-[10px] text-text-secondary">{d.marketplace}</span>
              <div className="overview-track h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(d.value / max) * 100}%`, background: `linear-gradient(90deg, ${brand}66, ${brand})` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[10px] font-medium text-text-secondary">{d.display}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ChannelMiniCharts() {
  const byShare = [...channelOverview].sort((a, b) => b.netSharePct - a.netSharePct).map((m) => ({
    marketplace: m.marketplace,
    value: m.netSharePct,
    display: `${pct(m.netSharePct)}%`,
  }))

  const byTicket = [...channelOverview].sort((a, b) => b.avgTicket - a.avgTicket).map((m) => ({
    marketplace: m.marketplace,
    value: m.avgTicket,
    display: `R$ ${brl2(m.avgTicket)}`,
  }))

  const byOrders = [...channelOverview].sort((a, b) => b.orders - a.orders).map((m) => ({
    marketplace: m.marketplace,
    value: m.orders,
    display: brl(m.orders),
  }))

  const byFeeVsEfficiency = [...channelOverview].sort((a, b) => b.feePct - a.feePct).map((m) => ({
    marketplace: m.marketplace,
    value: m.feePct,
    display: `${pct(m.feePct)}% · ef ${pct(m.netEfficiencyPct)}%`,
  }))

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <MiniBarChart title="Participação por Canal" question="De quem depende meu faturamento líquido?" data={byShare} maxValue={100} />
      <MiniBarChart title="Ticket Médio por Canal" question="Quem vende mais caro?" data={byTicket} />
      <MiniBarChart title="Pedidos por Canal" question="Quem traz mais volume?" data={byOrders} />
      <MiniBarChart title="Taxas × Eficiência" question="Quem consome mais em taxas?" data={byFeeVsEfficiency} maxValue={25} />
    </div>
  )
}
