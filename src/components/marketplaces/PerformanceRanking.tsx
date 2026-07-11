import { TrendingUp, TrendingDown } from 'lucide-react'
import { marketplaceMetrics, getMarketplaceColor } from '@/data/mockData'

const ranked = [...marketplaceMetrics].sort((a, b) => b.revenue - a.revenue)
const maxRevenue = ranked[0].revenue

export default function PerformanceRanking() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Ranking de Desempenho</h3>
        <p className="mt-0.5 text-xs text-text-muted">Participação de receita por marketplace</p>
      </div>
      <div className="space-y-3.5">
        {ranked.map((m, i) => {
          const color = getMarketplaceColor(m.marketplace)
          const positive = m.trend >= 0
          return (
            <div key={m.marketplace} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-text-primary">{m.marketplace}</span>
                  <span className="shrink-0 font-mono text-[13px] font-semibold text-text-primary">R$ {m.revenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                    <div className="h-full rounded-full" style={{ width: `${(m.revenue / maxRevenue) * 100}%`, background: `linear-gradient(90deg, ${color}88, ${color})` }} />
                  </div>
                  <span className={`flex shrink-0 items-center gap-0.5 font-mono text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {positive ? '+' : ''}{m.trend}%
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
