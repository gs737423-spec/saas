import { Sparkles } from 'lucide-react'
import { marketplaceOpportunities, getMarketplaceColor } from '@/data/mockData'

export default function OpportunitiesByMarketplace() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Oportunidades por Marketplace</h3>
        <p className="mt-0.5 text-xs text-text-muted">Pontos de melhoria identificados por canal</p>
      </div>
      <div className="space-y-2.5">
        {marketplaceOpportunities.map((o) => {
          const mp = getMarketplaceColor(o.marketplace)
          return (
            <div key={o.id} className="group flex items-start gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5 transition-colors hover:border-border-default">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-cyan/10 text-accent-cyan">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <span className="truncate text-[13px] font-medium text-text-primary">{o.title}</span>
                  <span className="shrink-0 rounded-md bg-accent-emerald/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent-emerald">{o.potential}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-secondary">{o.detail}</p>
                <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${mp}15`, color: mp }}>{o.marketplace}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
