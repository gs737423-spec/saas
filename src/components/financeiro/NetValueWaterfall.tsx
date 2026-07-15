import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from 'recharts'
import type { FinanceOverview } from '@/data/financeData'
import { motionTokens, useReducedMotion } from '@/lib/motion'

const CHART_ENTER_MS = motionTokens.duration.slow + 150

const brl = (v: number) => Math.round(v).toLocaleString('pt-BR')

interface Step {
  label: string
  base: number
  delta: number
  value: number
  kind: 'start' | 'decrease' | 'end'
  color: string
}

function buildSteps(overview: FinanceOverview): Step[] {
  const { grossRevenue, fees, refunds, netValue } = overview
  let running = grossRevenue
  const steps: Step[] = [
    { label: 'Faturamento bruto', base: 0, delta: grossRevenue, value: grossRevenue, kind: 'start', color: '#22D3EE' },
  ]
  running -= fees
  steps.push({ label: 'Taxas e comissões', base: running, delta: fees, value: running, kind: 'decrease', color: '#F5C24B' })
  running -= refunds
  steps.push({ label: 'Estornos e devoluções', base: running, delta: refunds, value: running, kind: 'decrease', color: '#F4436C' })
  steps.push({ label: 'Valor líquido estimado', base: 0, delta: netValue, value: netValue, kind: 'end', color: '#16C784' })
  return steps
}

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const step: Step = payload[0]?.payload
  if (!step) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1225]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{step.label}</p>
      <p className="font-mono text-sm font-semibold text-text-primary">
        {step.kind === 'decrease' ? '− ' : ''}R$ {brl(step.kind === 'decrease' ? step.delta : step.value)}
      </p>
    </div>
  )
}

export default function NetValueWaterfall({ overview }: { overview: FinanceOverview }) {
  const reducedMotion = useReducedMotion()
  const chartDuration = reducedMotion ? 0 : CHART_ENTER_MS
  const steps = buildSteps(overview)

  return (
    <div className="overview-glass-elevated motion-panel relative overflow-hidden rounded-[22px] p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Composição do valor líquido</h3>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Do faturamento bruto até o valor líquido estimado, passando pelos descontos dos canais de venda.
        </p>
      </div>

      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={steps} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6B7A9E', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#6B7A9E', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
            {/* Base invisível — empurra a barra visível até a altura correta da cascata. */}
            <Bar dataKey="base" stackId="waterfall" fill="transparent" isAnimationActive={false} />
            <Bar dataKey="delta" stackId="waterfall" radius={[6, 6, 6, 6]} animationDuration={chartDuration} animationEasing="ease-out">
              {steps.map((s, i) => (
                <Cell key={i} fill={s.color} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
