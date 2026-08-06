import { useMemo, useState } from 'react'
import { Boxes, Layers, AlertTriangle, Snowflake, RefreshCw, Crown, ShieldAlert } from 'lucide-react'
import { getMarketplaceColor } from '@/data/mockData'
import type { AbcClass, DashboardInventoryItem } from '@/server/integrations/types'

function relativeTime(iso: string | null): string {
  if (!iso) return '—'
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  return `há ${Math.floor(diff / 86400)}d`
}

const ABC_STYLE: Record<AbcClass, { bg: string; text: string }> = {
  A: { bg: 'bg-accent-emerald/10', text: 'text-accent-emerald' },
  B: { bg: 'bg-accent-amber/10', text: 'text-accent-amber' },
  C: { bg: 'bg-accent-rose/10', text: 'text-accent-rose' },
}

function AbcBadge({ abcClass }: { abcClass: AbcClass | null }) {
  if (!abcClass) return <span className="text-[11px] text-text-muted">—</span>
  const style = ABC_STYLE[abcClass]
  return <span className={`inline-flex h-5 w-5 items-center justify-center rounded-md text-[11px] font-bold ${style.bg} ${style.text}`}>{abcClass}</span>
}

function formatTurnover(rate: number | null): string {
  if (rate === null) return '—'
  return `${rate.toFixed(1)}x`
}

// Cobertura (dias de estoque no ritmo de venda atual) — derivada de campos
// já reais (availableQuantity/soldQuantity), sem nenhum dado novo inventado.
// null quando não há venda no período (sem ritmo pra calcular).
function coverageDays(item: DashboardInventoryItem): number | null {
  if (!item.soldQuantity || item.soldQuantity <= 0) return null
  const dailyRate = item.soldQuantity / 30
  return dailyRate > 0 ? item.availableQuantity / dailyRate : null
}

type StatusFilter = 'all' | 'A' | 'B' | 'C' | 'critico' | 'parado' | 'cobertura_baixa' | 'excesso'

function classify(item: DashboardInventoryItem): { critico: boolean; parado: boolean; coberturaBaixa: boolean; excesso: boolean } {
  const cov = coverageDays(item)
  const parado = (item.soldQuantity ?? 0) === 0 && item.availableQuantity > 0
  const critico = !parado && cov !== null && cov < 7
  const coberturaBaixa = !parado && cov !== null && cov < 15
  const excesso = cov !== null && cov > 45
  return { critico, parado, coberturaBaixa, excesso }
}

export default function RealInventoryTable({ items }: { items: DashboardInventoryItem[] }) {
  const [filter, setFilter] = useState<StatusFilter>('all')

  const flagged = useMemo(() => items.map((item) => ({ item, flags: classify(item) })), [items])

  const totalUnits = items.reduce((sum, i) => sum + (i.availableQuantity ?? 0), 0)
  const totalValue = items.reduce((sum, i) => sum + (i.price ?? 0) * (i.availableQuantity ?? 0), 0)
  const criticoCount = flagged.filter((f) => f.flags.critico).length
  const excessoCount = flagged.filter((f) => f.flags.excesso).length
  const paradoCount = flagged.filter((f) => f.flags.parado).length
  const turnoverValues = items.map((i) => i.turnoverRate).filter((t): t is number => t !== null)
  const avgTurnover = turnoverValues.length > 0 ? turnoverValues.reduce((s, t) => s + t, 0) / turnoverValues.length : null
  const curvaA = items.filter((i) => i.abcClass === 'A')
  const curvaARisco = flagged.filter((f) => f.item.abcClass === 'A' && (f.flags.critico || f.flags.parado)).length

  const filtered = flagged.filter(({ item, flags }) => {
    if (filter === 'all') return true
    if (filter === 'A' || filter === 'B' || filter === 'C') return item.abcClass === filter
    if (filter === 'critico') return flags.critico
    if (filter === 'parado') return flags.parado
    if (filter === 'cobertura_baixa') return flags.coberturaBaixa
    if (filter === 'excesso') return flags.excesso
    return true
  })

  const kpis = [
    { icon: Boxes, label: 'Valor estimado em estoque', value: `R$ ${totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, sub: 'estoque × preço', tone: '#3A8DFF' },
    { icon: Layers, label: 'Total de SKUs', value: String(items.length), sub: `${totalUnits.toLocaleString('pt-BR')} unidades`, tone: '#8A5CF6' },
    { icon: AlertTriangle, label: 'Crítico / Excesso', value: `${criticoCount} / ${excessoCount}`, sub: 'crítico · excesso', tone: '#FF5E7D' },
    { icon: Snowflake, label: 'Produtos parados', value: String(paradoCount), sub: 'sem giro no período', tone: '#46E5FF' },
    { icon: RefreshCw, label: 'Giro médio', value: avgTurnover !== null ? `${avgTurnover.toFixed(1)}x` : '—', sub: 'vendas ÷ estoque médio', tone: '#3BE38E' },
    { icon: Crown, label: 'Produtos Curva A', value: String(curvaA.length), sub: 'maior share de faturamento', tone: '#FFC95A' },
    { icon: ShieldAlert, label: 'Curva A em risco', value: String(curvaARisco), sub: 'top faturamento, cobertura baixa', tone: '#FF5E7D' },
  ]

  const filterChips: { key: StatusFilter; label: string }[] = [
    { key: 'all', label: 'Todos' },
    { key: 'A', label: 'Curva A' },
    { key: 'B', label: 'Curva B' },
    { key: 'C', label: 'Curva C' },
    { key: 'critico', label: 'Crítico' },
    { key: 'parado', label: 'Parado' },
    { key: 'cobertura_baixa', label: 'Cobertura baixa' },
    { key: 'excesso', label: 'Excesso' },
  ]

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {kpis.map((k) => (
          <div key={k.label} className="overview-glass flex flex-col gap-1.5 rounded-2xl p-3">
            <div className="flex items-center justify-between">
              <span className="text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">{k.label}</span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${k.tone}16`, boxShadow: `inset 0 0 0 1px ${k.tone}33` }}>
                <k.icon className="h-3.5 w-3.5" style={{ color: k.tone }} />
              </span>
            </div>
            <p className="truncate font-mono text-[15px] font-bold text-text-primary">{k.value}</p>
            <p className="truncate text-[10px] text-text-muted">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="overview-glass-elevated flex flex-col rounded-2xl p-4 sm:p-5">
        <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-text-primary">Estoque por Produto</h3>
            <p className="mt-0.5 text-xs text-text-muted">{filtered.length} de {items.length} produtos · inclui Curva ABC</p>
          </div>
        </div>

        <div className="mb-3.5 flex flex-wrap gap-1.5">
          {filterChips.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => setFilter(c.key)}
              className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                filter === c.key ? 'bg-accent-cyan/15 text-accent-cyan' : 'bg-bg-card text-text-muted hover:text-text-secondary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Mobile: stacked cards */}
        <div className="space-y-2.5 md:hidden">
          {filtered.map(({ item }) => {
            const mp = getMarketplaceColor(item.marketplace)
            return (
            <div key={`${item.marketplace}-${item.sku ?? item.title}`} className="overview-glass rounded-xl p-3.5">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-text-primary">{item.title}</p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-text-muted">{item.sku ?? '—'}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[10px] font-medium" style={{ color: mp }}>{item.marketplace}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md bg-bg-card px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">{item.status ?? '—'}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border-subtle/50 pt-2.5 text-[11px]">
                <div><p className="text-text-muted">Estoque</p><p className="mt-0.5 font-mono text-text-primary">{item.availableQuantity}</p></div>
                <div><p className="text-text-muted">Preço</p><p className="mt-0.5 font-mono text-text-secondary">{item.price != null ? `R$ ${item.price.toLocaleString('pt-BR')}` : '—'}</p></div>
                <div><p className="text-text-muted">Sync</p><p className="mt-0.5 font-mono text-text-secondary">{relativeTime(item.lastSyncAt)}</p></div>
                <div><p className="text-text-muted">Giro 30d</p><p className="mt-0.5 font-mono text-text-secondary">{formatTurnover(item.turnoverRate)}</p></div>
                <div><p className="text-text-muted">Curva ABC</p><div className="mt-0.5"><AbcBadge abcClass={item.abcClass} /></div></div>
              </div>
            </div>
            )
          })}
        </div>

        {/* Desktop: table */}
        <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
                <th className="pb-3 pr-3 pl-2 font-semibold">SKU</th>
                <th className="pb-3 pr-3 font-semibold">Título</th>
                <th className="pb-3 pr-3 font-semibold">Marketplace</th>
                <th className="pb-3 pr-3 text-right font-semibold">Estoque</th>
                <th className="pb-3 pr-3 text-right font-semibold">Preço</th>
                <th className="pb-3 pr-3 text-right font-semibold">Vendas 30d</th>
                <th className="pb-3 pr-3 text-right font-semibold">Cobertura</th>
                <th className="pb-3 pr-3 text-right font-semibold">Giro 30d</th>
                <th className="pb-3 pr-3 text-center font-semibold">Curva ABC</th>
                <th className="pb-3 pr-3 text-center font-semibold">Status</th>
                <th className="pb-3 pr-2 text-right font-semibold">Última sync</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ item, flags }) => {
                const mp = getMarketplaceColor(item.marketplace)
                const cov = coverageDays(item)
                return (
                <tr key={`${item.marketplace}-${item.sku ?? item.title}`} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-3 pl-2 font-mono text-[11px] text-text-muted">{item.sku ?? '—'}</td>
                  <td className="py-3 pr-3 font-medium text-text-primary">{item.title}</td>
                  <td className="py-3 pr-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium" style={{ background: `${mp}15`, color: mp }}>
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                      {item.marketplace}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{item.availableQuantity}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{item.price != null ? `R$ ${item.price.toLocaleString('pt-BR')}` : '—'}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{item.soldQuantity ?? '—'}</td>
                  <td className="py-3 pr-3 text-right">
                    {cov === null ? (
                      <span className="font-mono text-text-muted">—</span>
                    ) : (
                      <span className={`rounded-md px-1.5 py-0.5 font-mono text-[11px] ${flags.critico ? 'bg-accent-rose/10 text-accent-rose' : flags.excesso ? 'bg-accent-violet/10 text-accent-violet' : 'text-text-secondary'}`}>
                        {Math.round(cov)}d
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{formatTurnover(item.turnoverRate)}</td>
                  <td className="py-3 pr-3 text-center"><AbcBadge abcClass={item.abcClass} /></td>
                  <td className="py-3 pr-3 text-center">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${
                      flags.parado ? 'bg-accent-rose/10 text-accent-rose' : flags.critico ? 'bg-accent-amber/10 text-accent-amber' : 'bg-bg-card text-text-secondary'
                    }`}>
                      {flags.parado ? 'parado' : flags.critico ? 'crítico' : item.status ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 pr-2 text-right font-mono text-[11px] text-text-muted">{relativeTime(item.lastSyncAt)}</td>
                </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
