import { AlertCircle, CheckCircle, Info, XCircle } from 'lucide-react'
import { alerts, getMarketplaceColor } from '@/data/mockData'

const typeConfig = {
  warning: { icon: AlertCircle, color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  info: { icon: Info, color: 'text-accent-blue', bg: 'bg-accent-blue/10', border: 'border-accent-blue/20' },
  success: { icon: CheckCircle, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  danger: { icon: XCircle, color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
}

export default function AlertsPanel() {
  return (
    <div className="glass-panel rounded-3xl p-7">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-text-primary">Alertas Inteligentes</h3>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-rose/15 px-1.5 text-[10px] font-bold text-accent-rose">
            {alerts.length}
          </span>
        </div>
        <button className="cursor-pointer text-sm font-medium text-accent-blue transition-colors hover:text-accent-blue-hover">
          Marcar como lidos
        </button>
      </div>

      <div className="space-y-2">
        {alerts.map((alert) => {
          const cfg = typeConfig[alert.type]
          const Icon = cfg.icon
          return (
            <div
              key={alert.id}
              className={`flex items-start gap-3 rounded-xl border ${cfg.border} ${cfg.bg} p-3.5 transition-colors`}
            >
              <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cfg.color}`} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text-primary">{alert.message}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-medium"
                    style={{
                      background: `${getMarketplaceColor(alert.marketplace)}15`,
                      color: getMarketplaceColor(alert.marketplace),
                    }}
                  >
                    {alert.marketplace}
                  </span>
                  <span className="text-xs text-text-muted">{alert.time}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
