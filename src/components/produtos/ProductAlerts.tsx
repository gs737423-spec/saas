import { PackageX, Percent, TrendingDown } from 'lucide-react'
import { productAlerts, getMarketplaceColor } from '@/data/mockData'

const typeConfig = {
  low_stock: { icon: PackageX, label: 'Estoque baixo', color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
  low_margin: { icon: Percent, label: 'Margem baixa', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  falling_sales: { icon: TrendingDown, label: 'Vendas em queda', color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20' },
}

export default function ProductAlerts() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Produtos com Alerta</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-rose/15 px-1.5 text-[10px] font-bold text-accent-rose">
          {productAlerts.length}
        </span>
      </div>

      <div className="space-y-2.5">
        {productAlerts.map((a) => {
          const cfg = typeConfig[a.type]
          const Icon = cfg.icon
          const mp = getMarketplaceColor(a.marketplace)
          return (
            <div key={a.id} className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3.5`}>
              <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-bg-secondary ${cfg.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13px] font-medium text-text-primary">{a.product}</span>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase ${cfg.color}`}>{cfg.label}</span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-secondary">{a.detail}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-muted">{a.sku}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                    {a.marketplace}
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
