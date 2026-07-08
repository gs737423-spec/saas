import { CheckCircle2, Clock, Hourglass } from 'lucide-react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'

type ConnStatus = 'pronto' | 'requer_autorizacao' | 'em_breve'

const statusConfig: Record<ConnStatus, { label: string; color: string; bg: string; border: string; icon: typeof CheckCircle2 }> = {
  pronto: { label: 'Pronto para conectar', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20', icon: CheckCircle2 },
  requer_autorizacao: { label: 'Requer autorização', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20', icon: Clock },
  em_breve: { label: 'Em breve', color: 'text-text-muted', bg: 'bg-bg-card-hover', border: 'border-border-subtle', icon: Hourglass },
}

const connections: { marketplace: Marketplace; status: ConnStatus }[] = [
  { marketplace: 'Mercado Livre', status: 'pronto' },
  { marketplace: 'Shopee', status: 'requer_autorizacao' },
  { marketplace: 'Amazon', status: 'em_breve' },
  { marketplace: 'Loja Própria', status: 'em_breve' },
]

export default function ChannelConnectionStatus() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Status das Conexões</h3>
        <p className="mt-0.5 text-xs text-text-muted">Sincronização automática por marketplace</p>
      </div>
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
        {connections.map((c) => {
          const mp = getMarketplaceColor(c.marketplace)
          const cfg = statusConfig[c.status]
          const Icon = cfg.icon
          return (
            <div key={c.marketplace} className={`flex items-center gap-2.5 rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2.5`}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: mp }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-medium text-text-primary">{c.marketplace}</p>
                <span className={`mt-0.5 flex items-center gap-1 text-[10.5px] font-medium ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
