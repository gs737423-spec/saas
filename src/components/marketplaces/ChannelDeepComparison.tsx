import { useState } from 'react'
import { Crown } from 'lucide-react'
import { channelOverview, getMarketplaceColor, type ChannelOverview, type ChannelStatus } from '@/data/mockData'

type SortKey = 'netRevenue' | 'avgTicket' | 'feePct' | 'orders' | 'trend'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'netRevenue', label: 'Líquido' },
  { key: 'orders', label: 'Pedidos' },
  { key: 'avgTicket', label: 'Ticket' },
  { key: 'feePct', label: 'Taxas' },
  { key: 'trend', label: 'Crescimento' },
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

function Stat({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div>
      <div className="text-[9px] font-medium uppercase tracking-wider text-text-muted">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] font-semibold text-text-primary" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="font-mono text-[10px] text-text-muted">{sub}</div>}
    </div>
  )
}

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

        <div className="mt-4 grid grid-cols-5 gap-3 border-t border-border-subtle pt-3">
          <Stat label="Pedidos" value={brl(m.orders)} />
          <Stat label="Ticket" value={`R$ ${brl2(m.avgTicket)}`} />
          <Stat label="Taxas" value={`${pct(m.feePct)}%`} sub={`R$ ${brl(m.fees)}`} />
          <Stat label="Eficiência" value={`${pct(m.netEfficiencyPct)}%`} />
          <Stat label="Crescimento" value={`${m.trend >= 0 ? '+' : ''}${pct(m.trend)}%`} accent={m.trend >= 0 ? '#16C784' : '#F4436C'} />
        </div>
      </div>
    </div>
  )
}

function ChannelRow({ m, rank }: { m: ChannelOverview; rank: number }) {
  const brand = getMarketplaceColor(m.marketplace)
  return (
    <div className="overview-marketplace-row relative overflow-hidden rounded-xl px-3 py-3 sm:px-4">
      <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: brand }} />
      <div className="flex flex-col gap-3 pl-2 lg:flex-row lg:items-center">
        <div className="flex items-center gap-3 lg:w-44 lg:shrink-0">
          <span className="w-4 shrink-0 text-center font-mono text-xs font-bold text-text-muted">{rank}</span>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: brand }} />
          <span className="truncate text-[13px] font-medium text-text-primary">{m.marketplace}</span>
          <StatusBadge status={m.status} />
        </div>

        <div className="flex flex-1 flex-wrap items-center gap-x-5 gap-y-2">
          <div className="w-28 shrink-0">
            <div className="font-mono text-[14px] font-semibold text-text-primary">R$ {brl(m.netRevenue)}</div>
            <div className="font-mono text-[9px] text-text-muted">líquido est.</div>
          </div>

          <div className="hidden min-w-0 flex-1 items-center gap-2 md:flex">
            <div className="overview-track h-1.5 flex-1 overflow-hidden rounded-full">
              <div className="h-full rounded-full" style={{ width: `${m.netSharePct}%`, background: `linear-gradient(90deg, ${brand}55, ${brand})` }} />
            </div>
            <span className="w-10 shrink-0 text-right font-mono text-[11px] text-text-secondary">{pct(m.netSharePct)}%</span>
          </div>

          <div className="flex gap-4">
            <div className="text-right">
              <div className="font-mono text-xs text-text-secondary">{brl(m.orders)}</div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">pedidos</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-text-secondary">R$ {brl2(m.avgTicket)}</div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">ticket</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs" style={{ color: statusStyle[m.status].color }}>{pct(m.feePct)}%</div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">taxas</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-xs text-text-secondary">{pct(m.netEfficiencyPct)}%</div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">eficiência</div>
            </div>
            <div className="text-right">
              <div className={`font-mono text-xs font-semibold ${m.trend >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {m.trend >= 0 ? '+' : ''}{pct(m.trend)}%
              </div>
              <div className="text-[9px] uppercase tracking-wider text-text-muted">crescimento</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ChannelDeepComparison() {
  const [sort, setSort] = useState<SortKey>('netRevenue')

  const sorted = [...channelOverview].sort((a, b) => {
    if (sort === 'feePct') return (b[sort] as number) - (a[sort] as number)
    if (sort === 'trend') return (b[sort] as number) - (a[sort] as number)
    return (b[sort] as number) - (a[sort] as number)
  })
  const [leader, ...others] = sorted

  return (
    <div className="overview-glass-elevated flex flex-col rounded-2xl p-4 sm:rounded-3xl sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Comparativo Profundo por Marketplace</h3>
          <p className="mt-0.5 text-xs text-text-muted">Todos os indicadores por canal, ordenável</p>
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

      <div className="mt-2.5 flex flex-col gap-1.5">
        {others.map((m, i) => (
          <ChannelRow key={m.marketplace} m={m} rank={i + 2} />
        ))}
      </div>
    </div>
  )
}
