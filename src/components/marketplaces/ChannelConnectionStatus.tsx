import { CheckCircle2, Clock, Hourglass } from 'lucide-react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'

type ConnStatus = 'pronto' | 'requer_autorizacao' | 'em_breve'

const statusConfig: Record<ConnStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  pronto: { label: 'Pronto', color: '#22D3EE', icon: CheckCircle2 },
  requer_autorizacao: { label: 'Requer autorização', color: '#F5C24B', icon: Clock },
  em_breve: { label: 'Em breve', color: '#59688A', icon: Hourglass },
}

const connections: { marketplace: Marketplace; status: ConnStatus }[] = [
  { marketplace: 'Mercado Livre', status: 'pronto' },
  { marketplace: 'Shopee', status: 'requer_autorizacao' },
  { marketplace: 'Amazon', status: 'em_breve' },
  { marketplace: 'Loja Própria', status: 'em_breve' },
]

export default function ChannelConnectionStatus() {
  return (
    <div className="overview-glass flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl px-3.5 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Conexões</span>
      {connections.map((c) => {
        const mp = getMarketplaceColor(c.marketplace)
        const cfg = statusConfig[c.status]
        const Icon = cfg.icon
        return (
          <span key={c.marketplace} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className="h-2 w-2 rounded-full" style={{ background: mp }} />
            {c.marketplace}
            <Icon className="h-3 w-3" style={{ color: cfg.color }} />
            <span style={{ color: cfg.color }} className="text-[10.5px] font-medium">{cfg.label}</span>
          </span>
        )
      })}
    </div>
  )
}
