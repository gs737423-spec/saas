import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { revenueData, getMarketplaceColor, type Marketplace } from '@/data/mockData'

type Period = '6M' | '3M' | '1M'
const periods: Period[] = ['6M', '3M', '1M']
const periodMonths: Record<Period, number> = { '6M': 6, '3M': 3, '1M': 1 }

const channels: { key: 'mercadoLivre' | 'shopee' | 'amazon' | 'lojaPropria'; label: Marketplace }[] = [
  { key: 'mercadoLivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojaPropria', label: 'Loja Própria' },
]

const brl = (v: number) => v.toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

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

export default function RevenueByChannelChart() {
  const [period, setPeriod] = useState<Period>('6M')
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  const months = useMemo(() => revenueData.slice(-periodMonths[period]), [period])
  const maxValue = Math.max(...months.flatMap((m) => channels.map((c) => m[c.key])), 1)
  const totalRevenue = months.reduce((s, m) => s + m.total, 0)

  const channelSummary = useMemo(() => {
    return channels
      .map((c) => {
        const total = months.reduce((s, m) => s + m[c.key], 0)
        const first = months[0]?.[c.key] ?? 0
        const last = months[months.length - 1]?.[c.key] ?? 0
        const growth = first > 0 ? ((last - first) / first) * 100 : 0
        return { ...c, total, growth }
      })
      .sort((a, b) => b.total - a.total)
  }, [months])

  const linesData = useMemo(
    () =>
      channels.map((c) => ({
        ...c,
        points: months.map((m, i) => ({
          x: months.length > 1 ? (i / (months.length - 1)) * 100 : 50,
          y: 100 - (m[c.key] / maxValue) * 92,
        })),
      })),
    [months, maxValue]
  )

  return (
    <div className="overview-glass-elevated relative overflow-hidden rounded-[22px] p-4 sm:p-5">
      <div className="relative mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Receita por Canal</h3>
          <p className="mt-0.5 text-xs text-text-muted">Total do período: <span className="font-mono text-text-secondary">R$ {brl(totalRevenue)}</span></p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-border-subtle bg-bg-primary/40 p-1">
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

      {/* Resposta imediata: quem lidera, quem cresce, quem cai */}
      <div className="relative mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {channelSummary.map((c) => {
          const brand = getMarketplaceColor(c.label)
          const positive = c.growth >= 0
          return (
            <div key={c.key} className="overview-glass relative overflow-hidden rounded-xl px-3 py-2.5">
              <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: brand }} />
              <div className="flex items-center gap-1.5 pl-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                <span className="truncate text-[10.5px] font-medium text-text-secondary">{c.label}</span>
              </div>
              <div className="mt-1 pl-1.5 font-mono text-[15px] font-bold leading-none text-text-primary">R$ {brl(c.total)}</div>
              <div className={`mt-1 flex items-center gap-1 pl-1.5 text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {positive ? '+' : ''}{pct(c.growth)}%
              </div>
            </div>
          )
        })}
      </div>

      <div className="overview-track relative h-36 overflow-hidden rounded-xl sm:h-40" onMouseLeave={() => setHoverIdx(null)}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-px w-full bg-white/[0.05]" />
          ))}
        </div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            {linesData.map((l) => (
              <linearGradient key={l.key} id={`fill-${l.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={getMarketplaceColor(l.label)} stopOpacity="0.28" />
                <stop offset="100%" stopColor={getMarketplaceColor(l.label)} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {linesData.map((l) => {
            const color = getMarketplaceColor(l.label)
            if (l.points.length < 2) {
              const p = l.points[0]
              return (
                <circle key={l.key} cx={p.x} cy={p.y} r="2.2" fill={color} stroke="#04101c" strokeWidth="0.8" vectorEffect="non-scaling-stroke" style={{ filter: `drop-shadow(0 0 5px ${color}bb)` }} />
              )
            }
            const path = smoothPath(l.points)
            const areaPath = `${path} L ${l.points[l.points.length - 1].x} 100 L ${l.points[0].x} 100 Z`
            return (
              <g key={l.key}>
                <path d={areaPath} fill={`url(#fill-${l.key})`} stroke="none" />
                <path
                  d={path}
                  fill="none"
                  stroke={color}
                  strokeWidth="1.7"
                  strokeOpacity="0.95"
                  vectorEffect="non-scaling-stroke"
                  style={{ filter: `drop-shadow(0 0 4px ${color}99)` }}
                />
              </g>
            )
          })}

          {hoverIdx !== null && linesData[0]?.points[hoverIdx] && (
            <line
              x1={linesData[0].points[hoverIdx].x}
              y1="0"
              x2={linesData[0].points[hoverIdx].x}
              y2="100"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="1"
              strokeDasharray="2,2"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        <div className="flex h-full items-stretch">
          {months.map((m, i) => (
            <div
              key={m.month}
              className="relative flex flex-1 flex-col justify-end"
              onMouseEnter={() => setHoverIdx(i)}
            >
              <div className="flex-1" />
              <span className="pb-0.5 text-center text-[9.5px] text-text-muted">{m.month}</span>

              {hoverIdx === i && (
                <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[190px] -translate-x-1/2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 shadow-xl">
                  <p className="mb-1 text-[10px] font-semibold text-text-muted">{m.month}</p>
                  {channels.map((c) => (
                    <div key={c.key} className="flex items-center justify-between gap-3 text-[11px]">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ background: getMarketplaceColor(c.label) }} />
                        {c.label}
                      </span>
                      <span className="font-mono font-medium text-text-primary">R$ {m[c.key].toLocaleString('pt-BR')}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
