import { useEffect, useState } from 'react'
import type { FinanceOverview } from '@/data/financeData'
import { useReducedMotion } from '@/lib/motion'

/* Bridge/waterfall chart do valor líquido estimado. Substitui o antigo
 * BarChart stacked do Recharts (Etapa anterior): aquele exigia hover pra
 * revelar qualquer valor e a barra "delta" ficava sub-dimensionada dentro
 * de uma área alta demais — o oposto do que uma leitura executiva de 3
 * segundos pede. Este componente é HTML/CSS puro (sem SVG, sem lib de
 * gráfico): cada etapa é uma barra posicionada por %, com valor e label
 * sempre visíveis, entrada por transição CSS (sem rAF contínuo). */

const brl = (v: number) => Math.round(Math.abs(v)).toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const brlAxis = (v: number) => `R$ ${Math.round(v / 1000)} mil`

interface Step {
  key: 'gross' | 'fees' | 'refunds' | 'net'
  label: string
  start: number
  end: number
  delta: number
  percentage: number
  color: string
}

function buildSteps(overview: FinanceOverview): Step[] {
  const { grossRevenue, fees, refunds, netValue } = overview
  const safeGross = grossRevenue > 0 ? grossRevenue : 1
  return [
    { key: 'gross', label: 'Faturamento bruto', start: 0, end: grossRevenue, delta: grossRevenue, percentage: 100, color: '#22D3EE' },
    { key: 'fees', label: 'Taxas e comissões', start: grossRevenue, end: grossRevenue - fees, delta: -fees, percentage: (fees / safeGross) * 100, color: '#F5C24B' },
    { key: 'refunds', label: 'Estornos e devoluções', start: grossRevenue - fees, end: netValue, delta: -refunds, percentage: (refunds / safeGross) * 100, color: '#F4436C' },
    { key: 'net', label: 'Valor líquido estimado', start: 0, end: netValue, delta: netValue, percentage: (netValue / safeGross) * 100, color: '#16C784' },
  ]
}

export default function NetValueWaterfall({ overview }: { overview: FinanceOverview }) {
  const reducedMotion = useReducedMotion()
  const [entered, setEntered] = useState(reducedMotion)
  const steps = buildSteps(overview)
  const maxValue = Math.max(overview.grossRevenue, 1)

  useEffect(() => {
    if (reducedMotion) {
      setEntered(true)
      return
    }
    const id = requestAnimationFrame(() => setEntered(true))
    return () => cancelAnimationFrame(id)
  }, [reducedMotion])

  if (import.meta.env.DEV) {
    const expected = overview.grossRevenue - overview.fees - overview.refunds
    if (Math.round(expected) !== Math.round(overview.netValue)) {
      // eslint-disable-next-line no-console
      console.error('NetValueWaterfall: netValue inconsistente com bruto - taxas - estornos', { overview, expected })
    }
  }

  const heightPct = (v: number) => Math.max(0, Math.min(100, (v / maxValue) * 100))
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((f) => maxValue * f)

  return (
    <div className="overview-glass-elevated motion-panel relative overflow-hidden rounded-[22px] p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Composição do valor líquido</h3>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Faturamento bruto menos taxas e estornos — leitura direta, sem precisar passar o mouse.
        </p>
      </div>

      {overview.grossRevenue <= 0 ? (
        <div className="flex h-[220px] items-center justify-center text-sm text-text-muted">
          Sem faturamento no período selecionado.
        </div>
      ) : (
        <div className="finance-waterfall-chart relative">
          {/* gridlines discretas, com valores em R$ */}
          <div className="pointer-events-none absolute inset-x-0 top-0 bottom-[38px]">
            {gridLines.map((v, i) => (
              <div
                key={i}
                className="absolute inset-x-0 flex items-center gap-2"
                style={{ bottom: `${heightPct(v)}%` }}
              >
                <span className="w-14 shrink-0 text-right font-mono text-[9.5px] text-text-muted">{i === 0 ? 'R$ 0' : brlAxis(v)}</span>
                <span className="h-px flex-1 bg-white/[0.05]" />
              </div>
            ))}
          </div>

          <div className="relative grid h-full grid-cols-4 gap-3 pl-16 pb-[38px] sm:gap-4">
            {steps.map((s, i) => {
              const top = heightPct(Math.max(s.start, s.end))
              const bottom = heightPct(Math.min(s.start, s.end))
              const barHeight = Math.max(entered ? top - bottom : 0, 1.5)
              const barBottom = entered ? bottom : bottom
              const isDecrease = s.delta < 0

              return (
                <div key={s.key} className="relative">
                  {/* conector discreto até a próxima etapa */}
                  {i < steps.length - 1 && (
                    <span
                      className="pointer-events-none absolute right-[-0.75rem] z-0 h-px bg-white/10 transition-[bottom] duration-500 ease-out sm:right-[-1rem]"
                      style={{ bottom: `${entered ? top : 0}%`, width: 'calc(100% + 1.5rem)', transitionDelay: `${i * 80}ms` }}
                    />
                  )}

                  {/* valor no topo da barra */}
                  <div
                    className="pointer-events-none absolute inset-x-0 z-10 text-center transition-[bottom,opacity] duration-500 ease-out"
                    style={{ bottom: `calc(${entered ? top : bottom}% + 8px)`, opacity: entered ? 1 : 0, transitionDelay: `${i * 80}ms` }}
                  >
                    <div className="font-mono text-[13px] font-bold leading-none tracking-tight" style={{ color: isDecrease ? s.color : 'var(--color-text-primary)' }}>
                      {isDecrease ? '− ' : ''}R$ {brl(s.delta)}
                    </div>
                  </div>

                  {/* barra */}
                  <div
                    className="absolute inset-x-0 rounded-lg transition-[height,bottom] duration-500 ease-out"
                    style={{
                      bottom: `${barBottom}%`,
                      height: `${barHeight}%`,
                      background: s.color,
                      opacity: 0.85,
                      transitionDelay: `${i * 80}ms`,
                    }}
                  />

                  {/* label + percentual, fora da área de barras */}
                  <div className="absolute inset-x-0 bottom-[-38px] text-center">
                    <div className="truncate text-[10.5px] font-medium text-text-secondary">{s.label}</div>
                    <div className="font-mono text-[11px] font-semibold" style={{ color: s.color }}>
                      {isDecrease ? '-' : ''}{pct(s.percentage)}%
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {overview.grossRevenue > 0 && (
        <p className="mt-2 text-center text-[10.5px] text-text-muted">
          Valor líquido <span className="font-semibold text-accent-emerald">estimado</span> — não representa lucro.
        </p>
      )}
    </div>
  )
}
