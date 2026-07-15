import type { MarketplaceFinance } from '@/data/financeData'
import { getMarketplaceColor } from '@/data/mockData'

const brl = (v: number) => Math.round(v).toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function MarketplaceFinanceTable({ items }: { items: MarketplaceFinance[] }) {
  const sorted = [...items].sort((a, b) => b.netValue - a.netValue)

  return (
    <div className="glass-panel motion-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Comparativo por Marketplace</h3>
        <p className="mt-0.5 text-xs text-text-muted">{sorted.length} {sorted.length === 1 ? 'canal' : 'canais'} · faturamento, taxas, estornos e valor líquido estimado</p>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {sorted.map((m) => {
          const brand = getMarketplaceColor(m.marketplace)
          return (
            <div key={m.marketplace} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: brand }} />
                <span className="text-[13px] font-medium text-text-primary">{m.marketplace}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border-subtle/50 pt-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Bruto</p>
                  <p className="mt-0.5 font-mono text-[13px] font-semibold text-text-primary">R$ {brl(m.grossRevenue)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Taxas</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">R$ {brl(m.fees)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Estornos</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">R$ {brl(m.refunds)}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Líquido estimado</p>
                  <p className="mt-0.5 font-mono text-[13px] font-semibold text-accent-emerald">R$ {brl(m.netValue)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Eficiência líquida</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">{pct(m.netEfficiencyPct)}%</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-4 font-semibold">Marketplace</th>
              <th className="pb-3 pr-4 text-center font-semibold">Faturamento bruto</th>
              <th className="pb-3 pr-4 text-center font-semibold">Taxas e comissões</th>
              <th className="pb-3 pr-4 text-center font-semibold">Estornos e devoluções</th>
              <th className="pb-3 pr-4 text-center font-semibold">Valor líquido estimado</th>
              <th className="pb-3 text-center font-semibold">Eficiência líquida</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => {
              const brand = getMarketplaceColor(m.marketplace)
              return (
                <tr key={m.marketplace} className="motion-row border-b border-border-subtle/50 hover:border-border-default/70 hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                      <span className="font-medium text-text-primary">{m.marketplace}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-center font-mono text-text-secondary">R$ {brl(m.grossRevenue)}</td>
                  <td className="py-3 pr-4 text-center font-mono text-text-secondary">R$ {brl(m.fees)}</td>
                  <td className="py-3 pr-4 text-center font-mono text-text-secondary">R$ {brl(m.refunds)}</td>
                  <td className="py-3 pr-4 text-center font-mono font-semibold text-accent-emerald">R$ {brl(m.netValue)}</td>
                  <td className="py-3 text-center font-mono text-text-secondary">{pct(m.netEfficiencyPct)}%</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
