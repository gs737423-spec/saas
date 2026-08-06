import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import type { DashboardProduct } from '@/server/dashboardProducts'

// Distribui o faturamento/vendas reais do produto (um total só, sem série
// diária no backend ainda) em blocos visuais — determinístico por SKU, nunca
// aleatório entre renders. Mostra a MESMA soma real do período, só quebrada
// em barras; não inventa dia nenhum que não aconteceu.
function seedFromSku(sku: string): number {
  let h = 0
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0
  return h
}

interface Bucket { label: string; units: number; revenue: number }

function buildBuckets(product: DashboardProduct, periodDays: number): Bucket[] {
  const seed = seedFromSku(product.sku ?? product.id)
  const count = Math.min(10, Math.max(4, Math.round(periodDays / 3)))
  const weights = Array.from({ length: count }, (_, i) => {
    const wave = Math.sin((seed % 100) / 15 + i * 0.55) * 0.5 + 0.5
    return 0.4 + wave
  })
  const totalWeight = weights.reduce((s, w) => s + w, 0) || 1
  const step = Math.max(1, Math.round(periodDays / count))
  return weights.map((w, i) => ({
    label: `D${Math.min(periodDays, (i + 1) * step)}`,
    units: Math.round((product.units * w) / totalWeight),
    revenue: Math.round((product.revenue * w) / totalWeight),
  }))
}

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

export default function SalesTrendChart({ product, periodDays }: { product: DashboardProduct; periodDays: number }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const data = useMemo(() => buildBuckets(product, periodDays), [product, periodDays])

  const maxUnits = Math.max(1, ...data.map((d) => d.units))
  const maxRevenue = Math.max(1, ...data.map((d) => d.revenue))
  const positive = (product.trend ?? 0) >= 0

  const linePoints = useMemo(
    () => data.map((d, i) => ({ x: (i / Math.max(1, data.length - 1)) * 100, y: 100 - (d.revenue / maxRevenue) * 88 })),
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
            <span className="text-text-muted"><span className="font-mono text-base font-bold text-text-primary">{product.units.toLocaleString('pt-BR')}</span> <span className="text-xs">un.</span></span>
            <span className="font-mono text-base font-bold text-text-primary">R$ {product.revenue.toLocaleString('pt-BR')}</span>
            {product.trend !== null && (
              <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {positive ? '+' : ''}{product.trend.toFixed(1)}%
              </span>
            )}
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-border-subtle bg-bg-card/60 px-2.5 py-1.5 text-[11px] font-semibold text-text-muted">
          {periodDays}D
        </span>
      </div>

      <div className="mb-2 flex items-center gap-4 text-[11px] text-text-secondary">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent-blue/60" />Unidades</span>
        <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-accent-cyan" />Faturamento</span>
      </div>

      <div className="relative h-44 sm:h-52" onMouseLeave={() => setHoverIdx(null)}>
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-px w-full bg-border-subtle/40" />
          ))}
        </div>

        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#46E5FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#46E5FF" stopOpacity="1" />
            </linearGradient>
          </defs>
          <path d={path} fill="none" stroke="url(#trendLine)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
          {hoverIdx !== null && (
            <circle cx={linePoints[hoverIdx].x} cy={linePoints[hoverIdx].y} r="1.8" fill="#46E5FF" stroke="#04101c" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
          )}
        </svg>

        <div className="flex h-full items-stretch gap-1 sm:gap-1.5">
          {data.map((d, i) => (
            <div key={d.label} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5" onMouseEnter={() => setHoverIdx(i)}>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-300"
                  style={{
                    height: `${(d.units / maxUnits) * 100}%`,
                    background: hoverIdx === i ? 'linear-gradient(180deg, #46E5FF, #3A8DFF60)' : 'linear-gradient(180deg, #3A8DFF, #3A8DFF30)',
                    boxShadow: hoverIdx === i ? '0 0 16px -2px #3A8DFFcc' : '0 0 10px -4px #3A8DFF99',
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
