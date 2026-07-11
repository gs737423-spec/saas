import { Crown, Receipt, ShoppingCart, TrendingUp, AlertTriangle, Shield } from 'lucide-react'
import { channelOverview, getMarketplaceColor } from '@/data/mockData'

const sorted = {
  byNet: [...channelOverview].sort((a, b) => b.netRevenue - a.netRevenue),
  byTicket: [...channelOverview].sort((a, b) => b.avgTicket - a.avgTicket),
  byOrders: [...channelOverview].sort((a, b) => b.orders - a.orders),
  byGrowth: [...channelOverview].sort((a, b) => b.trend - a.trend),
  byFees: [...channelOverview].sort((a, b) => b.feePct - a.feePct),
  attention: channelOverview.find((m) => m.status !== 'Saudável') ?? [...channelOverview].sort((a, b) => a.trend - b.trend)[0],
}

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const verdicts = [
  {
    label: 'Líder em Líquido',
    value: `R$ ${brl(sorted.byNet[0].netRevenue)}`,
    channel: sorted.byNet[0].marketplace,
    sub: `${pct(sorted.byNet[0].netSharePct)}% do líquido total`,
    icon: Crown,
    tone: '#16C784',
  },
  {
    label: 'Melhor Ticket',
    value: `R$ ${brl2(sorted.byTicket[0].avgTicket)}`,
    channel: sorted.byTicket[0].marketplace,
    sub: `${brl(sorted.byTicket[0].orders)} pedidos`,
    icon: Receipt,
    tone: '#9061F9',
  },
  {
    label: 'Mais Pedidos',
    value: brl(sorted.byOrders[0].orders),
    channel: sorted.byOrders[0].marketplace,
    sub: `ticket R$ ${brl2(sorted.byOrders[0].avgTicket)}`,
    icon: ShoppingCart,
    tone: '#4C82F7',
  },
  {
    label: 'Maior Crescimento',
    value: `+${pct(sorted.byGrowth[0].trend)}%`,
    channel: sorted.byGrowth[0].marketplace,
    sub: `líquido R$ ${brl(sorted.byGrowth[0].netRevenue)}`,
    icon: TrendingUp,
    tone: '#22D3EE',
  },
  {
    label: 'Maior Impacto de Taxas',
    value: `${pct(sorted.byFees[0].feePct)}%`,
    channel: sorted.byFees[0].marketplace,
    sub: `R$ ${brl(sorted.byFees[0].fees)} retidos`,
    icon: Shield,
    tone: '#F5C24B',
  },
  {
    label: 'Canal em Atenção',
    value: sorted.attention.marketplace,
    channel: sorted.attention.marketplace,
    sub: `${sorted.attention.status} · ${pct(sorted.attention.trend)}%`,
    icon: AlertTriangle,
    tone: '#F4436C',
  },
]

export default function ChannelKPIVerdict() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {verdicts.map((v) => {
        const Icon = v.icon
        const brand = getMarketplaceColor(v.channel as any)
        return (
          <div key={v.label} className="overview-glass overview-card-hover relative overflow-hidden rounded-[18px] p-3.5">
            <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: brand }} />
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{v.label}</span>
              <Icon className="h-4 w-4" style={{ color: v.tone }} />
            </div>
            <div className="font-mono text-[18px] font-bold leading-none tracking-tight text-text-primary">
              {v.value}
            </div>
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
              <span className="truncate text-[11px] font-medium text-text-secondary">{v.channel}</span>
            </div>
            <div className="mt-0.5 truncate text-[10px] text-text-muted">{v.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
