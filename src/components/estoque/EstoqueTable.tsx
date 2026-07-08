import { stockItems, getMarketplaceColor, type StockItem } from '@/data/mockData'

const statusConfig: Record<StockItem['status'], { label: string; color: string; bg: string }> = {
  ok: { label: 'Saudável', color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
  low: { label: 'Baixo', color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  critical: { label: 'Crítico', color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
  stalled: { label: 'Parado', color: 'text-accent-violet', bg: 'bg-accent-violet/10' },
}

export default function EstoqueTable() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Estoque por Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">{stockItems.length} produtos · estoque, cobertura e giro</p>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {stockItems.map((s) => {
          const cfg = statusConfig[s.status]
          const mp = getMarketplaceColor(s.marketplace)
          return (
            <div key={s.id} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-text-primary">{s.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-text-muted">{s.sku}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[10px] font-medium" style={{ color: mp }}>{s.marketplace}</span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border-subtle/50 pt-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Estoque</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-primary">{s.stock}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Cobertura</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">{s.coverageDays}d</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Giro</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">{s.turnover}x</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-4 font-semibold">SKU</th>
              <th className="pb-3 pr-4 font-semibold">Produto</th>
              <th className="pb-3 pr-4 font-semibold">Marketplace</th>
              <th className="pb-3 pr-4 text-right font-semibold">Estoque</th>
              <th className="pb-3 pr-4 text-right font-semibold">Cobertura</th>
              <th className="pb-3 pr-4 text-right font-semibold">Giro</th>
              <th className="pb-3 text-right font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {stockItems.map((s) => {
              const cfg = statusConfig[s.status]
              const mp = getMarketplaceColor(s.marketplace)
              return (
                <tr key={s.id} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-4 font-mono text-[11px] text-text-muted">{s.sku}</td>
                  <td className="py-3 pr-4 font-medium text-text-primary">{s.name}</td>
                  <td className="py-3 pr-4">
                    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                      {s.marketplace}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{s.stock}</td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{s.coverageDays}d</td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{s.turnover}x</td>
                  <td className="py-3 text-right">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
