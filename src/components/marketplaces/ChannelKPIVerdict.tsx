import { Crown, Receipt, ShoppingCart, TrendingUp, AlertTriangle, Shield } from 'lucide-react'
import { channelOverview, scaleChannelOverview, getMarketplaceColor } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'
import AnimatedNumber from '@/components/common/AnimatedNumber'

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function ChannelKPIVerdict() {
  const { period } = usePeriod()
  const scaled = scaleChannelOverview(channelOverview, period)

  const sorted = {
    byNet: [...scaled].sort((a, b) => b.netRevenue - a.netRevenue),
    byTicket: [...scaled].sort((a, b) => b.avgTicket - a.avgTicket),
    byOrders: [...scaled].sort((a, b) => b.orders - a.orders),
    byGrowth: [...scaled].sort((a, b) => b.trend - a.trend),
    byFees: [...scaled].sort((a, b) => b.feePct - a.feePct),
    attention: scaled.find((m) => m.status !== 'Saudável') ?? [...scaled].sort((a, b) => a.trend - b.trend)[0],
  }

  const verdicts = [
    {
      label: 'Líder em Líquido',
      raw: sorted.byNet[0].netRevenue,
      format: (v: number) => `R$ ${brl(v)}`,
      channel: sorted.byNet[0].marketplace,
      sub: `${pct(sorted.byNet[0].netSharePct)}% do líquido total`,
      icon: Crown,
      tone: '#2BD6A0',
    },
    {
      label: 'Melhor Ticket',
      raw: sorted.byTicket[0].avgTicket,
      format: (v: number) => `R$ ${brl2(v)}`,
      channel: sorted.byTicket[0].marketplace,
      sub: `${brl(sorted.byTicket[0].orders)} pedidos`,
      icon: Receipt,
      tone: '#194B9B',
    },
    {
      label: 'Mais Pedidos',
      raw: sorted.byOrders[0].orders,
      format: (v: number) => brl(v),
      channel: sorted.byOrders[0].marketplace,
      sub: `ticket R$ ${brl2(sorted.byOrders[0].avgTicket)}`,
      icon: ShoppingCart,
      tone: '#2F6BFF',
    },
    {
      label: 'Maior Crescimento',
      raw: sorted.byGrowth[0].trend,
      format: (v: number) => `+${pct(v)}%`,
      channel: sorted.byGrowth[0].marketplace,
      sub: `líquido R$ ${brl(sorted.byGrowth[0].netRevenue)}`,
      icon: TrendingUp,
      tone: '#5AB7FF',
    },
    {
      label: 'Maior Impacto de Comissão',
      raw: sorted.byFees[0].feePct,
      format: (v: number) => `${pct(v)}%`,
      channel: sorted.byFees[0].marketplace,
      sub: `R$ ${brl(sorted.byFees[0].fees)} retidos`,
      icon: Shield,
      tone: '#FFC857',
    },
    {
      label: 'Canal em Atenção',
      raw: null,
      format: (_v: number) => sorted.attention.marketplace,
      channel: sorted.attention.marketplace,
      sub: `${sorted.attention.status} · ${pct(sorted.attention.trend)}%`,
      icon: AlertTriangle,
      tone: '#FF5F7A',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {verdicts.map((v) => {
        const Icon = v.icon
        const brand = getMarketplaceColor(v.channel as any)
        return (
          <div key={v.label} className="overview-glass overview-card-hover relative flex h-full min-h-[98px] flex-col overflow-hidden rounded-[18px] p-2.5">
            <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: brand }} />
            <div className="mb-1.5 flex min-h-[28px] items-start justify-between gap-1.5">
              <span className="text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">{v.label}</span>
              <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: v.tone }} />
            </div>
            <div className="font-mono text-[16px] font-bold leading-none tracking-tight text-text-primary">
              {v.raw !== null ? <AnimatedNumber value={v.raw} format={v.format} /> : v.format(0)}
            </div>
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
