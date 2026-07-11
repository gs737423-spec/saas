import { Link2, ShoppingCart, Package, Boxes, Receipt } from 'lucide-react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'

type ConnStatus = 'em_breve' | 'pronto' | 'requer_autorizacao'

const statusConfig: Record<ConnStatus, { label: string; color: string; bg: string; border: string }> = {
  em_breve: { label: 'Em breve', color: 'text-text-muted', bg: 'bg-bg-card-hover', border: 'border-border-subtle' },
  pronto: { label: 'Pronto para conectar', color: 'text-accent-cyan', bg: 'bg-accent-cyan/10', border: 'border-accent-cyan/20' },
  requer_autorizacao: { label: 'Requer autorização', color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
}

const connections: { marketplace: Marketplace; status: ConnStatus; lastSync: string }[] = [
  { marketplace: 'Mercado Livre', status: 'pronto', lastSync: 'Nunca sincronizado' },
  { marketplace: 'Shopee', status: 'requer_autorizacao', lastSync: 'Nunca sincronizado' },
  { marketplace: 'Amazon', status: 'em_breve', lastSync: 'Indisponível' },
  { marketplace: 'Loja Própria', status: 'em_breve', lastSync: 'Indisponível' },
]

const permissions = [
  { icon: ShoppingCart, label: 'Pedidos' },
  { icon: Package, label: 'Produtos' },
  { icon: Boxes, label: 'Estoque' },
  { icon: Receipt, label: 'Faturamento' },
]

export default function MarketplaceConnections() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-accent-blue" />
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Conexões Automáticas</h3>
          <p className="mt-0.5 text-xs text-text-muted">Sincronize dados direto do marketplace, sem planilhas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {connections.map((c) => {
          const color = getMarketplaceColor(c.marketplace)
          const cfg = statusConfig[c.status]
          const disabled = c.status !== 'pronto'
          return (
            <div key={c.marketplace} className="relative overflow-hidden rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-text-primary">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  {c.marketplace}
                </span>
                <span className={`shrink-0 rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                  {cfg.label}
                </span>
              </div>

              <p className="mb-3 text-[11.5px] leading-relaxed text-text-secondary">
                Conecte sua conta para sincronizar pedidos, produtos, estoque e faturamento automaticamente.
              </p>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {permissions.map((p) => {
                  const PIcon = p.icon
                  return (
                    <span key={p.label} className="flex items-center gap-1 rounded-md bg-bg-card-hover px-1.5 py-0.5 text-[9.5px] font-medium text-text-muted">
                      <PIcon className="h-2.5 w-2.5" />
                      {p.label}
                    </span>
                  )
                })}
              </div>

              <p className="mb-3 text-[10px] text-text-muted">Última sincronização: {c.lastSync}</p>

              <button
                disabled={disabled}
                className={`w-full rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors ${
                  disabled
                    ? 'cursor-not-allowed border border-border-subtle bg-bg-card/40 text-text-muted'
                    : 'bg-accent-blue/10 text-accent-blue hover:bg-accent-blue/20'
                }`}
              >
                {disabled ? cfg.label : 'Conectar conta'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
