import { useState } from 'react'
import { Crown } from 'lucide-react'
import { channelOverview, getMarketplaceColor, type ChannelOverview, type ChannelStatus } from '@/data/mockData'

type SortKey = 'netRevenue' | 'avgTicket' | 'feePct'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'netRevenue', label: 'Faturamento' },
  { key: 'avgTicket', label: 'Ticket Médio' },
  { key: 'feePct', label: 'Comissão' },
]

const statusStyle: Record<ChannelStatus, { color: string; bg: string }> = {
  'Saudável': { color: '#16C784', bg: 'rgba(22,199,132,0.12)' },
  'Atenção': { color: '#F5C24B', bg: 'rgba(245,194,75,0.12)' },
  'Crítico': { color: '#F4436C', bg: 'rgba(244,67,108,0.12)' },
}

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Deterministic per-bucket growth derived from each channel's single trend
// figure — gives D-1/D-7/D-30/D-365 distinct but consistent values.
function bucketGrowth(baseTrend: number): { d1: number; d7: number; d30: number; d365: number } {
  return {
    d1: Math.round(baseTrend * 0.4 * 10) / 10,
    d7: Math.round(baseTrend * 0.7 * 10) / 10,
    d30: Math.round(baseTrend * 10) / 10,
    d365: Math.round(baseTrend * 2.6 * 10) / 10,
  }
}

function StatusBadge({ status }: { status: ChannelStatus }) {
  const st = statusStyle[status]
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: st.color, background: st.bg }}>
      {status}
    </span>
  )
}

function GrowthCell({ label, value }: { label: string; value: number }) {
  const positive = value >= 0
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className={`font-mono text-sm font-bold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
        {positive ? '+' : ''}{pct(value)}%
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  )
}

function Row({ m, rank }: { m: ChannelOverview; rank: number }) {
  const brand = getMarketplaceColor(m.marketplace)
  const st = statusStyle[m.status]
  const isLeader = rank === 1

  return (
    <div
      className={`group flex items-center gap-3 rounded-xl px-3 py-2 sm:gap-4 sm:px-3.5 ${
        isLeader ? 'overview-marketplace-row-lead' : 'overview-marketplace-row'
      }`}
    >
      <span className="flex w-4 shrink-0 items-center justify-center">
        {isLeader ? <Crown className="h-3.5 w-3.5" style={{ color: brand }} /> : <span className="font-mono text-xs font-bold text-text-muted">{rank}</span>}
      </span>

      <div className="flex w-24 shrink-0 items-center gap-2 sm:w-32">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand, boxShadow: `0 0 6px ${brand}88` }} />
        <span className="truncate text-[13px] font-medium text-text-primary">{m.marketplace}</span>
      </div>

      <div className="w-24 shrink-0 text-right sm:w-28">
        <div className="font-mono text-[13px] font-semibold text-text-primary">R$ {brl(m.netRevenue)}</div>
        <div className="font-mono text-[9px] text-text-muted">faturamento</div>
      </div>

      <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
        <div className="overview-track h-1 flex-1 overflow-hidden rounded-full">
          <div className="h-full rounded-full" style={{ width: `${m.netSharePct}%`, background: `linear-gradient(90deg, ${brand}55, ${brand})` }} />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-[11px] text-text-secondary">{pct(m.netSharePct)}%</span>
        <span className="w-9 shrink-0 text-[9px] uppercase tracking-wider text-text-muted">share</span>
      </div>

      <div className="hidden w-16 shrink-0 text-right lg:block">
        <div className="font-mono text-xs text-text-secondary">R$ {brl2(m.avgTicket)}</div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">ticket médio</div>
      </div>
      <div className="hidden w-12 shrink-0 text-right lg:block">
        <div className="font-mono text-xs" style={{ color: st.color }}>{pct(m.feePct)}%</div>
        <div className="text-[9px] uppercase tracking-wider text-text-muted">comissão</div>
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

  const avgTrend = channelOverview.reduce((s, m) => s + m.trend, 0) / channelOverview.length
  const growth = bucketGrowth(avgTrend)

  return (
    <div className="overview-glass-elevated flex h-full flex-col rounded-2xl p-3.5 sm:p-4">
      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">GMV</h3>
          <p className="mt-0.5 text-xs text-text-muted">Faturamento por marketplace</p>
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

      {/* Crescimento — comparado a períodos anteriores */}
      <div className="mb-3 grid grid-cols-4 gap-2 rounded-xl border border-border-subtle/60 bg-bg-primary/30 py-2.5">
        <GrowthCell label="D-1" value={growth.d1} />
        <GrowthCell label="D-7" value={growth.d7} />
        <GrowthCell label="D-30" value={growth.d30} />
        <GrowthCell label="D-365" value={growth.d365} />
      </div>

      <div className="flex flex-1 flex-col gap-1.5">
        {rows.map((m, i) => (
          <Row key={m.marketplace} m={m} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
