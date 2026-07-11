import { TrendingUp, TrendingDown, DollarSign, Wallet, ShoppingCart, Receipt, Percent, Gauge } from 'lucide-react'
import { overviewKpis, type OverviewKpi, type KpiTone } from '@/data/mockData'

const iconByKey: Record<string, typeof DollarSign> = {
  gross: DollarSign,
  net: Wallet,
  orders: ShoppingCart,
  ticket: Receipt,
  fees: Percent,
  efficiency: Gauge,
}

const toneColor: Record<KpiTone, string> = {
  blue: '#4C82F7',
  emerald: '#16C784',
  cyan: '#22D3EE',
  amber: '#F5C24B',
  violet: '#9061F9',
  neutral: '#59688A',
}

function Delta({ change }: { change: number }) {
  const positive = change >= 0
  return (
    <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '+' : ''}{change.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%
    </span>
  )
}

function HeroCard({ kpi }: { kpi: OverviewKpi }) {
  const Icon = iconByKey[kpi.key] ?? Wallet
  const c = toneColor[kpi.tone]
  return (
    <div className="overview-hero-card overview-card-hover relative flex flex-col justify-between overflow-hidden rounded-[22px] p-5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}66, transparent)` }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{kpi.label}</span>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${c}16`, boxShadow: `inset 0 0 0 1px ${c}33` }}>
          <Icon className="icon-halo h-[18px] w-[18px]" style={{ color: c }} />
        </div>
      </div>
      <div>
        <div className="mt-4 flex items-center gap-2">
          <div className="num-glow font-mono text-[34px] font-bold leading-none tracking-tight text-text-primary">
            {kpi.prefix && <span className="text-lg font-semibold text-text-secondary">{kpi.prefix} </span>}
            {kpi.value}
            {kpi.suffix && <span className="text-lg font-semibold text-text-secondary">{kpi.suffix}</span>}
          </div>
          {kpi.tag && (
            <span className="rounded border border-border-default/70 bg-bg-primary/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-muted">
              {kpi.tag}
            </span>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Delta change={kpi.change} />
          <span className="truncate text-xs text-text-muted">{kpi.context}</span>
        </div>
      </div>
    </div>
  )
}

function StatCard({ kpi }: { kpi: OverviewKpi }) {
  const Icon = iconByKey[kpi.key] ?? DollarSign
  const attention = kpi.key === 'fees'
  const c = attention ? toneColor.amber : toneColor[kpi.tone]
  return (
    <div className="overview-glass overview-card-hover relative overflow-hidden rounded-[18px] p-3.5">
      {/* thin left accent only for the attention (fees) card */}
      {attention && <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: c }} />}
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{kpi.label}</span>
        <Icon className="h-4 w-4" style={{ color: c }} />
      </div>
      <div className="flex items-baseline gap-1.5">
        <div className="font-mono text-[20px] font-bold leading-none tracking-tight text-text-primary">
          {kpi.prefix && <span className="text-xs font-semibold text-text-secondary">{kpi.prefix} </span>}
          {kpi.value}
          {kpi.suffix && <span className="text-xs font-semibold text-text-secondary">{kpi.suffix}</span>}
        </div>
        {kpi.tag && (
          <span className="rounded border border-border-default/60 bg-bg-primary/50 px-1 py-0.5 text-[8px] font-medium uppercase tracking-wide text-text-muted">
            {kpi.tag}
          </span>
        )}
      </div>
      <div className="mt-2 flex items-center gap-1.5">
        <Delta change={kpi.change} />
        <span className="truncate text-[10px] text-text-muted">{kpi.context}</span>
      </div>
    </div>
  )
}

export default function KPICards() {
  const hero = overviewKpis.find((k) => k.hero)!
  const rest = overviewKpis.filter((k) => !k.hero)
  return (
    <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_2.4fr]">
      <HeroCard kpi={hero} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {rest.map((kpi) => (
          <StatCard key={kpi.key} kpi={kpi} />
        ))}
      </div>
    </div>
  )
}
