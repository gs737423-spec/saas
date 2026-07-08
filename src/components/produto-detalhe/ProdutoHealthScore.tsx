import type { ProductHealthScore } from '@/data/mockData'

const statusColor: Record<string, string> = {
  'Saudável': '#16C784',
  'Atenção': '#F5C24B',
  'Crítico': '#F4436C',
  'Parado': '#9061F9',
}

export default function ProdutoHealthScore({ health }: { health: ProductHealthScore }) {
  const color = statusColor[health.status] ?? '#4C82F7'

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Saúde do Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">Score consolidado com base em vendas, margem, estoque, marketing e reputação</p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative flex h-32 w-32 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${health.score * 2.64} 264`}
                style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 8px ${color}99)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-3xl font-bold text-text-primary">{health.score}</span>
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color }}>{health.status}</span>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-2.5">
          {health.breakdown.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-[11.5px] text-text-secondary">{b.label}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${b.score}%`, background: b.color, boxShadow: `0 0 8px -2px ${b.color}aa` }} />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-[11px] text-text-muted">{b.score}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
