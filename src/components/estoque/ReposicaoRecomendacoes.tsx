import { PackagePlus } from 'lucide-react'
import { restockRecommendations, getMarketplaceColor } from '@/data/mockData'

const urgencyColor = { alta: 'text-accent-rose bg-accent-rose/10', média: 'text-accent-amber bg-accent-amber/10', baixa: 'text-accent-emerald bg-accent-emerald/10' }

export default function ReposicaoRecomendacoes() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Recomendações de Reposição</h3>
        <p className="mt-0.5 text-xs text-text-muted">Sugestões de compra baseadas em giro e cobertura</p>
      </div>
      <div className="space-y-2.5">
        {restockRecommendations.map((r) => {
          const mp = getMarketplaceColor(r.marketplace)
          return (
            <div key={r.id} className="group flex items-start gap-3 rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5 transition-colors hover:border-border-default">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-blue/10 text-accent-blue">
                <PackagePlus className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1.5 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
                  <span className="truncate text-[13px] font-medium text-text-primary">{r.product}</span>
                  <span className={`shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${urgencyColor[r.urgency]}`}>
                    Urgência {r.urgency}
                  </span>
                </div>
                <p className="mt-0.5 text-[12px] text-text-secondary">{r.reason}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-text-muted">{r.sku}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ background: `${mp}15`, color: mp }}>{r.marketplace}</span>
                  <span className="ml-auto font-mono text-[12px] font-semibold text-accent-cyan">+{r.suggestedUnits} un.</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
