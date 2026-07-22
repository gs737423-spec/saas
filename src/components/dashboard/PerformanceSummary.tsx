import { Crown, Rocket, PackageX, TrendingDown, TrendingUp } from 'lucide-react'
import { performanceSummary } from '@/data/mockData'

const kindIcon = { top: Crown, growth: Rocket, stock: PackageX, loss: TrendingDown }

// Per-card accent: top → blue/cyan, growth → green, critical stock → red/orange, opportunities → purple/blue
const accents = {
  top: { primary: '#5AB7FF', secondary: '#2F6BFF' },
  growth: { primary: '#2BD6A0', secondary: '#5AB7FF' },
  stock: { primary: '#FF5F7A', secondary: '#FFC857' },
  loss: { primary: '#194B9B', secondary: '#2F6BFF' },
}

export default function PerformanceSummary() {
  return (
    <div className="flex h-full flex-col gap-3">
      {performanceSummary.map((s) => {
        const Icon = kindIcon[s.kind]
        const a = accents[s.kind]
        const positive = s.change >= 0
        return (
          <div
            key={s.label}
            className="glass-panel glass-panel-hover group relative flex-1 overflow-hidden rounded-2xl p-4"
          >
            {/* primary corner glow — top right */}
            <div
              className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${a.primary}3D, transparent 68%)` }}
            />
            {/* soft secondary accent — bottom left */}
            <div
              className="pointer-events-none absolute -bottom-14 -left-12 h-28 w-28 rounded-full opacity-35 blur-2xl transition-opacity duration-500 group-hover:opacity-55"
              style={{ background: `radial-gradient(circle, ${a.secondary}20, transparent 70%)` }}
            />

            <div className="relative flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: `${a.primary}14`,
                  boxShadow: `0 0 20px -5px ${a.primary}99, inset 0 0 0 1px ${a.primary}33`,
                }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color: a.primary }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</span>
                  <span className={`flex items-center gap-0.5 text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {positive ? '+' : ''}{s.change}%
                  </span>
                </div>
                <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">{s.primary}</p>
                <p className="mt-0.5 truncate text-[11px] text-text-secondary">{s.secondary}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
