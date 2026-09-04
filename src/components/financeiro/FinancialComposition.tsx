import { ArrowRight } from 'lucide-react'
import { hasKnownNetValue, type FinanceOverview } from '@/data/financeShapes'

/* Composição do valor líquido — substitui o waterfall anterior (base
 * transparente + delta em BarChart do Recharts, depois uma variante
 * posicionada por % absoluta): ambas produziam sobreposição de texto e
 * barras "flutuando" fora de contexto. Este componente é fluxo (flexbox,
 * sem coordenadas absolutas) + uma barra proporcional — layout previsível
 * em qualquer altura de conteúdo, sem eixo/grid/tooltip. */

const brl = (v: number) => Math.round(Math.abs(v)).toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

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
    { key: 'net', label: 'Líquido estimado', value: netValue, sharePct: (netValue / safeGross) * 100, color: 'var(--color-success)' },
    { key: 'fees', label: 'Tarifas', value: fees, sharePct: (fees / safeGross) * 100, color: 'var(--color-warning)' },
    { key: 'refunds', label: 'Estornos', value: refunds, sharePct: (refunds / safeGross) * 100, color: 'var(--color-danger)' },
  ]
}

export default function FinancialComposition({ overview }: { overview: FinanceOverview }) {
  const netAvailable = hasKnownNetValue(overview)

  if (import.meta.env.DEV && netAvailable) {
    const expected = overview.grossRevenue - overview.fees - overview.refunds
    if (Math.round(expected) !== Math.round(overview.netValue)) {
      // eslint-disable-next-line no-console
      console.error('FinancialComposition: netValue inconsistente com bruto - comissão - estornos', { overview, expected })
    }
  }

  const segments = buildSegments(overview)
  const deductions = overview.fees + overview.refunds

  return (
    <div className="overview-glass-elevated motion-panel enterprise-section relative overflow-hidden rounded-2xl">
      <div className="mb-2.5 flex flex-wrap items-end justify-between gap-2">
        <div>
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Composição do valor líquido</h3>
          <p className="mt-0.5 text-[12px] text-text-secondary">Bruto menos tarifas e estornos, sem duplicação de cards.</p>
        </div>
        <p className="text-[10.5px] text-text-muted">Estimativa operacional · não representa lucro.</p>
      </div>

      {overview.grossRevenue <= 0 ? (
        <div className="flex h-24 items-center justify-center text-sm text-text-muted">
          Sem faturamento no período selecionado.
        </div>
      ) : !netAvailable ? (
        <div className="rounded-lg border border-accent-amber/20 bg-accent-amber/5 px-4 py-4">
          <p className="text-sm font-medium text-text-primary">Composição indisponível</p>
          <p className="mt-1 text-xs leading-relaxed text-text-muted">
            {overview.refundDataStatus !== 'known'
              ? 'A integração ainda não fornece eventos confirmados de reembolso. Cancelamentos não são tratados como estornos, e o valor líquido permanece indisponível.'
              : overview.feeDataStatus === 'partial'
                ? 'A integração informou taxas apenas para parte dos pedidos. O valor líquido não é exibido para evitar uma estimativa incompleta.'
                : 'A integração não informou as taxas dos pedidos. O valor líquido não é exibido como se as taxas fossem zero.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5">
            <FlowValue label="Bruto" value={overview.grossRevenue} />
            <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <FlowValue label="Tarifas + estornos" value={deductions} deduction />
            <ArrowRight className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <FlowValue label="Líquido estimado" value={overview.netValue} />
          </div>

          <div className="mt-3">
            <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-bg-primary/40">
              {segments.map((seg) => (
                <div
                  key={seg.key}
                  className="h-full"
                  style={{
                    width: `${Math.max(seg.sharePct, 0)}%`,
                    background: seg.color,
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

        </>
      )}
    </div>
  )
}

function FlowValue({ label, value, deduction = false }: { label: string; value: number; deduction?: boolean }) {
  return (
    <div className="min-w-0 text-center">
      <p className="truncate text-[9.5px] font-semibold uppercase tracking-wider text-text-muted">{label}</p>
      <p className={`mt-1 truncate font-mono text-[15px] font-bold ${deduction ? 'text-accent-rose' : 'text-text-primary'}`}>
        {deduction ? '− ' : ''}R$ {brl(value)}
      </p>
    </div>
  )
}
