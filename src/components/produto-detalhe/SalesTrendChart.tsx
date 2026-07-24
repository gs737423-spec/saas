import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { getSalesTrend, type TrendPeriod } from '@/data/mockData'

const periods: TrendPeriod[] = ['7D', '30D', '3M', '12M']

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i]
    const p1 = points[i + 1]
    const midX = (p0.x + p1.x) / 2
    d += ` C ${midX} ${p0.y}, ${midX} ${p1.y}, ${p1.x} ${p1.y}`
  }
  return d
}

export default function SalesTrendChart({ sku }: { sku: string }) {
  const [period, setPeriod] = useState<TrendPeriod>('30D')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const data = getSalesTrend(sku, period)

  const maxUnits = Math.max(...data.map((d) => d.units))
  const maxRevenue = Math.max(...data.map((d) => d.revenue))
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalUnits = data.reduce((s, d) => s + d.units, 0)
  const half = Math.floor(data.length / 2)
  const firstHalfRevenue = data.slice(0, half).reduce((s, d) => s + d.revenue, 0) || 1
  const secondHalfRevenue = data.slice(half).reduce((s, d) => s + d.revenue, 0)
  const pctChange = Math.round(((secondHalfRevenue - firstHalfRevenue) / firstHalfRevenue) * 100)
  const positive = pctChange >= 0

  const linePoints = useMemo(
    () => data.map((d, i) => ({ x: (i / (data.length - 1)) * 100, y: 100 - (d.revenue / maxRevenue) * 88 })),
    [data, maxRevenue]
  )
  const path = useMemo(() => smoothPath(linePoints), [linePoints])

  const active = hoverIdx !== null ? data[hoverIdx] : null

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Tendência de Vendas</h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-text-muted"><span className="font-mono text-base font-bold text-text-primary">{totalUnits.toLocaleString('pt-BR')}</span> <span className="text-xs">un.</span></span>
            <span className="font-mono text-base font-bold text-text-primary">R$ {totalRevenue.toLocaleString('pt-BR')}</span>
            <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
              {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {positive ? '+' : ''}{pctChange}%
            </span>
          </div>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-border-subtle bg-bg-card/60 p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setHoverIdx(null) }}
              className={`rounded-md px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                period === p ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-2 flex items-center gap-4 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent-blue/60" />Unidades</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-accent-cyan" />Faturamento</span>
      </div>

      <div
        className="relative h-44 sm:h-52"
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Grid lines */}
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-px w-full bg-border-subtle/40" />
          ))}
        </div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#5AB7FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#5AB7FF" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="url(#trendLine)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          {hoverIdx !== null && (
            <circle cx={linePoints[hoverIdx].x} cy={linePoints[hoverIdx].y} r="1.8" fill="#5AB7FF" stroke="#04101c" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        <div className="flex h-full items-stretch gap-1 sm:gap-1.5">
          {data.map((d, i) => (
            <div
              key={d.label}
              className="group relative flex flex-1 flex-col items-center justify-end gap-1.5"
              onMouseEnter={() => setHoverIdx(i)}
            >
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${(d.units / maxUnits) * 100}%`,
                    background: hoverIdx === i ? 'linear-gradient(180deg, #63B3FF, #2F6BFF60)' : 'linear-gradient(180deg, #2F6BFF, #2F6BFF30)',
                    boxShadow: hoverIdx === i ? '0 0 16px -2px #2F6BFFcc' : '0 0 10px -4px #2F6BFF99',
                  }}
                />
              </div>
              <span className="text-[9.5px] text-text-muted">{d.label}</span>

              {hoverIdx === i && active && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[160px] -translate-x-1/2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 shadow-xl">
                  <p className="text-[10px] font-semibold text-text-muted">{active.label}</p>
                  <p className="mt-0.5 font-mono text-[12px] font-semibold text-accent-blue">{active.units} un.</p>
                  <p className="font-mono text-[12px] font-semibold text-accent-cyan">R$ {active.revenue.toLocaleString('pt-BR')}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
