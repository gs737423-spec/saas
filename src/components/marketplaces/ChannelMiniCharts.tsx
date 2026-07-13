import { channelOverview, scaleChannelOverview, getMarketplaceColor } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'

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
    <div>
      <div className="mb-0.5 text-[13px] font-semibold text-text-primary">{title}</div>
      <div className="mb-2.5 text-[11px] text-text-muted">{question}</div>
      <div className="space-y-2">
        {data.map((d) => {
          const brand = getMarketplaceColor(d.marketplace as any)
          return (
            <div key={d.marketplace} className="flex items-center gap-2.5">
              <span className="w-20 shrink-0 truncate text-[11.5px] text-text-secondary">{d.marketplace}</span>
              <div className="overview-track h-2 flex-1 overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(d.value / max) * 100}%`, background: `linear-gradient(90deg, ${brand}66, ${brand})` }}
                />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[12px] font-semibold text-text-primary">{d.display}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function ChannelMiniCharts() {
  const { period } = usePeriod()
  const scaled = scaleChannelOverview(channelOverview, period)

  const byShare = [...scaled].sort((a, b) => b.netSharePct - a.netSharePct).map((m) => ({
    marketplace: m.marketplace,
    value: m.netSharePct,
    display: `${pct(m.netSharePct)}%`,
  }))

  const byTicket = [...scaled].sort((a, b) => b.avgTicket - a.avgTicket).map((m) => ({
    marketplace: m.marketplace,
    value: m.avgTicket,
    display: `R$ ${brl2(m.avgTicket)}`,
  }))

  const byOrders = [...scaled].sort((a, b) => b.orders - a.orders).map((m) => ({
    marketplace: m.marketplace,
    value: m.orders,
    display: brl(m.orders),
  }))

  const byFees = [...scaled].sort((a, b) => b.feePct - a.feePct).map((m) => ({
    marketplace: m.marketplace,
    value: m.feePct,
    display: `${pct(m.feePct)}%`,
  }))

  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 xl:grid-cols-4">
      <MiniBarChart title="Participação" question="De quem depende o líquido?" data={byShare} maxValue={100} />
      <MiniBarChart title="Ticket Médio" question="Quem tem o maior ticket médio?" data={byTicket} />
      <MiniBarChart title="Pedidos" question="Quem traz mais volume?" data={byOrders} />
      <MiniBarChart title="Impacto de Comissão" question="Quem consome mais em comissão?" data={byFees} maxValue={25} />
    </div>
  )
}
