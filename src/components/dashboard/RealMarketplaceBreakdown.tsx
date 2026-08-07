import { useEffect, useState } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import { getMarketplaceColor } from '@/data/mockData'
import { fillAllMarketplaces, type FinanceOverview, type MarketplaceFinance } from '@/data/financeShapes'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
}

type SortKey = 'netRevenue' | 'avgTicket' | 'feePct'

const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'netRevenue', label: 'Faturamento' },
  { key: 'avgTicket', label: 'Ticket Médio' },
  { key: 'feePct', label: 'Comissão' },
]

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

// Sempre "Crescimento" — os percentuais D-1/D-7/D-30/D-365 já são o que
// importa; a cor não muda porque não temos um "status" de canal calculado
// pra dado real (era mock antes, ver 'Saudável/Atenção/Crítico').
function StatusBadge() {
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold text-accent-emerald" style={{ background: 'rgba(43,214,160,0.12)' }}>
      Crescimento
    </span>
  )
}

function GrowthCell({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center gap-0.5">
        <span className="font-mono text-[11px] font-bold text-text-muted">—</span>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
    )
  }
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

function Row({ m, rank, share }: { m: MarketplaceFinance; rank: number; share: number }) {
  const brand = getMarketplaceColor(m.marketplace)
  const isLeader = rank === 1
  const feePct = m.grossRevenue > 0 ? (m.fees / m.grossRevenue) * 100 : 0

  return (
    <div className={`group flex flex-1 items-center gap-2.5 rounded-xl px-3 py-3.5 sm:gap-3 sm:px-4 sm:py-5 ${isLeader ? 'overview-marketplace-row-lead' : 'overview-marketplace-row'}`}>
      <span className="flex w-5 shrink-0 items-center justify-center">
        {isLeader ? <Crown className="h-4 w-4" style={{ color: brand }} /> : <span className="font-mono text-sm font-bold text-text-muted">{rank}</span>}
      </span>

      <div className="flex w-24 shrink-0 items-center gap-2 sm:w-32">
        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: brand, boxShadow: `0 0 8px ${brand}88` }} />
        <span className="truncate text-[14px] font-medium text-text-primary sm:text-[15px]">{m.marketplace}</span>
      </div>

      <div className="w-24 shrink-0 text-right sm:w-28">
        <div className="whitespace-nowrap font-mono text-[15px] font-bold text-text-primary sm:text-[16.5px]">R$ {brl(m.grossRevenue)}</div>
        <div className="font-mono text-[9.5px] text-text-muted">faturamento</div>
      </div>

      <div className="hidden min-w-[100px] max-w-[920px] flex-1 items-center gap-2 md:flex">
        <div className="overview-track h-1.5 flex-1 overflow-hidden rounded-full">
          <div className="h-full rounded-full" style={{ width: `${share}%`, background: `linear-gradient(90deg, ${brand}55, ${brand})` }} />
        </div>
        <span className="w-10 shrink-0 text-right font-mono text-[11.5px] text-text-secondary">{pct(share)}%</span>
      </div>

      <div className="hidden w-20 shrink-0 whitespace-nowrap text-right lg:block">
        <div className="font-mono text-[14px] font-semibold text-text-secondary">R$ {brl2(m.averageTicket)}</div>
        <div className="text-[9.5px] uppercase tracking-wider text-text-muted">ticket médio</div>
      </div>
      <div className="hidden w-14 shrink-0 text-right lg:block">
        <div className="font-mono text-[14px] font-semibold text-accent-amber">{pct(feePct)}%</div>
        <div className="text-[9.5px] uppercase tracking-wider text-text-muted">comissão</div>
      </div>

      <div className="hidden shrink-0 items-center gap-2.5 xl:flex">
        <GrowthCell label="D-1" value={m.growth.d1} />
        <GrowthCell label="D-7" value={m.growth.d7} />
        <GrowthCell label="D-30" value={m.growth.d30} />
        <GrowthCell label="D-365" value={m.growth.d365} />
      </div>

      <div className="ml-auto shrink-0">
        <StatusBadge />
      </div>
    </div>
  )
}

/** GMV — reaproveitado em Dashboard (Visão Geral). Dado real via
 *  /api/dashboard/finance (ou ilustrativo em Modo Demonstração, mesmo
 *  endpoint, ver apiFetch.ts). Mesmo layout/estrutura do componente
 *  original MarketplaceComparison.tsx. */
export default function RealMarketplaceBreakdown() {
  const [sort, setSort] = useState<SortKey>('netRevenue')
  const { period } = usePeriod()
  const [data, setData] = useState<FinanceApiResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<FinanceApiResponse>(`/api/dashboard/finance?days=${period.days}`).then((res) => {
      if (!cancelled) {
        setData(res)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [period.days])

  if (loading) {
    return (
      <div className="glass-panel flex items-center gap-2 rounded-2xl p-4 text-xs text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando faturamento por marketplace...
      </div>
    )
  }

  if ((data?.byMarketplace ?? []).length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-xs text-text-muted">
        Nenhum marketplace com pedido pago sincronizado ainda neste período.
      </div>
    )
  }

  // Sempre os 4 canais, na ordem canônica — canal sem pedido no período vem
  // zerado, nunca some da tela (ver decisão 2026-08-06).
  const rows = fillAllMarketplaces(data!.byMarketplace)
  const totalGross = rows.reduce((sum, r) => sum + r.grossRevenue, 0)

  const sorted = [...rows].sort((a, b) => {
    if (sort === 'netRevenue') return b.grossRevenue - a.grossRevenue
    if (sort === 'avgTicket') return b.averageTicket - a.averageTicket
    const feeA = a.grossRevenue > 0 ? a.fees / a.grossRevenue : 0
    const feeB = b.grossRevenue > 0 ? b.fees / b.grossRevenue : 0
    return feeB - feeA
  })

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
              type="button"
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
        {sorted.map((m, i) => (
          <Row key={m.marketplace} m={m} rank={i + 1} share={totalGross > 0 ? (m.grossRevenue / totalGross) * 100 : 0} />
        ))}
      </div>
    </div>
  )
}
