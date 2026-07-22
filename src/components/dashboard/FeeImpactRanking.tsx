import { channelOverview, getMarketplaceColor } from '@/data/mockData'

const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function FeeImpactRanking() {
  const ranked = [...channelOverview].sort((a, b) => b.feePct - a.feePct)
  const max = Math.max(...ranked.map((m) => m.feePct))

  return (
    <div className="overview-glass flex h-full flex-col rounded-2xl p-4 sm:p-6">
      <div className="mb-5">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Impacto de Taxas</h3>
        <p className="mt-0.5 text-xs text-text-muted">Quanto do bruto cada canal consome em encargos</p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-4">
        {ranked.map((m) => {
          const brand = getMarketplaceColor(m.marketplace)
          const w = (m.feePct / max) * 100
          return (
            <div key={m.marketplace}>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                  <span className="h-2 w-2 rounded-full" style={{ background: brand }} />
                  {m.marketplace}
                </span>
                <span className="font-mono text-xs font-semibold text-text-primary">{pct(m.feePct)}%</span>
              </div>
              <div className="overview-track h-2 w-full overflow-hidden rounded-full">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${w}%`, background: `linear-gradient(90deg, ${brand}55, ${brand})`, boxShadow: `0 0 12px -2px ${brand}77` }}
                />
              </div>
              <div className="mt-1 text-right font-mono text-[10px] text-text-muted">R$ {m.fees.toLocaleString('pt-BR')}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
