import { TrendingUp, TrendingDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { products, getMarketplaceColor } from '@/data/mockData'

const top5 = [...products].sort((a, b) => b.revenue - a.revenue).slice(0, 5)
const maxRevenue = top5[0].revenue

export default function Top5Products() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Top 5 Produtos</h3>
        <p className="mt-0.5 text-xs text-text-muted">Maiores faturamentos do período</p>
      </div>

      <div className="space-y-3">
        {top5.map((p, i) => {
          const positive = p.trend >= 0
          const mp = getMarketplaceColor(p.marketplace)
          return (
            <div key={p.id} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center font-mono text-xs font-bold text-text-muted">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <Link to={`/produto/${p.sku}`} className="truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">{p.name}</Link>
                  <span className="shrink-0 font-mono text-[13px] font-semibold text-text-primary">
                    R$ {p.revenue.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${(p.revenue / maxRevenue) * 100}%`, background: `linear-gradient(90deg, ${mp}88, ${mp})` }}
                    />
                  </div>
                  <span className={`flex shrink-0 items-center gap-0.5 font-mono text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                    {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {positive ? '+' : ''}{p.trend}%
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
