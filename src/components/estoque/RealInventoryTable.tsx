import { getMarketplaceColor } from '@/data/mockData'
import type { AbcClass, DashboardInventoryItem } from '@/server/integrations/types'

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

const ABC_STYLE: Record<AbcClass, { bg: string; text: string }> = {
  A: { bg: 'bg-accent-emerald/10', text: 'text-accent-emerald' },
  B: { bg: 'bg-accent-amber/10', text: 'text-accent-amber' },
  C: { bg: 'bg-accent-rose/10', text: 'text-accent-rose' },
}

function AbcBadge({ abcClass }: { abcClass: AbcClass | null }) {
  if (!abcClass) return <span className="text-[11px] text-text-muted">—</span>
  const style = ABC_STYLE[abcClass]
  return <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ${style.bg} ${style.text}`}>{abcClass}</span>
}

function formatTurnover(rate: number | null): string {
  if (rate === null) return '—'
  return `${rate.toFixed(1)}x`
}

export default function RealInventoryTable({ items }: { items: DashboardInventoryItem[] }) {
  const totalUnits = items.reduce((sum, i) => sum + (i.availableQuantity ?? 0), 0)
  const totalValue = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.availableQuantity ?? 0), 0)

  return (
    <div className="overview-glass-elevated flex flex-col rounded-2xl p-4 sm:p-5">
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Estoque por Produto</h3>
          <p className="mt-0.5 text-xs text-text-muted">{items.length} produtos sincronizados</p>
        </div>
        <div className="flex gap-4 text-right">
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">{totalUnits.toLocaleString('pt-BR')}</p>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">unidades em estoque</p>
          </div>
          <div>
            <p className="text-lg font-bold tabular-nums text-text-primary">R$ {totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
            <p className="text-[10px] uppercase tracking-wide text-text-muted">valor em estoque</p>
          </div>
        </div>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {items.map((item) => {
          const mp = getMarketplaceColor(item.marketplace)
          return (
          <div key={`${item.marketplace}-${item.sku ?? item.title}`} className="overview-glass rounded-xl p-3.5">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-medium text-text-primary">{item.title}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="font-mono text-[10px] text-text-muted">{item.sku ?? '—'}</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-[10px] font-medium" style={{ color: mp }}>{item.marketplace}</span>
                </div>
              </div>
              <span className="shrink-0 rounded-md bg-bg-card px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">{item.status ?? '—'}</span>
            </div>
            <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border-subtle/50 pt-2.5 text-[11px]">
              <div><p className="text-text-muted">Estoque</p><p className="mt-0.5 font-mono text-text-primary">{item.availableQuantity}</p></div>
              <div><p className="text-text-muted">Preço</p><p className="mt-0.5 font-mono text-text-secondary">{item.price != null ? `R$ ${item.price.toLocaleString('pt-BR')}` : '—'}</p></div>
              <div><p className="text-text-muted">Sync</p><p className="mt-0.5 font-mono text-text-secondary">{relativeTime(item.lastSyncAt)}</p></div>
              <div><p className="text-text-muted">Giro 30d</p><p className="mt-0.5 font-mono text-text-secondary">{formatTurnover(item.turnoverRate)}</p></div>
              <div><p className="text-text-muted">Curva ABC</p><div className="mt-0.5"><AbcBadge abcClass={item.abcClass} /></div></div>
            </div>
          </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-3 pl-2 font-semibold">SKU</th>
              <th className="pb-3 pr-3 font-semibold">Título</th>
              <th className="pb-3 pr-3 font-semibold">Marketplace</th>
              <th className="pb-3 pr-3 text-right font-semibold">Estoque</th>
              <th className="pb-3 pr-3 text-right font-semibold">Preço</th>
              <th className="pb-3 pr-3 text-right font-semibold">Vendas 30d</th>
              <th className="pb-3 pr-3 text-right font-semibold">Giro 30d</th>
              <th className="pb-3 pr-3 text-center font-semibold">Curva ABC</th>
              <th className="pb-3 pr-3 text-center font-semibold">Status</th>
              <th className="pb-3 pr-2 text-right font-semibold">Última sync</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => {
              const mp = getMarketplaceColor(item.marketplace)
              return (
              <tr key={`${item.marketplace}-${item.sku ?? item.title}`} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                <td className="py-3 pr-3 pl-2 font-mono text-[11px] text-text-muted">{item.sku ?? '—'}</td>
                <td className="py-3 pr-3 font-medium text-text-primary">{item.title}</td>
                <td className="py-3 pr-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                    {item.marketplace}
                  </span>
                </td>
                <td className="py-3 pr-3 text-right font-mono text-text-secondary">{item.availableQuantity}</td>
                <td className="py-3 pr-3 text-right font-mono text-text-secondary">{item.price != null ? `R$ ${item.price.toLocaleString('pt-BR')}` : '—'}</td>
                <td className="py-3 pr-3 text-right font-mono text-text-secondary">{item.soldQuantity ?? '—'}</td>
                <td className="py-3 pr-3 text-right font-mono text-text-secondary">{formatTurnover(item.turnoverRate)}</td>
                <td className="py-3 pr-3 text-center"><AbcBadge abcClass={item.abcClass} /></td>
                <td className="py-3 pr-3 text-center">
                  <span className="rounded-md bg-bg-card px-2 py-0.5 text-[11px] font-medium text-text-secondary">{item.status ?? '—'}</span>
                </td>
                <td className="py-3 pr-2 text-right font-mono text-[11px] text-text-muted">{relativeTime(item.lastSyncAt)}</td>
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
