import { useState } from 'react'
import { Crown } from 'lucide-react'
import { channelOverview, scaleChannelOverview, getMarketplaceColor, type ChannelOverview, type ChannelStatus } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'

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

// Badge sempre rotulado "Crescimento" (é o que os percentuais D-1/D-7/D-30/
// D-365 representam) — só a cor muda conforme o status do canal.

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
      Crescimento
    </span>
  )
}

function GrowthCell({ label, value }: { label: string; value: number }) {
  const positive = value >= 0
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-0.5">
      <span className={`font-mono text-[11px] font-bold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
        {positive ? '+' : ''}{pct(value)}%
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  )
}

function Row({ m, rank }: { m: ChannelOverview; rank: number }) {
  const brand = getMarketplaceColor(m.marketplace)
  const st = statusStyle[m.status]
  const isLeader = rank === 1
  const growth = bucketGrowth(m.trend)

  return (
    <div
      className={`group flex flex-1 items-center gap-2.5 rounded-xl px-3 py-3.5 sm:gap-3 sm:px-4 sm:py-5 ${
        isLeader ? 'overview-marketplace-row-lead' : 'overview-marketplace-row'
      }`}
    >
      <span className="flex w-5 shrink-0 items-center justify-center">
        {isLeader ? <Crown className="h-4 w-4" style={{ color: brand }} /> : <span className="font-mono text-sm font-bold text-text-muted">{rank}</span>}
      </span>

      <div className="flex w-24 shrink-0 items-center gap-2 sm:w-32">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: brand, boxShadow: `0 0 8px ${brand}88` }} />
        <span className="truncate text-[14px] font-medium text-text-primary sm:text-[15px]">{m.marketplace}</span>
      </div>

      <div className="w-24 shrink-0 text-right sm:w-28">
        <div className="whitespace-nowrap font-mono text-[15px] font-bold text-text-primary sm:text-[16.5px]">R$ {brl(m.netRevenue)}</div>
        <div className="font-mono text-[9.5px] text-text-muted">faturamento</div>
      </div>

      {/* Preenche o espaço sobrando da linha (badge sempre no fim via
          ml-auto) em vez de deixar espaço vazio — cap em max-w pra não
          esticar demais em telas muito largas. */}
      <div className="hidden min-w-[100px] max-w-[920px] flex-1 items-center gap-2 md:flex">
        <div className="overview-track h-1.5 flex-1 overflow-hidden rounded-full">
          <div className="h-full rounded-full" style={{ width: `${m.netSharePct}%`, background: `linear-gradient(90deg, ${brand}55, ${brand})` }} />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-[11.5px] text-text-secondary">{pct(m.netSharePct)}%</span>
      </div>

      <div className="hidden w-20 shrink-0 whitespace-nowrap text-right lg:block">
        <div className="font-mono text-[14px] font-semibold text-text-secondary">R$ {brl2(m.avgTicket)}</div>
        <div className="text-[9.5px] uppercase tracking-wider text-text-muted">ticket médio</div>
      </div>
      <div className="hidden w-14 shrink-0 text-right lg:block">
        <div className="font-mono text-[14px] font-semibold" style={{ color: st.color }}>{pct(m.feePct)}%</div>
        <div className="text-[9.5px] uppercase tracking-wider text-text-muted">comissão</div>
      </div>

      <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
        <GrowthCell label="D-1" value={growth.d1} />
        <GrowthCell label="D-7" value={growth.d7} />
        <GrowthCell label="D-30" value={growth.d30} />
        <GrowthCell label="D-365" value={growth.d365} />
      </div>

      <div className="ml-auto shrink-0">
        <StatusBadge status={m.status} />
      </div>
    </div>
  )
}

export default function MarketplaceComparison() {
  const [sort, setSort] = useState<SortKey>('netRevenue')
  const { period } = usePeriod()
  const scaled = scaleChannelOverview(channelOverview, period)
  const rows = [...scaled].sort((a, b) => (b[sort] as number) - (a[sort] as number))

  return (
    <div className="overview-glass-elevated motion-panel flex flex-col rounded-2xl p-3.5 sm:p-4">
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
              className={`motion-chip cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium ${
                sort === o.key ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 sm:gap-3">
        {rows.map((m, i) => (
          <Row key={m.marketplace} m={m} rank={i + 1} />
        ))}
      </div>
    </div>
  )
}
