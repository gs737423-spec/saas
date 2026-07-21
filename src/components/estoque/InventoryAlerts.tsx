import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getInventoryAlerts, type InventoryAlert } from '@/data/mockData'

const severityConfig: Record<InventoryAlert['severity'], { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  danger: { icon: AlertCircle, color: '#F4436C', bg: 'rgba(244,67,108,0.08)', border: 'rgba(244,67,108,0.25)' },
  warning: { icon: AlertTriangle, color: '#F3B65D', bg: 'rgba(245,194,75,0.08)', border: 'rgba(245,194,75,0.25)' },
  info: { icon: Info, color: '#3568F5', bg: 'rgba(53,104,245,0.08)', border: 'rgba(53,104,245,0.25)' },
}

export default function InventoryAlerts() {
  const alerts = getInventoryAlerts()

  return (
    <div className="overview-glass-elevated rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Alertas Inteligentes</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-rose/15 px-1.5 text-[10px] font-bold text-accent-rose">
          {alerts.length}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        {alerts.map((a) => {
          const cfg = severityConfig[a.severity]
          const Icon = cfg.icon
          return (
            <Link
              key={a.id}
              to={`/app/produto/${a.sku}`}
              className="flex items-start gap-2.5 rounded-xl border p-3 transition-colors hover:border-border-default"
              style={{ borderColor: cfg.border, background: cfg.bg }}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cfg.color }} />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>{a.rule}</span>
                <p className="mt-0.5 text-[12px] leading-snug text-text-secondary">{a.message}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
