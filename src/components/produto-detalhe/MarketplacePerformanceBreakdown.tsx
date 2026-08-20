import { getMarketplaceColor } from '@/data/mockData'
import type { DashboardProduct } from '@/server/dashboardProducts'

// Recebe as linhas reais do produto por marketplace (matches) — 1 por
// anúncio/conexão, nunca dado fabricado.
export default function MarketplacePerformanceBreakdown({ matches }: { matches: DashboardProduct[] }) {
  const sorted = [...matches].sort((a, b) => b.revenue - a.revenue)
  const totalRevenue = sorted.reduce((s, p) => s + p.revenue, 0) || 1
  const main = sorted[0]

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Desempenho por Marketplace</h3>
          <p className="mt-0.5 text-xs text-text-muted">Receita, pedidos, margem e ticket médio deste produto por canal</p>
        </div>
        {main && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card/60 px-2.5 py-1 text-[11px] font-medium text-text-secondary">
            Canal principal: {main.marketplace}
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[440px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-2.5 pr-4 font-semibold">Marketplace</th>
              <th className="pb-2.5 pr-4 font-semibold">Participação</th>
              <th className="pb-2.5 pr-4 text-right font-semibold">Receita</th>
              <th className="pb-2.5 pr-4 text-right font-semibold">Pedidos</th>
              <th className="pb-2.5 pr-4 text-right font-semibold">Margem</th>
              <th className="pb-2.5 text-right font-semibold">Ticket Médio</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => {
              const color = getMarketplaceColor(p.marketplace)
              const share = (p.revenue / totalRevenue) * 100
              const avgTicket = p.units > 0 ? p.revenue / p.units : 0
              return (
                <tr key={p.id} className="border-b border-border-subtle/50 last:border-b-0">
                  <td className="py-2.5 pr-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[13px] font-medium" style={{ color }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: color }} />
                      {p.marketplace}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-border-subtle">
                        <div className="h-full rounded-full" style={{ width: `${share}%`, background: color }} />
                      </div>
                      <span className="font-mono text-[11px] text-text-muted">{share.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right font-mono font-medium text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-text-secondary">{p.units.toLocaleString('pt-BR')}</td>
                  <td className="py-2.5 pr-4 text-right font-mono text-text-secondary">{p.margin !== null ? `${p.margin.toFixed(0)}%` : '—'}</td>
                  <td className="py-2.5 text-right font-mono text-text-secondary">R$ {avgTicket.toFixed(2)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
