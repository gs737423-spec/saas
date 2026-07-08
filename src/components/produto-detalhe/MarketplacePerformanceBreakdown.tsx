import { getMarketplaceColor, type Product, getProductMarketplaceBreakdown } from '@/data/mockData'

export default function MarketplacePerformanceBreakdown({ product }: { product: Product }) {
  const breakdown = getProductMarketplaceBreakdown(product)

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Desempenho por Marketplace</h3>
        <p className="mt-0.5 text-xs text-text-muted">Receita, pedidos, margem e ticket médio deste produto por canal</p>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {breakdown.map((b) => {
          const mp = getMarketplaceColor(b.marketplace)
          return (
            <div key={b.marketplace} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-[13px] font-medium text-text-primary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: mp }} />
                  {b.marketplace}
                </span>
                <span className="font-mono text-[13px] font-semibold text-text-primary">R$ {b.revenue.toLocaleString('pt-BR')}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border-subtle/50 pt-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Pedidos</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">{b.orders}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Margem</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">{b.margin}%</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Ticket</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">R$ {b.avgTicket.toFixed(0)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[520px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-4 font-semibold">Marketplace</th>
              <th className="pb-3 pr-4 text-right font-semibold">Receita</th>
              <th className="pb-3 pr-4 text-right font-semibold">Pedidos</th>
              <th className="pb-3 pr-4 text-right font-semibold">Margem</th>
              <th className="pb-3 text-right font-semibold">Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((b) => {
              const mp = getMarketplaceColor(b.marketplace)
              return (
                <tr key={b.marketplace} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                      {b.marketplace}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono font-medium text-text-primary">R$ {b.revenue.toLocaleString('pt-BR')}</td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{b.orders}</td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{b.margin}%</td>
                  <td className="py-3 text-right font-mono text-text-secondary">R$ {b.avgTicket.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
