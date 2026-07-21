import { TrendingUp, TrendingDown } from 'lucide-react'
import { categoryPerformance } from '@/data/mockData'

const maxRevenue = Math.max(...categoryPerformance.map((c) => c.revenue))
const palette = ['#3568F5', '#73C6FA', '#16C784', '#9061F9', '#F5A524', '#F9603C']

export default function CategoryPerformance() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Desempenho por Categoria</h3>
        <p className="mt-0.5 text-xs text-text-muted">Faturamento e participação por categoria</p>
      </div>

      <div className="space-y-3.5">
        {categoryPerformance.map((c, i) => {
          const positive = c.trend >= 0
          const color = palette[i % palette.length]
          return (
            <div key={c.category}>
              <div className="mb-1.5 flex items-center justify-between gap-2 text-[13px]">
                <span className="flex items-center gap-2 font-medium text-text-primary">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
                  {c.category}
                </span>
                <span className="flex items-center gap-2">
                  <span className="font-mono text-text-secondary">R$ {c.revenue.toLocaleString('pt-BR')}</span>
                  <span className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {positive ? '+' : ''}{c.trend}%
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-border-subtle">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(c.revenue / maxRevenue) * 100}%`, background: color }} />
                </div>
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-text-muted">{c.sharePct}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
