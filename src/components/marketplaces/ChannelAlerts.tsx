import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { getExecutiveAlerts, getMarketplaceColor, type ExecutiveAlertSeverity } from '@/data/mockData'

const severityConfig: Record<ExecutiveAlertSeverity, { icon: typeof AlertTriangle; color: string; bg: string; border: string }> = {
  danger: { icon: AlertCircle, color: '#F4436C', bg: 'rgba(244,67,108,0.08)', border: 'rgba(244,67,108,0.25)' },
  warning: { icon: AlertTriangle, color: '#F5C24B', bg: 'rgba(245,194,75,0.08)', border: 'rgba(245,194,75,0.25)' },
  info: { icon: Info, color: '#4C82F7', bg: 'rgba(76,130,247,0.08)', border: 'rgba(76,130,247,0.25)' },
}

export default function ChannelAlerts() {
  const alerts = getExecutiveAlerts()

  return (
    <div className="overview-glass-elevated rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Alertas Executivos</h3>
        <p className="mt-0.5 text-xs text-text-muted">Gerados por regra a partir dos dados dos canais</p>
      </div>
      <div className="space-y-2">
        {alerts.map((a) => {
          const cfg = severityConfig[a.severity]
          const Icon = cfg.icon
          const brand = a.marketplace ? getMarketplaceColor(a.marketplace) : undefined
          return (
            <div key={a.id} className="flex items-start gap-3 rounded-xl border p-3" style={{ borderColor: cfg.border, background: cfg.bg }}>
              <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color: cfg.color }} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: cfg.color }}>{a.rule}</span>
                  {a.marketplace && (
                    <span className="flex items-center gap-1 text-[10px] text-text-muted">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                      {a.marketplace}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-text-secondary">{a.message}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
