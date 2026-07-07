import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Target } from 'lucide-react'
import { kpis } from '@/data/mockData'

const icons = [DollarSign, ShoppingCart, Receipt, Target]

// Per-metric accent: revenue → blue/cyan, orders → green, ticket → purple, conversion → yellow/orange
const accents = [
  { primary: '#22D3EE', secondary: '#4C82F7' },
  { primary: '#16C784', secondary: '#22D3EE' },
  { primary: '#9061F9', secondary: '#4C82F7' },
  { primary: '#F5A524', secondary: '#F5C24B' },
]

export default function KPICards() {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {kpis.map((kpi, i) => {
        const Icon = icons[i]
        const positive = kpi.change >= 0
        const a = accents[i]
        return (
          <div
            key={kpi.label}
            className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4"
          >
            {/* primary corner glow — top right */}
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${a.primary}40, transparent 68%)` }}
            />
            {/* soft secondary accent — bottom left */}
            <div
              className="pointer-events-none absolute -bottom-16 -left-14 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: `radial-gradient(circle, ${a.secondary}22, transparent 70%)` }}
            />

            <div className="relative mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">{kpi.label}</span>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{
                  background: `${a.primary}14`,
                  boxShadow: `0 0 20px -5px ${a.primary}99, inset 0 0 0 1px ${a.primary}33`,
                }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color: a.primary }} />
              </div>
            </div>

            <div className="relative mb-2 text-[26px] font-bold leading-none tracking-tight text-text-primary">
              {kpi.prefix && <span className="text-base font-semibold text-text-secondary">{kpi.prefix} </span>}
              {kpi.value}
              {kpi.suffix && <span className="text-base font-semibold text-text-secondary">{kpi.suffix}</span>}
            </div>

            <div className="relative flex items-center gap-2">
              <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {positive ? '+' : ''}{kpi.change}%
              </span>
              <span className="text-[11px] text-text-muted">vs mês anterior</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
