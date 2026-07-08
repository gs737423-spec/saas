import { TrendingUp, TrendingDown, Wifi } from 'lucide-react'
import { marketplaceMetrics, marketplaceConnections, getMarketplaceColor } from '@/data/mockData'

export default function MarketplaceStats() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {marketplaceMetrics.map((m) => {
        const color = getMarketplaceColor(m.marketplace)
        const positive = m.trend >= 0
        const conn = marketplaceConnections.find((c) => c.name === m.marketplace)
        return (
          <div key={m.marketplace} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${color}40, transparent 68%)` }}
            />
            <div className="relative mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                {m.marketplace}
              </span>
              {conn?.connected && (
                <span className="flex items-center gap-1 rounded-md bg-accent-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-emerald">
                  <Wifi className="h-3 w-3" />
                  Conectado
                </span>
              )}
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

            <div className="relative grid grid-cols-3 gap-2 border-t border-border-subtle/50 pt-3 text-[11px]">
              <div>
                <p className="text-text-muted">Pedidos</p>
                <p className="mt-0.5 font-mono text-text-secondary">{m.orders}</p>
              </div>
              <div>
                <p className="text-text-muted">Ticket</p>
                <p className="mt-0.5 font-mono text-text-secondary">R$ {m.avgTicket.toFixed(0)}</p>
              </div>
              <div>
                <p className="text-text-muted">Conversão</p>
                <p className="mt-0.5 font-mono text-text-secondary">{m.conversionPct}%</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
