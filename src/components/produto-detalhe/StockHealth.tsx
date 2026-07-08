import { Boxes, AlertTriangle, PackagePlus } from 'lucide-react'
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
  const riskColor = ruptureRisk === 'Alto' ? 'text-accent-rose bg-accent-rose/10' : ruptureRisk === 'Médio' ? 'text-accent-amber bg-accent-amber/10' : 'text-accent-emerald bg-accent-emerald/10'
  const recommended = ruptureRisk !== 'Baixo' ? Math.max(50, Math.round(stock.stock * 1.5)) : 0

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Boxes className="h-4 w-4 text-accent-blue" />
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Saúde do Estoque</h3>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Estoque Atual</p>
          <p className="mt-1 font-mono text-lg font-bold text-text-primary">{stock.stock}</p>
        </div>
        <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Estoque Mínimo</p>
          <p className="mt-1 font-mono text-lg font-bold text-text-primary">{minStock}</p>
        </div>
        <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Cobertura</p>
          <p className="mt-1 font-mono text-lg font-bold text-text-primary">{stock.coverageDays}d</p>
        </div>
        <div className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
          <p className="text-[10px] uppercase tracking-wider text-text-muted">Risco de Ruptura</p>
          <span className={`mt-1 inline-block rounded-md px-1.5 py-0.5 text-[12px] font-bold ${riskColor}`}>{ruptureRisk}</span>
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
