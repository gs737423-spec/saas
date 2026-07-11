import { useState } from 'react'
import { Crown } from 'lucide-react'
import { channelOverview, getMarketplaceColor, type ChannelOverview, type ChannelStatus } from '@/data/mockData'

type SortKey = 'netRevenue' | 'avgTicket' | 'feePct'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'netRevenue', label: 'Líquido' },
  { key: 'avgTicket', label: 'Ticket' },
  { key: 'feePct', label: 'Taxas' },
]

const statusStyle: Record<ChannelStatus, { color: string; bg: string }> = {
  'Saudável': { color: '#16C784', bg: 'rgba(22,199,132,0.12)' },
  'Atenção': { color: '#F5C24B', bg: 'rgba(245,194,75,0.12)' },
  'Crítico': { color: '#F4436C', bg: 'rgba(244,67,108,0.12)' },
}

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function StatusBadge({ status }: { status: ChannelStatus }) {
  const st = statusStyle[status]
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: st.color, background: st.bg }}>
      {status}
    </span>
  )
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div>
      <div className="text-[9px] font-medium uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] font-semibold text-text-primary">{value}</div>
      {sub && <div className="font-mono text-[10px] text-text-muted">{sub}</div>}
    </div>
  )
}

/* #1 — leader, most prominent block */
function LeaderCard({ m }: { m: ChannelOverview }) {
  const brand = getMarketplaceColor(m.marketplace)
  return (
    <div className="overview-marketplace-row-lead relative overflow-hidden rounded-[20px] p-4 sm:p-5">
      <div className="absolute inset-y-0 left-0 w-1" style={{ background: brand }} />
      <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-40 blur-3xl" style={{ background: `radial-gradient(circle, ${brand}33, transparent 70%)` }} />

      <div className="relative pl-2">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg-primary/60 ring-1 ring-inset ring-border-default">
              <Crown className="h-4 w-4" style={{ color: brand }} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: brand, boxShadow: `0 0 8px ${brand}88` }} />
                <span className="text-sm font-semibold text-text-primary">{m.marketplace}</span>
              </div>
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Líder de faturamento líquido</span>
            </div>
          </div>
          <StatusBadge status={m.status} />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="num-glow font-mono text-[30px] font-bold leading-none tracking-tight text-text-primary">
              R$ {brl(m.netRevenue)}
            </div>
            <div className="mt-1 font-mono text-[11px] text-text-muted">líquido est. · bruto R$ {brl(m.revenue)}</div>
          </div>
          <div className="text-right">
            <div className="font-mono text-2xl font-bold leading-none" style={{ color: brand }}>{pct(m.netSharePct)}%</div>
            <div className="mt-1 text-[10px] uppercase tracking-wider text-text-muted">participação</div>
          </div>
        </div>

        <div className="mt-3 overview-track h-2.5 w-full overflow-hidden rounded-full">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${m.netSharePct}%`, background: `linear-gradient(90deg, ${brand}66, ${brand})`, boxShadow: `0 0 14px -2px ${brand}99` }} />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-3 border-t border-border-subtle pt-3">
          <MiniStat label="Pedidos" value={brl(m.orders)} />
          <MiniStat label="Ticket" value={`R$ ${brl2(m.avgTicket)}`} />
          <MiniStat label="Taxas" value={`${pct(m.feePct)}%`} sub={`R$ ${brl(m.fees)}`} />
          <MiniStat label="Eficiência" value={`${pct(m.netEfficiencyPct)}%`} />
        </div>
      </div>
    </div>
  )
}

/* #2+ — condensed ranking rows */
function RankRow({ m, rank }: { m: ChannelOverview; rank: number }) {
  const brand = getMarketplaceColor(m.marketplace)
  const st = statusStyle[m.status]
  return (
    <div className="overview-marketplace-row group flex items-center gap-3 rounded-xl px-3 py-2.5 sm:gap-4 sm:px-4">
      <span className="w-4 shrink-0 text-center font-mono text-xs font-bold text-text-muted">{rank}</span>
      <div className="flex w-28 shrink-0 items-center gap-2 sm:w-36">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand }} />
        <span className="truncate text-[13px] font-medium text-text-primary">{m.marketplace}</span>
      </div>

      <div className="w-24 shrink-0 text-right sm:w-28">
        <div className="font-mono text-[13px] font-semibold text-text-primary">R$ {brl(m.netRevenue)}</div>
        <div className="font-mono text-[9px] text-text-muted">líquido est.</div>
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
        <div className="overview-track h-1.5 flex-1 overflow-hidden rounded-full">
          <div className="h-full rounded-full" style={{ width: `${m.netSharePct}%`, background: `linear-gradient(90deg, ${brand}55, ${brand})` }} />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-[11px] text-text-secondary">{pct(m.netSharePct)}%</span>
      </div>

      <div className="hidden w-16 shrink-0 text-right lg:block">
        <div className="font-mono text-xs text-text-secondary">R$ {brl2(m.avgTicket)}</div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">ticket</div>
      </div>
      <div className="hidden w-12 shrink-0 text-right lg:block">
        <div className="font-mono text-xs" style={{ color: st.color }}>{pct(m.feePct)}%</div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">taxas</div>
      </div>

      <div className="ml-auto shrink-0 lg:ml-0">
        <StatusBadge status={m.status} />
      </div>
    </div>
  )
}

export default function MarketplaceComparison() {
  const [sort, setSort] = useState<SortKey>('netRevenue')
  const rows = [...channelOverview].sort((a, b) => (b[sort] as number) - (a[sort] as number))
  const [leader, ...others] = rows

  return (
    <div className="overview-glass-elevated flex h-full flex-col rounded-2xl p-4 sm:rounded-3xl sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Comparativo por Marketplace</h3>
          <p className="mt-0.5 text-xs text-text-muted">Ranking por faturamento líquido estimado</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border-subtle bg-bg-primary/40 p-0.5">
          <span className="px-1.5 text-[9px] font-medium uppercase tracking-wider text-text-muted">Ordenar</span>
          {sortOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                sort === o.key ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <LeaderCard m={leader} />

      <div className="mt-2.5 flex flex-1 flex-col gap-1.5">
        {others.map((m, i) => (
          <RankRow key={m.marketplace} m={m} rank={i + 2} />
        ))}
      </div>
    </div>
  )
}
