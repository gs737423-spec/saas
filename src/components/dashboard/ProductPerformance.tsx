import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { products, getMarketplaceColor } from '@/data/mockData'

// Bars are scaled to % of goal. The dashed line marks 100% (meta).
const SCALE = 130 // max % of goal represented across the track width
const GOAL_LINE = (100 / SCALE) * 100 // horizontal position of the meta line

// Above goal → cyan, medium → yellow, low → red
function perf(goalPct: number) {
  if (goalPct >= 100) return { color: '#22D3EE', label: 'Acima da meta' }
  if (goalPct >= 85) return { color: '#F5C24B', label: 'Na meta' }
  return { color: '#F4436C', label: 'Abaixo da meta' }
}

export default function ProductPerformance() {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Desempenho dos Produtos</h3>
          <p className="mt-0.5 text-xs text-text-muted">Ranking individual · receita vs meta · últimos 30 dias</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-3.5 text-[11px] text-text-secondary sm:flex">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#22D3EE]" />Acima</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F5C24B]" />Na meta</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[#F4436C]" />Abaixo</span>
          </div>
          <button className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[11px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary">
            Relatório
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile: stacked cards (no horizontal scroll) */}
      <div className="space-y-2 md:hidden">
        {products.map((p, i) => {
          const positive = p.trend >= 0
          const mpColor = getMarketplaceColor(p.marketplace)
          const pf = perf(p.goalPct)
          const fillPct = (Math.min(p.goalPct, SCALE) / SCALE) * 100
          return (
            <div key={p.id} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3">
              <div className="mb-2.5 flex items-start gap-2.5">
                <span className="mt-0.5 font-mono text-xs font-bold text-text-muted">{String(i + 1).padStart(2, '0')}</span>
                <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full" style={{ background: mpColor }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium leading-tight text-text-primary">{p.name}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-text-muted">{p.sku}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[10px] font-medium" style={{ color: mpColor }}>{p.marketplace}</span>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{p.trend}%
                </span>
              </div>

              <div className="relative mb-2 flex h-6 items-center">
                <div className="relative h-6 w-full overflow-hidden rounded-lg bg-bg-primary/70 ring-1 ring-inset ring-border-subtle">
                  <div
                    className="flex h-full items-center rounded-lg"
                    style={{ width: `${fillPct}%`, background: `linear-gradient(90deg, ${pf.color}55, ${pf.color})`, boxShadow: `0 0 16px -2px ${pf.color}66` }}
                  >
                    <span className="ml-auto pr-2 font-mono text-[11px] font-bold text-[#04101c]">{p.goalPct}%</span>
                  </div>
                </div>
                <div className="pointer-events-none absolute inset-y-0" style={{ left: `${GOAL_LINE}%` }}>
                  <div className="h-full w-px border-l border-dashed border-text-secondary/50" />
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <span className="font-mono font-semibold text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</span>
                <span className="text-text-muted">Part. <span className="font-mono text-text-secondary">{p.sharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%</span></span>
              </div>
            </div>
          )
        })}
        <div className="flex items-center gap-2 pt-1 text-[10px] text-text-muted">
          <span className="inline-block h-3 w-px border-l border-dashed border-text-secondary/50" />
          Linha tracejada = meta (100%)
        </div>
      </div>

      {/* Desktop: full ranking table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <div className="min-w-[720px]">
          {/* Column headers */}
          <div className="mb-2 grid grid-cols-[26px_minmax(150px,1.1fr)_minmax(220px,2fr)_96px_74px_58px] items-center gap-3 px-1 pb-2 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            <span>#</span>
            <span>Produto</span>
            <span>Desempenho vs meta</span>
            <span className="text-right">Receita</span>
            <span className="text-right">Variação</span>
            <span className="text-right">Part.</span>
          </div>

          <div className="space-y-0.5">
            {products.map((p, i) => {
              const positive = p.trend >= 0
              const mpColor = getMarketplaceColor(p.marketplace)
              const pf = perf(p.goalPct)
              const fillPct = (Math.min(p.goalPct, SCALE) / SCALE) * 100
              return (
                <div
                  key={p.id}
                  className="group grid grid-cols-[26px_minmax(150px,1.1fr)_minmax(220px,2fr)_96px_74px_58px] items-center gap-3 rounded-xl px-1 py-1.5 transition-colors hover:bg-bg-card-hover/50"
                >
                  {/* Rank */}
                  <span className="text-center font-mono text-xs font-bold text-text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Product info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: mpColor }} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium leading-tight text-text-primary">{p.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        <span className="font-mono text-[10px] text-text-muted">{p.sku}</span>
                        <span className="text-text-muted">·</span>
                        <span className="text-[10px] font-medium" style={{ color: mpColor }}>{p.marketplace}</span>
                      </div>
                    </div>
                  </div>

                  {/* Performance bar with meta line */}
                  <div className="relative flex h-7 items-center">
                    <div className="relative h-7 w-full overflow-hidden rounded-lg bg-bg-primary/70 ring-1 ring-inset ring-border-subtle">
                      <div
                        className="flex h-full items-center rounded-lg transition-all duration-700"
                        style={{
                          width: `${fillPct}%`,
                          background: `linear-gradient(90deg, ${pf.color}55, ${pf.color})`,
                          boxShadow: `0 0 16px -2px ${pf.color}66`,
                        }}
                      >
                        <span className="ml-auto pr-2 font-mono text-[11px] font-bold text-[#04101c] drop-shadow-sm">
                          {p.goalPct}%
                        </span>
                      </div>
                    </div>
                    {/* Dashed meta (100%) line */}
                    <div
                      className="pointer-events-none absolute inset-y-0 flex flex-col items-center"
                      style={{ left: `${GOAL_LINE}%` }}
                    >
                      <div className="h-full w-px border-l border-dashed border-text-secondary/50" />
                    </div>
                  </div>

                  {/* Revenue */}
                  <span className="text-right font-mono text-[13px] font-semibold text-text-primary">
                    R$ {p.revenue.toLocaleString('pt-BR')}
                  </span>

                  {/* Variation */}
                  <div className="flex justify-end">
                    <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {positive ? '+' : ''}{p.trend}%
                    </span>
                  </div>

                  {/* Participation */}
                  <span className="text-right font-mono text-xs text-text-secondary">
                    {p.sharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1 })}%
                  </span>
                </div>
              )
            })}
          </div>

          {/* Meta caption */}
          <div className="mt-2 flex items-center gap-2 border-t border-border-subtle pt-2.5 text-[10px] text-text-muted">
            <span className="inline-block h-3 w-px border-l border-dashed border-text-secondary/50" />
            Linha tracejada = meta (100%) · barras além da linha superaram a meta
          </div>
        </div>
      </div>
    </div>
  )
}
