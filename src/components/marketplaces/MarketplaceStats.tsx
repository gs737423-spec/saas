import { TrendingUp, TrendingDown } from 'lucide-react'
import { marketplaceMetrics, getMarketplaceColor } from '@/data/mockData'

const statusStyle: Record<string, string> = {
  'Saudável': 'text-accent-emerald bg-accent-emerald/10',
  'Atenção': 'text-accent-amber bg-accent-amber/10',
  'Crítico': 'text-accent-rose bg-accent-rose/10',
}

export default function MarketplaceStats() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Comparativo por Marketplace</h3>
        <p className="mt-0.5 text-xs text-text-muted">Faturamento, pedidos, ticket médio, margem e participação por canal</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {marketplaceMetrics.map((m) => {
          const color = getMarketplaceColor(m.marketplace)
          const positive = m.trend >= 0
          return (
            <div key={m.marketplace} className="group relative overflow-hidden rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div
                className="pointer-events-none absolute -right-10 -top-12 h-28 w-28 rounded-full opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
                style={{ background: `radial-gradient(circle, ${color}35, transparent 68%)` }}
              />
              <div className="relative mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  {m.marketplace}
                </span>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${statusStyle[m.status]}`}>{m.status}</span>
              </div>

              <div className="relative mb-2 text-lg font-bold tracking-tight text-text-primary">
                R$ {m.revenue.toLocaleString('pt-BR')}
              </div>

              <div className="relative mb-3 flex items-center gap-2">
                <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{m.trend}%
                </span>
                <span className="text-[11px] text-text-muted">{m.sharePct}% do total</span>
              </div>

              <div className="relative grid grid-cols-4 gap-2 border-t border-border-subtle/50 pt-3 text-[11px]">
                <div>
                  <p className="text-text-muted">Pedidos</p>
                  <p className="mt-0.5 font-mono text-text-secondary">{m.orders}</p>
                </div>
                <div>
                  <p className="text-text-muted">Ticket Médio</p>
                  <p className="mt-0.5 font-mono text-text-secondary">R$ {m.avgTicket.toFixed(0)}</p>
                </div>
                <div>
                  <p className="text-text-muted">Margem</p>
                  <p className="mt-0.5 font-mono text-text-secondary">{m.margin}%</p>
                </div>
                <div>
                  <p className="text-text-muted">Conv.</p>
                  <p className="mt-0.5 font-mono text-text-secondary">{m.conversionPct}%</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
