import { ShoppingCart, AlertTriangle, Star, DownloadCloud } from 'lucide-react'
import { productActivity, type ProductActivity } from '@/data/mockData'

const typeConfig: Record<ProductActivity['type'], { icon: typeof ShoppingCart; color: string; bg: string }> = {
  venda: { icon: ShoppingCart, color: 'text-accent-emerald', bg: 'bg-accent-emerald/10' },
  alerta: { icon: AlertTriangle, color: 'text-accent-rose', bg: 'bg-accent-rose/10' },
  avaliacao: { icon: Star, color: 'text-accent-amber', bg: 'bg-accent-amber/10' },
  importacao: { icon: DownloadCloud, color: 'text-accent-blue', bg: 'bg-accent-blue/10' },
}

export default function ProdutoAtividade({ sku }: { sku: string }) {
  const activity = productActivity.filter((a) => a.sku === sku)

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Atividade Recente</h3>
        <p className="mt-0.5 text-xs text-text-muted">Vendas, alertas, avaliações e importações deste produto</p>
      </div>
      {activity.length === 0 ? (
        <p className="text-[13px] text-text-muted">Sem atividade recente registrada.</p>
      ) : (
        <div className="space-y-2">
          {activity.map((a, i) => {
            const cfg = typeConfig[a.type]
            const Icon = cfg.icon
            return (
              <div key={i} className="flex items-center gap-2.5 rounded-lg border border-border-subtle/60 bg-bg-primary/30 px-3 py-2.5">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${cfg.bg} ${cfg.color}`}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <p className="min-w-0 flex-1 truncate text-[12.5px] text-text-secondary">{a.message}</p>
                <span className="shrink-0 text-[11px] text-text-muted">{a.time}</span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
