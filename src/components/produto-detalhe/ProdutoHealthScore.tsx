import { Gauge } from 'lucide-react'

type ProductStatus = 'Saudável' | 'Atenção' | 'Crítico' | 'Parado'

const statusColor: Record<ProductStatus, string> = {
  'Saudável': '#3BE38E',
  'Atenção': '#FFC95A',
  'Crítico': '#FF5E7D',
  'Parado': '#9061F9',
}

interface Breakdown { label: string; score: number; color: string }

// Score consolidado só com o que existe de verdade hoje (vendas, margem,
// estoque) — nada de marketing/reputação, que dependeriam de dado que o
// backend não coleta ainda.
export function computeHealthBreakdown(trend: number | null, margin: number | null, coverageDays: number | null): { score: number; breakdown: Breakdown[] } {
  const vendas = Math.max(10, Math.min(100, 60 + (trend ?? 0) * 1.5))
  const margemScore = margin !== null ? Math.max(10, Math.min(100, (margin / 60) * 100)) : 50
  const estoque = coverageDays !== null ? Math.max(5, Math.min(100, (coverageDays / 45) * 100)) : 70

  const breakdown: Breakdown[] = [
    { label: 'Vendas', score: Math.round(vendas), color: '#2F6BFF' },
    { label: 'Margem', score: Math.round(margemScore), color: '#FFC95A' },
    { label: 'Estoque', score: Math.round(estoque), color: '#00E1FF' },
  ]
  const score = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length)
  return { score, breakdown }
}

interface Props {
  status: ProductStatus
  score: number
  breakdown: Breakdown[]
  coverageDays: number | null
  stock: number
}

export default function ProdutoHealthScore({ status, score, breakdown, coverageDays, stock }: Props) {
  const color = statusColor[status] ?? '#3A8DFF'
  const turnover = coverageDays !== null && coverageDays > 0 ? Math.round((30 / coverageDays) * 10) / 10 : null
  const ruptureRisk = coverageDays !== null ? (coverageDays <= 7 ? 'Alto' : coverageDays <= 20 ? 'Médio' : 'Baixo') : null
  const riskColor = ruptureRisk === 'Alto' ? '#FF5E7D' : ruptureRisk === 'Médio' ? '#FFC95A' : '#3BE38E'

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Saúde do Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">Score consolidado · vendas, margem e estoque</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${score * 2.64} 264`}
                style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 8px ${color}99)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-text-primary">{score}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>{status}</span>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2 border-t border-border-subtle pt-3">
          {breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[11px] text-text-secondary">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.score}%`, background: b.color, boxShadow: `0 0 8px -2px ${b.color}aa` }} />
              </div>
              <span className="w-7 shrink-0 text-right font-mono text-[11px] text-text-muted">{b.score}</span>
            </div>
          ))}
        </div>

        <div className="grid w-full grid-cols-2 gap-2 border-t border-border-subtle pt-3 sm:grid-cols-4">
          <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
            <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Cobertura</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-text-primary">{coverageDays !== null ? `${Math.round(coverageDays)}d` : '—'}</p>
          </div>
          <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
            <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Giro</p>
            <p className="mt-0.5 flex items-center gap-1 font-mono text-sm font-bold text-text-primary">
              <Gauge className="h-3 w-3 text-accent-cyan" />
              {turnover !== null ? `${turnover}x` : '—'}
            </p>
          </div>
          <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
            <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Estoque</p>
            <p className="mt-0.5 font-mono text-sm font-bold text-text-primary">{stock}</p>
          </div>
          <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
            <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Risco</p>
            {ruptureRisk ? (
              <span className="mt-0.5 inline-block rounded px-1 py-0.5 font-mono text-[11px] font-bold" style={{ color: riskColor, background: `${riskColor}1a` }}>
                {ruptureRisk}
              </span>
            ) : <p className="mt-0.5 font-mono text-sm font-bold text-text-primary">—</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
