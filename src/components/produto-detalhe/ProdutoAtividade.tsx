import { ShoppingCart, AlertTriangle, Star, DownloadCloud, Megaphone } from 'lucide-react'
import { productActivity, type ProductActivity } from '@/data/mockData'

const typeConfig: Record<ProductActivity['type'], { icon: typeof ShoppingCart; color: string; bg: string; dot: string }> = {
  venda: { icon: ShoppingCart, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', dot: '#2BD6A0' },
  alerta: { icon: AlertTriangle, color: 'text-accent-rose', bg: 'bg-accent-rose/10', dot: '#FF5F7A' },
  avaliacao: { icon: Star, color: 'text-accent-amber', bg: 'bg-accent-amber/10', dot: '#FFC857' },
  importacao: { icon: DownloadCloud, color: 'text-accent-blue', bg: 'bg-accent-blue/10', dot: '#2F6BFF' },
  campanha: { icon: Megaphone, color: 'text-accent-violet', bg: 'bg-accent-violet/10', dot: '#194B9B' },
}

export default function ProdutoAtividade({ sku }: { sku: string }) {
  const activity = productActivity.filter((a) => a.sku === sku)

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Atividade Recente</h3>
        <p className="mt-0.5 text-xs text-text-muted">Vendas, avaliações, estoque, campanhas e importações deste produto</p>
      </div>
      {activity.length === 0 ? (
        <p className="text-[13px] text-text-muted">Sem atividade recente registrada.</p>
      ) : (
        <div className="relative space-y-4 pl-1">
          <div className="absolute bottom-2 left-[15px] top-2 w-px bg-border-subtle" />
          {activity.map((a, i) => {
            const cfg = typeConfig[a.type]
            const Icon = cfg.icon
            return (
              <div key={i} className="relative flex items-start gap-3">
                <div className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-bg-secondary ${cfg.bg} ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1 pt-1">
                  <p className="text-[12.5px] leading-snug text-text-secondary">{a.message}</p>
                  <span className="mt-0.5 block text-[11px] text-text-muted">{a.time}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
