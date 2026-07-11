import { Wallet, Crown, Tag, Rocket, AlertTriangle } from 'lucide-react'
import { marketplaceMetrics } from '@/data/mockData'

const totalRevenue = marketplaceMetrics.reduce((s, m) => s + m.revenue, 0)
const leader = [...marketplaceMetrics].sort((a, b) => b.revenue - a.revenue)[0]
const bestTicket = [...marketplaceMetrics].sort((a, b) => b.avgTicket - a.avgTicket)[0]
const bestGrowth = [...marketplaceMetrics].sort((a, b) => b.trend - a.trend)[0]
const attention = marketplaceMetrics.find((m) => m.status !== 'Saudável') ?? marketplaceMetrics[marketplaceMetrics.length - 1]

const cards = [
  { label: 'Faturamento Total', value: `R$ ${totalRevenue.toLocaleString('pt-BR')}`, sub: `${marketplaceMetrics.length} canais ativos`, icon: Wallet, primary: '#4C82F7', secondary: '#22D3EE' },
  { label: 'Canal Líder', value: leader.marketplace, sub: `R$ ${leader.revenue.toLocaleString('pt-BR')} · ${leader.sharePct}% do total`, icon: Crown, primary: '#F5A524', secondary: '#F5C24B' },
  { label: 'Melhor Ticket Médio', value: `R$ ${bestTicket.avgTicket.toFixed(0)}`, sub: bestTicket.marketplace, icon: Tag, primary: '#9061F9', secondary: '#4C82F7' },
  { label: 'Maior Crescimento', value: `+${bestGrowth.trend}%`, sub: bestGrowth.marketplace, icon: Rocket, primary: '#16C784', secondary: '#22D3EE' },
  { label: 'Canal com Atenção', value: attention.marketplace, sub: `Margem ${attention.margin}% · ${attention.status}`, icon: AlertTriangle, primary: '#F4436C', secondary: '#F9603C' },
]

export default function CanalKPIs() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${c.primary}40, transparent 68%)` }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-14 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: `radial-gradient(circle, ${c.secondary}22, transparent 70%)` }}
            />
            <div className="relative mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">{c.label}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${c.primary}14`, boxShadow: `0 0 20px -5px ${c.primary}99, inset 0 0 0 1px ${c.primary}33` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: c.primary }} />
              </div>
            </div>
            <div className="relative mb-1.5 truncate text-lg font-bold leading-tight tracking-tight text-text-primary">{c.value}</div>
            <div className="relative truncate text-[11px] text-text-muted">{c.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
