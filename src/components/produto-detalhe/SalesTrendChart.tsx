import { useState } from 'react'
import { getSalesTrend, type TrendPeriod } from '@/data/mockData'

const periods: TrendPeriod[] = ['7D', '30D', '3M', '12M']

export default function SalesTrendChart({ sku }: { sku: string }) {
  const [period, setPeriod] = useState<TrendPeriod>('30D')
  const data = getSalesTrend(sku, period)
  const maxUnits = Math.max(...data.map((d) => d.units))
  const maxRevenue = Math.max(...data.map((d) => d.revenue))
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const totalUnits = data.reduce((s, d) => s + d.units, 0)

  const linePoints = data
    .map((d, i) => {
      const x = (i / (data.length - 1)) * 100
      const y = 100 - (d.revenue / maxRevenue) * 90
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Tendência de Vendas</h3>
          <p className="mt-0.5 text-xs text-text-muted">
            <span className="font-mono text-text-secondary">{totalUnits.toLocaleString('pt-BR')}</span> un. ·{' '}
            <span className="font-mono text-text-secondary">R$ {totalRevenue.toLocaleString('pt-BR')}</span> no período
          </p>
        </div>
        <div className="flex shrink-0 gap-1 rounded-lg border border-border-subtle bg-bg-card/60 p-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
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

      <div className="relative h-40 sm:h-48">
        <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polyline points={linePoints} fill="none" stroke="#22D3EE" strokeWidth="1.5" vectorEffect="non-scaling-stroke" style={{ filter: 'drop-shadow(0 0 4px #22D3EEaa)' }} />
        </svg>
        <div className="flex h-full items-stretch gap-1.5 sm:gap-2">
          {data.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1.5">
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-md transition-all duration-500"
                  style={{
                    height: `${(d.units / maxUnits) * 100}%`,
                    background: 'linear-gradient(180deg, #4C82F7, #4C82F740)',
                    boxShadow: '0 0 14px -4px #4C82F799',
                  }}
                />
              </div>
              <span className="text-[9.5px] text-text-muted">{d.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
