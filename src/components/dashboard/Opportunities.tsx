import { ArrowRight, TrendingUp, AlertTriangle, DollarSign, Users } from 'lucide-react'
import { opportunities, getMarketplaceColor } from '@/data/mockData'

const typeConfig = {
  price_gap: { icon: DollarSign, label: 'Gap de Preço', accent: 'text-accent-amber' },
  trending: { icon: TrendingUp, label: 'Tendência', accent: 'text-accent-emerald' },
  stock_alert: { icon: AlertTriangle, label: 'Estoque', accent: 'text-accent-rose' },
  competitor: { icon: Users, label: 'Concorrência', accent: 'text-accent-violet' },
}

const impactColors = {
  high: 'bg-accent-rose/15 text-accent-rose',
  medium: 'bg-accent-amber/15 text-accent-amber',
  low: 'bg-accent-emerald/15 text-accent-emerald',
}

export default function Opportunities() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Oportunidades Inteligentes</h3>
          <p className="text-sm text-text-muted">Detectadas por IA nos seus marketplaces</p>
        </div>
        <button className="cursor-pointer text-sm font-medium text-accent-blue transition-colors hover:text-accent-blue-hover">
          Ver todas
        </button>
      </div>

      <div className="space-y-3">
        {opportunities.map((opp) => {
          const cfg = typeConfig[opp.type]
          const Icon = cfg.icon
          return (
            <div
              key={opp.id}
              className="group flex items-start gap-4 rounded-xl border border-border-subtle/50 p-4 transition-all duration-200 hover:border-border-default hover:bg-bg-card-hover"
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-bg-secondary ${cfg.accent}`}>
                <Icon className="h-5 w-5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-sm font-semibold text-text-primary">{opp.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${impactColors[opp.impact]}`}>
                    {opp.impact === 'high' ? 'Alto' : opp.impact === 'medium' ? 'Médio' : 'Baixo'}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-text-secondary">{opp.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${getMarketplaceColor(opp.marketplace)}15`,
                      color: getMarketplaceColor(opp.marketplace),
                    }}
                  >
                    {opp.marketplace}
                  </span>
                </div>
              </div>

              <button className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-text-muted opacity-0 transition-all duration-200 hover:bg-bg-secondary hover:text-accent-blue group-hover:opacity-100">
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
