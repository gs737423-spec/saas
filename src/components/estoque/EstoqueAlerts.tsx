import { PackageX, PauseCircle, Layers } from 'lucide-react'
import { Link } from 'react-router-dom'
import { stockAlerts } from '@/data/mockData'

const typeConfig = {
  ruptura: { icon: PackageX, label: 'Ruptura', color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
  parado: { icon: PauseCircle, label: 'Parado', color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20' },
  excesso: { icon: Layers, label: 'Excesso', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
}

export default function EstoqueAlerts() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Alertas de Estoque</h3>
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent-rose/15 px-1.5 text-[10px] font-bold text-accent-rose">
          {stockAlerts.length}
        </span>
      </div>
      <div className="space-y-2">
        {stockAlerts.map((a) => {
          const cfg = typeConfig[a.type]
          const Icon = cfg.icon
          return (
            <div key={a.id} className={`flex items-center gap-2.5 rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2.5`}>
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-bg-secondary ${cfg.color}`}>
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <Link to={`/app/produto/${a.sku}`} className="truncate text-[12.5px] font-medium text-text-primary hover:text-accent-blue hover:underline">{a.product}</Link>
                </div>
                <p className="truncate text-[11px] text-text-muted">{a.message}</p>
              </div>
              <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${cfg.color} ${cfg.bg}`}>{cfg.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
