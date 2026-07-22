import { getMarketplaceColor } from '@/data/mockData'
import type { DashboardInventoryItem } from '@/server/integrations/types'

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

export default function RealInventoryTable({ items }: { items: DashboardInventoryItem[] }) {
  const mp = getMarketplaceColor('Mercado Livre')

  return (
    <div className="overview-glass-elevated flex flex-col rounded-2xl p-4 sm:p-5">
      <div className="mb-3.5">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Estoque por Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">{items.length} produtos sincronizados do Mercado Livre</p>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {items.map((item) => (
          <div key={item.sku ?? item.title} className="overview-glass rounded-xl p-3.5">
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
            </div>
          </div>
        ))}
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
              <th className="pb-3 pr-3 text-center font-semibold">Status</th>
              <th className="pb-3 pr-2 text-right font-semibold">Última sync</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.sku ?? item.title} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
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
                <td className="py-3 pr-3 text-center">
                  <span className="rounded-md bg-bg-card px-2 py-0.5 text-[11px] font-medium text-text-secondary">{item.status ?? '—'}</span>
                </td>
                <td className="py-3 pr-2 text-right font-mono text-[11px] text-text-muted">{relativeTime(item.lastSyncAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
