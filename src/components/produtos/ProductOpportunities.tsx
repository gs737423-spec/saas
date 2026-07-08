import { TrendingUp, Tag, Share2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { productOpportunities, getMarketplaceColor } from '@/data/mockData'

const typeConfig = {
  scale_investment: { icon: TrendingUp, color: '#22D3EE' },
  price_adjust: { icon: Tag, color: '#F5A524' },
  expand_channel: { icon: Share2, color: '#9061F9' },
}

export default function ProductOpportunities() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Oportunidades por Produto</h3>
        <p className="mt-0.5 text-xs text-text-muted">Produtos para investir mais ou ajustar preço</p>
      </div>

      <div className="space-y-2.5">
        {productOpportunities.map((o) => {
          const cfg = typeConfig[o.type]
          const Icon = cfg.icon
          const mp = getMarketplaceColor(o.marketplace)
          return (
            <div
              key={o.id}
              className="group flex items-start gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5 transition-colors hover:border-border-default"
            >
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${cfg.color}14`, boxShadow: `inset 0 0 0 1px ${cfg.color}33` }}
              >
                <Icon className="h-4 w-4" style={{ color: cfg.color }} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <Link to={`/produto/${o.sku}`} className="truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">{o.product}</Link>
                  <span
                    className="shrink-0 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold"
                    style={{ background: `${cfg.color}14`, color: cfg.color }}
                  >
                    {o.potential}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-secondary">{o.detail}</p>
                <div className="mt-1.5 flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="whitespace-nowrap font-mono text-[10px] text-text-muted">{o.sku}</span>
                    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                      {o.marketplace}
                    </span>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium" style={{ color: cfg.color }}>
                    {o.action}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
