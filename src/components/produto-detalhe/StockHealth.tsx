import { Boxes, AlertTriangle, PackagePlus, Gauge } from 'lucide-react'
import type { StockItem } from '@/data/mockData'

export default function StockHealth({ stock }: { stock: StockItem | undefined }) {
  if (!stock) {
    return (
      <div className="glass-panel rounded-2xl p-4 sm:p-5">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Saúde do Estoque</h3>
        <p className="mt-2 text-[13px] text-text-muted">Sem dados de estoque para este produto.</p>
      </div>
    )
  }

  const minStock = Math.round(stock.stock / (stock.coverageDays / 7 || 1))
  const ruptureRisk = stock.coverageDays <= 7 ? 'Alto' : stock.coverageDays <= 20 ? 'Médio' : 'Baixo'
  const riskColor = ruptureRisk === 'Alto' ? '#FF5F7A' : ruptureRisk === 'Médio' ? '#FFC857' : '#2BD6A0'
  const recommended = ruptureRisk !== 'Baixo' ? Math.max(50, Math.round(stock.stock * 1.5)) : 0
  const coveragePct = Math.min(100, Math.round((stock.coverageDays / 60) * 100))

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-4 w-4 text-accent-blue" />
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Saúde do Estoque</h3>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        {/* Coverage gauge */}
        <div className="flex shrink-0 items-center justify-center">
          <div className="relative flex h-28 w-28 items-center justify-center">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="42" fill="none" stroke="var(--color-border-subtle, #2a3548)" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="42" fill="none" stroke={riskColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={`${coveragePct * 2.64} 264`}
                style={{ transition: 'stroke-dasharray 0.6s ease', filter: `drop-shadow(0 0 6px ${riskColor}88)` }}
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="font-mono text-xl font-bold text-text-primary">{stock.coverageDays}d</span>
              <span className="text-[10px] text-text-muted">cobertura</span>
            </div>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid flex-1 grid-cols-2 gap-3">
          <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Estoque Atual</p>
            <p className="mt-1 font-mono text-lg font-bold text-text-primary">{stock.stock}</p>
          </div>
          <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Estoque Mínimo</p>
            <p className="mt-1 font-mono text-lg font-bold text-text-primary">{minStock}</p>
          </div>
          <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Giro</p>
            <p className="mt-1 flex items-center gap-1 font-mono text-lg font-bold text-text-primary">
              <Gauge className="h-4 w-4 text-accent-cyan" />
              {stock.turnover}x
            </p>
          </div>
          <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted">Risco de Ruptura</p>
            <span className="mt-1 inline-block rounded-md px-1.5 py-0.5 text-[12px] font-bold" style={{ color: riskColor, background: `${riskColor}1a` }}>{ruptureRisk}</span>
          </div>
        </div>
      </div>

      {recommended > 0 && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-accent-blue/20 bg-accent-blue/10 p-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary text-accent-blue">
            <PackagePlus className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1 text-[12.5px] text-text-secondary">
            Reposição recomendada: <span className="font-mono font-semibold text-accent-blue">+{recommended} un.</span>
          </div>
        </div>
      )}
      {ruptureRisk === 'Alto' && (
        <div className="mt-2 flex items-center gap-2 text-[11px] text-accent-rose">
          <AlertTriangle className="h-3.5 w-3.5" />
          Ruptura estimada em {stock.coverageDays} dias no ritmo atual de vendas
        </div>
      )}
    </div>
  )
}
