import { Sparkles } from 'lucide-react'
import { marketplaceOpportunities, getMarketplaceColor } from '@/data/mockData'

export default function OpportunitiesByMarketplace() {
  return (
    <div className="overview-glass rounded-2xl p-3.5 sm:p-4">
      <div className="mb-2.5">
        <h3 className="text-sm font-semibold tracking-tight text-text-primary">Oportunidades por Marketplace</h3>
        <p className="mt-0.5 text-[11px] text-text-muted">Pontos de melhoria identificados por canal</p>
      </div>
      <div className="space-y-1.5">
        {marketplaceOpportunities.map((o) => {
          const mp = getMarketplaceColor(o.marketplace)
          return (
            <div key={o.id} className="group flex items-center gap-2.5 rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-3 py-2 transition-colors hover:border-border-default">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent-cyan/10 text-accent-cyan">
                <Sparkles className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: mp }} />
                  <span className="truncate text-[12px] font-medium text-text-primary">{o.title}</span>
                </div>
                <p className="mt-0.5 truncate text-[11px] text-text-muted">{o.detail}</p>
              </div>
              <span className="shrink-0 rounded-md bg-accent-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-emerald">{o.potential}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
