import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { getExecutiveAlerts, type ExecutiveAlertSeverity } from '@/data/mockData'

const severityIcon: Record<ExecutiveAlertSeverity, typeof AlertTriangle> = {
  danger: AlertTriangle,
  warning: AlertCircle,
  info: Info,
}

const severityColor: Record<ExecutiveAlertSeverity, string> = {
  danger: '#F4436C',
  warning: '#F5C24B',
  info: '#4C82F7',
}

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false)
  const [read, setRead] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const alerts = getExecutiveAlerts()

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        title="Notificações"
        onClick={() => { setOpen((o) => !o); setRead(true) }}
        className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary"
      >
        <Bell className="h-[18px] w-[18px]" />
        {!read && alerts.length > 0 && (
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full border-2 border-bg-secondary bg-accent-rose" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border-subtle px-4 py-3">
            <p className="text-sm font-semibold text-text-primary">Notificações</p>
            <span className="text-[11px] text-text-muted">{alerts.length} alertas</span>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {alerts.length === 0 && (
              <p className="px-4 py-6 text-center text-[12.5px] text-text-muted">Nenhum alerta no momento.</p>
            )}
            {alerts.map((a) => {
              const Icon = severityIcon[a.severity]
              const color = severityColor[a.severity]
              const content = (
                <div className="flex items-start gap-2.5 px-4 py-3 transition-colors hover:bg-white/5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" style={{ color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[12.5px] font-medium text-text-primary">{a.rule}</p>
                    <p className="mt-0.5 text-[11.5px] leading-snug text-text-muted">{a.message}</p>
                  </div>
                </div>
              )
              return a.sku ? (
                <Link key={a.id} to={`/app/produto/${a.sku}`} onClick={() => setOpen(false)} className="block border-b border-border-subtle/60 last:border-0">
                  {content}
                </Link>
              ) : (
                <div key={a.id} className="border-b border-border-subtle/60 last:border-0">{content}</div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
