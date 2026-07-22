import { useEffect, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { FinanceOverview } from '@/data/financeData'
import { useReducedMotion } from '@/lib/motion'

/* Composição do valor líquido — substitui o waterfall anterior (base
 * transparente + delta em BarChart do Recharts, depois uma variante
 * posicionada por % absoluta): ambas produziam sobreposição de texto e
 * barras "flutuando" fora de contexto. Este componente é fluxo (flexbox,
 * sem coordenadas absolutas) + uma barra proporcional — layout previsível
 * em qualquer altura de conteúdo, sem eixo/grid/tooltip. */

const brl = (v: number) => Math.round(Math.abs(v)).toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

interface FlowStep {
  key: string
  label: string
  value: number
  sharePct: number
  color: string
  isDeduction: boolean
}

function buildFlow(overview: FinanceOverview): FlowStep[] {
  const { grossRevenue, fees, refunds, netValue } = overview
  const safeGross = grossRevenue > 0 ? grossRevenue : 1
  return [
    { key: 'gross', label: 'Faturamento bruto', value: grossRevenue, sharePct: 100, color: '#5AB7FF', isDeduction: false },
    { key: 'fees', label: 'Comissões', value: fees, sharePct: (fees / safeGross) * 100, color: '#FFC857', isDeduction: true },
    { key: 'refunds', label: 'Estornos e devoluções', value: refunds, sharePct: (refunds / safeGross) * 100, color: '#FF5F7A', isDeduction: true },
    { key: 'net', label: 'Valor líquido estimado', value: netValue, sharePct: (netValue / safeGross) * 100, color: '#2BD6A0', isDeduction: false },
  ]
}

interface BarSegment {
  key: string
  label: string
  value: number
  sharePct: number
  color: string
}

function buildSegments(overview: FinanceOverview): BarSegment[] {
  const { grossRevenue, fees, refunds, netValue } = overview
  const safeGross = grossRevenue > 0 ? grossRevenue : 1
  return [
    { key: 'net', label: 'Líquido estimado', value: netValue, sharePct: (netValue / safeGross) * 100, color: '#2BD6A0' },
    { key: 'fees', label: 'Comissões', value: fees, sharePct: (fees / safeGross) * 100, color: '#FFC857' },
    { key: 'refunds', label: 'Estornos', value: refunds, sharePct: (refunds / safeGross) * 100, color: '#FF5F7A' },
  ]
}

export default function FinancialComposition({ overview }: { overview: FinanceOverview }) {
  const reducedMotion = useReducedMotion()
  const [entered, setEntered] = useState(reducedMotion)

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
      console.error('FinancialComposition: netValue inconsistente com bruto - comissão - estornos', { overview, expected })
    }
  }

  const flow = buildFlow(overview)
  const segments = buildSegments(overview)

  return (
    <div className="overview-glass-elevated motion-panel relative overflow-hidden rounded-[22px] p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Composição do valor líquido</h3>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Faturamento bruto menos comissão e estornos — leitura direta, sem precisar passar o mouse.
        </p>
      </div>

      {overview.grossRevenue <= 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-text-muted">
          Sem faturamento no período selecionado.
        </div>
      ) : (
        <>
          {/* Fluxo financeiro — 4 etapas, sequência vertical no mobile */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-stretch sm:gap-0">
            {flow.map((s, i) => (
              <div key={s.key} className="flex items-stretch sm:min-w-0 sm:flex-1">
                <div
                  className="min-w-0 flex-1 rounded-xl border border-border-subtle/60 bg-bg-primary/30 px-3 py-2.5 transition-[opacity,transform] duration-500 ease-out"
                  style={{
                    opacity: entered ? 1 : 0,
                    transform: entered ? 'translateY(0)' : 'translateY(4px)',
                    transitionDelay: `${i * 80}ms`,
                  }}
                >
                  <div className="truncate text-[9.5px] font-semibold uppercase tracking-wider text-text-muted">{s.label}</div>
                  <div
                    className="mt-1 truncate font-mono text-[15px] font-bold leading-none"
                    style={{ color: s.isDeduction ? s.color : 'var(--color-text-primary)' }}
                  >
                    {s.isDeduction ? '− ' : ''}R$ {brl(s.value)}
                  </div>
                  <div className="mt-1 truncate font-mono text-[10px] font-semibold" style={{ color: s.color }}>
                    {s.key === 'gross' ? '100%' : `${pct(s.sharePct)}% do bruto`}
                  </div>
                </div>
                {i < flow.length - 1 && (
                  <div className="hidden shrink-0 items-center px-1.5 sm:flex">
                    <ArrowRight className="h-4 w-4 text-text-muted/50" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Barra proporcional de composição */}
          <div className="mt-4">
            <div className="flex h-3 w-full overflow-hidden rounded-full bg-bg-primary/40">
              {segments.map((seg, i) => (
                <div
                  key={seg.key}
                  className="h-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${entered ? Math.max(seg.sharePct, 0) : 0}%`,
                    background: seg.color,
                    transitionDelay: `${(flow.length + i) * 80}ms`,
                  }}
                />
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
              {segments.map((seg) => (
                <div key={seg.key} className="flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: seg.color }} />
                  <span className="text-text-secondary">{seg.label}</span>
                  <span className="font-mono font-semibold text-text-primary">R$ {brl(seg.value)}</span>
                  <span className="font-mono text-text-muted">{pct(seg.sharePct)}%</span>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 text-center text-[10.5px] text-text-muted">
            Valor líquido <span className="font-semibold text-accent-emerald">estimado</span> — não representa lucro.
          </p>
        </>
      )}
    </div>
  )
}
