import { Gauge } from 'lucide-react'
import type { ProductHealthScore, StockItem } from '@/data/mockData'

const statusColor: Record<string, string> = {
  'Saudável': '#16C784',
  'Atenção': '#F5C24B',
  'Crítico': '#F4436C',
  'Parado': '#9061F9',
}

interface Props {
  health: ProductHealthScore
  stock: StockItem | undefined
}

export default function ProdutoHealthScore({ health, stock }: Props) {
  const color = statusColor[health.status] ?? '#4C82F7'
  const ruptureRisk = stock ? (stock.coverageDays <= 7 ? 'Alto' : stock.coverageDays <= 20 ? 'Médio' : 'Baixo') : null
  const riskColor = ruptureRisk === 'Alto' ? '#F4436C' : ruptureRisk === 'Médio' ? '#F5C24B' : '#16C784'

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-3">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Saúde do Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">Score consolidado · vendas, margem, estoque, marketing e reputação</p>
      </div>

      <div className="flex flex-col items-center gap-4">
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative flex h-24 w-24 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
                strokeDasharray={`${health.score * 2.64} 264`}
                style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 8px ${color}99)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-2xl font-bold text-text-primary">{health.score}</span>
              <span className="text-[9px] font-semibold uppercase tracking-wider" style={{ color }}>{health.status}</span>
            </div>
          </div>
        </div>

        <div className="w-full flex-1 space-y-2 border-t border-border-subtle pt-3">
          {health.breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[11px] text-text-secondary">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.score}%`, background: b.color, boxShadow: `0 0 8px -2px ${b.color}aa` }} />
              </div>
              <span className="w-7 shrink-0 text-right font-mono text-[11px] text-text-muted">{b.score}</span>
            </div>
          ))}
        </div>

        {stock && ruptureRisk && (
          <div className="grid w-full grid-cols-2 gap-2 border-t border-border-subtle pt-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
              <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Cobertura</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-text-primary">{stock.coverageDays}d</p>
            </div>
            <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
              <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Giro</p>
              <p className="mt-0.5 flex items-center gap-1 font-mono text-sm font-bold text-text-primary">
                <Gauge className="h-3 w-3 text-accent-cyan" />
                {stock.turnover}x
              </p>
            </div>
            <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
              <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Estoque</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-text-primary">{stock.stock}</p>
            </div>
            <div className="rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-2.5 py-2">
              <p className="text-[9.5px] uppercase tracking-wider text-text-muted">Risco</p>
              <span className="mt-0.5 inline-block rounded px-1 py-0.5 font-mono text-[11px] font-bold" style={{ color: riskColor, background: `${riskColor}1a` }}>
                {ruptureRisk}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
