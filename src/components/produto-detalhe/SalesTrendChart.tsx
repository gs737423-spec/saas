import { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp } from 'lucide-react'
import type { DashboardProduct, ProductSalesPoint } from '@/server/dashboardProducts'

interface Props {
  product: DashboardProduct
  periodDays: number
  points: ProductSalesPoint[]
  source: 'real' | 'demo'
  unavailable?: boolean
}

function demoPoints(product: DashboardProduct, periodDays: number): ProductSalesPoint[] {
  const count = Math.min(10, Math.max(4, Math.round(periodDays / 3)))
  const weights = Array.from({ length: count }, (_, index) => 0.65 + Math.sin(index * 0.8 + product.id.length) * 0.25)
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
  return weights.map((weight, index) => ({
    date: new Date(Date.now() - (count - index - 1) * Math.max(1, Math.round(periodDays / count)) * 86400000).toISOString().slice(0, 10),
    units: Math.round(product.units * weight / totalWeight),
    revenue: Math.round(product.revenue * weight / totalWeight),
  }))
}

function labelFor(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).replace('.', '')
}

function smoothPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return ''
  let path = `M ${points[0].x} ${points[0].y}`
  for (let index = 0; index < points.length - 1; index++) {
    const current = points[index]
    const next = points[index + 1]
    const midX = (current.x + next.x) / 2
    path += ` C ${midX} ${current.y}, ${midX} ${next.y}, ${next.x} ${next.y}`
  }
  return path
}

export default function SalesTrendChart({ product, periodDays, points, source, unavailable = false }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)
  const data = useMemo(() => source === 'demo' ? demoPoints(product, periodDays) : points, [periodDays, points, product, source])
  const maxUnits = Math.max(1, ...data.map((point) => point.units))
  const maxRevenue = Math.max(1, ...data.map((point) => point.revenue))
  const positive = (product.trend ?? 0) >= 0
  const linePoints = useMemo(() => data.map((point, index) => ({ x: (index / Math.max(1, data.length - 1)) * 100, y: 100 - (point.revenue / maxRevenue) * 88 })), [data, maxRevenue])
  const path = useMemo(() => smoothPath(linePoints), [linePoints])
  const active = hoverIdx !== null ? data[hoverIdx] : null

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Tendência de Vendas</h3>
          <p className="mt-0.5 text-[10.5px] text-text-muted">{source === 'demo' ? 'Dados ilustrativos do modo demonstração' : 'Vendas reais por data no período'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-text-muted"><span className="font-mono text-base font-bold text-text-primary">{product.units.toLocaleString('pt-BR')}</span> <span className="text-xs">un.</span></span>
            <span className="font-mono text-base font-bold text-text-primary">R$ {product.revenue.toLocaleString('pt-BR')}</span>
            {product.trend !== null && <span className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>{positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}{positive ? '+' : ''}{product.trend.toFixed(1)}%</span>}
          </div>
        </div>
        <span className="shrink-0 rounded-lg border border-border-subtle bg-bg-card/60 px-2.5 py-1.5 text-[11px] font-semibold text-text-muted">{periodDays}D</span>
      </div>

      {data.length === 0 ? <div className="flex h-44 items-center justify-center rounded-xl border border-dashed border-border-subtle px-6 text-center text-[12px] text-text-muted sm:h-52">{unavailable ? 'A série diária não está disponível no momento.' : 'Nenhuma venda paga deste produto foi encontrada no período.'}</div> : <>
        <div className="mb-2 flex items-center gap-4 text-[11px] text-text-secondary"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-accent-blue/60" />Unidades</span><span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded-full bg-accent-primary" />Faturamento</span></div>
        <div className="relative h-44 sm:h-52" onMouseLeave={() => setHoverIdx(null)}>
          <div className="pointer-events-none absolute inset-0 flex flex-col justify-between">{[0, 1, 2, 3].map((index) => <div key={index} className="h-px w-full bg-border-subtle/40" />)}</div>
          <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none"><defs><linearGradient id="trendLine" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" /><stop offset="100%" stopColor="#6366F1" stopOpacity="1" /></linearGradient></defs><path d={path} fill="none" stroke="url(#trendLine)" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />{hoverIdx !== null && <circle cx={linePoints[hoverIdx].x} cy={linePoints[hoverIdx].y} r="1.8" fill="#6366F1" stroke="#04101c" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />}</svg>
          <div className="flex h-full items-stretch gap-1 sm:gap-1.5">{data.map((point, index) => <div key={point.date} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5" onMouseEnter={() => setHoverIdx(index)}><div className="flex w-full flex-1 items-end"><div className="w-full rounded-t-md transition-all duration-300" style={{ height: `${(point.units / maxUnits) * 100}%`, background: hoverIdx === index ? 'linear-gradient(180deg, #6366F1, #3A8DFF60)' : 'linear-gradient(180deg, #3A8DFF, #3A8DFF30)' }} /></div><span className="text-[9.5px] text-text-muted">{labelFor(point.date)}</span>{hoverIdx === index && active && <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-max max-w-[190px] -translate-x-1/2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 shadow-xl"><p className="text-[10px] font-semibold text-text-muted">{labelFor(active.date)}{source === 'demo' ? ' · demonstrativo' : ''}</p><p className="mt-0.5 font-mono text-[12px] font-semibold text-accent-blue">{active.units} un.</p><p className="font-mono text-[12px] font-semibold text-accent-primary">R$ {active.revenue.toLocaleString('pt-BR')}</p></div>}</div>)}</div>
        </div>
      </>}
    </div>
  )
}
