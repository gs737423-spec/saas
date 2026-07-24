import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, Receipt, Percent, RotateCcw } from 'lucide-react'
import { overviewKpis, type OverviewKpi, type KpiTone } from '@/data/mockData'
import { BASELINE_DAYS, type PeriodOption } from '@/lib/periods'
import AnimatedNumber from '@/components/common/AnimatedNumber'

function formatKpiValue(kpi: OverviewKpi, raw: number): string {
  if (kpi.key === 'ticket') {
    return raw.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return Math.round(raw).toLocaleString('pt-BR')
}

interface ResolvedKpi extends OverviewKpi {
  /** Scaled numeric value (post period-scaling), fed to the counter animation. */
  resolvedRaw: number
}

/** Scales a 30-day baseline KPI to the selected period. */
function resolveKpi(kpi: OverviewKpi, period: PeriodOption): ResolvedKpi {
  const scale = kpi.scalesWithPeriod ? (period.days / BASELINE_DAYS) * period.jitter : period.jitter
  const raw = kpi.raw * scale
  return { ...kpi, value: formatKpiValue(kpi, raw), resolvedRaw: raw }
}

const iconByKey: Record<string, typeof DollarSign> = {
  gross: DollarSign,
  orders: ShoppingCart,
  ticket: Receipt,
  fees: Percent,
  returns: RotateCcw,
}

const toneColor: Record<KpiTone, string> = {
  blue: '#2F6BFF',
  emerald: '#2BD6A0',
  cyan: '#5AB7FF',
  amber: '#FFC857',
  violet: '#194B9B',
  neutral: '#6F829B',
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

function HeroCard({ kpi }: { kpi: ResolvedKpi }) {
  const Icon = iconByKey[kpi.key] ?? DollarSign
  const c = toneColor[kpi.tone]
  return (
    <div className="overview-hero-card overview-card-hover relative flex flex-col justify-between overflow-hidden rounded-2xl p-3.5">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c}66, transparent)` }} />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{kpi.label}</span>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c}16`, boxShadow: `inset 0 0 0 1px ${c}33` }}>
          <Icon className="icon-halo h-4 w-4" style={{ color: c }} />
        </div>
      </div>
      <div>
        <div className="mt-2.5 flex items-center gap-2">
          <div className="num-glow font-mono text-[28px] font-bold leading-none tracking-tight text-text-primary">
            {kpi.prefix && <span className="text-base font-semibold text-text-secondary">{kpi.prefix} </span>}
            <AnimatedNumber value={kpi.resolvedRaw} format={(v) => formatKpiValue(kpi, v)} />
            {kpi.suffix && <span className="text-base font-semibold text-text-secondary">{kpi.suffix}</span>}
          </div>
          {kpi.tag && (
            <span className="rounded border border-border-default/70 bg-bg-primary/50 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-muted">
              {kpi.tag}
            </span>
          )}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Delta change={kpi.change} />
          {kpi.context && <span className="truncate text-xs text-text-muted">{kpi.context}</span>}
        </div>
      </div>
    </div>
  )
}

function StatCard({ kpi }: { kpi: ResolvedKpi }) {
  const Icon = iconByKey[kpi.key] ?? DollarSign
  const attention = kpi.key === 'fees'
  const c = attention ? toneColor.amber : toneColor[kpi.tone]
  return (
    <div className="overview-glass overview-card-hover relative flex h-full min-h-[112px] flex-col overflow-hidden rounded-xl p-2.5">
      {/* thin left accent only for the attention (fees) card */}
      {attention && <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: c }} />}
      <div className="mb-1.5 flex h-3.5 items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{kpi.label}</span>
        <Icon className="h-3.5 w-3.5" style={{ color: c }} />
      </div>
      <div className="flex h-5 items-baseline gap-1.5">
        <div className="font-mono text-[18px] font-bold leading-none tracking-tight text-text-primary">
          {kpi.prefix && <span className="text-xs font-semibold text-text-secondary">{kpi.prefix} </span>}
          <AnimatedNumber value={kpi.resolvedRaw} format={(v) => formatKpiValue(kpi, v)} />
          {kpi.suffix && <span className="text-xs font-semibold text-text-secondary">{kpi.suffix}</span>}
        </div>
        {kpi.tag && (
          <span className="rounded border border-border-default/60 bg-bg-primary/50 px-1 py-0.5 text-[8px] font-medium uppercase tracking-wide text-text-muted">
            {kpi.tag}
          </span>
        )}
      </div>
      <div className="mt-auto flex items-center gap-1.5 pt-1.5">
        <Delta change={kpi.change} />
        <span className="truncate text-[10px] text-text-muted">{kpi.context}</span>
      </div>
    </div>
  )
}

export default function KPICards({ period }: { period: PeriodOption }) {
  const resolved = overviewKpis.map((kpi) => resolveKpi(kpi, period))
  const hero = resolved.find((k) => k.hero)!
  const rest = resolved.filter((k) => !k.hero)
  return (
    <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[1.15fr_2.4fr]">
      <HeroCard kpi={hero} />
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {rest.map((kpi) => (
          <StatCard key={kpi.key} kpi={kpi} />
        ))}
      </div>
    </div>
  )
}
