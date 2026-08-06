import { useEffect, useState } from 'react'
import { Crown, Loader2 } from 'lucide-react'
import { getMarketplaceColor } from '@/data/mockData'
import type { FinanceOverview, MarketplaceFinance } from '@/data/financeShapes'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
}

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function GrowthChip({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <span className="flex flex-col items-center">
        <span className="text-[10px] font-medium text-text-muted">{value}</span>
        <span className="text-[9px] text-text-muted/70">{label}</span>
      </span>
    )
  }
  const positive = value >= 0
  return (
    <span className="flex flex-col items-center">
      <span className={`text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
        {positive ? '+' : ''}{value.toFixed(1)}%
      </span>
      <span className="text-[9px] text-text-muted">{label}</span>
    </span>
  )
}

/** GMV por marketplace — reaproveitado em Dashboard (Visão Geral) e
 *  Marketplaces. Dado real via /api/dashboard/finance (ou ilustrativo, mesmo
 *  endpoint, quando o admin ativa o Modo Demonstração — ver apiFetch.ts). */
export default function RealMarketplaceBreakdown() {
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
    return () => {
      cancelled = true
    }
  }, [period.days])

  if (loading) {
    return (
      <div className="glass-panel flex items-center gap-2 rounded-2xl p-4 text-xs text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando faturamento por marketplace...
      </div>
    )
  }

  const rows = (data?.byMarketplace ?? []).filter((m) => m.grossRevenue > 0).sort((a, b) => b.grossRevenue - a.grossRevenue)

  if (rows.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-xs text-text-muted">
        Nenhum marketplace com pedido pago sincronizado ainda neste período.
      </div>
    )
  }

  const totalGross = rows.reduce((sum, r) => sum + r.grossRevenue, 0)

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <h3 className="mb-1 text-sm font-semibold text-text-primary">GMV</h3>
      <p className="mb-3 text-[11px] text-text-muted">Faturamento por marketplace</p>
      <div className="flex flex-col divide-y divide-border-subtle">
        {rows.map((row, i) => {
          const color = getMarketplaceColor(row.marketplace)
          const share = totalGross > 0 ? (row.grossRevenue / totalGross) * 100 : 0
          const feePct = row.grossRevenue > 0 ? (row.fees / row.grossRevenue) * 100 : 0
          const growing = (row.growth.d30 ?? 0) >= 0
          return (
            <div key={row.marketplace} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:gap-4">
              <div className="flex w-6 shrink-0 items-center justify-center">
                {i === 0 ? <Crown className="h-4 w-4 text-accent-amber" /> : <span className="text-[12px] font-semibold text-text-muted">{i + 1}</span>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 truncate text-[13px] font-medium text-text-primary">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    {row.marketplace}
                  </span>
                  <span className="shrink-0 text-[13px] font-semibold text-text-primary">R$ {brl(row.grossRevenue)}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-bg-card">
                  <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: color }} />
                </div>
                <p className="mt-1 text-[10px] text-text-muted">{share.toFixed(1)}% faturamento</p>
              </div>
              <div className="flex shrink-0 items-center gap-4 sm:pl-2">
                <span className="flex flex-col items-center">
                  <span className="text-[12px] font-semibold text-text-secondary">R$ {brl(row.averageTicket)}</span>
                  <span className="text-[9px] text-text-muted">ticket médio</span>
                </span>
                <span className="flex flex-col items-center">
                  <span className="text-[12px] font-semibold text-text-secondary">{feePct.toFixed(1)}%</span>
                  <span className="text-[9px] text-text-muted">comissão</span>
                </span>
                <div className="flex items-center gap-2.5 border-l border-border-subtle pl-3">
                  <GrowthChip label="D-1" value={row.growth.d1} />
                  <GrowthChip label="D-7" value={row.growth.d7} />
                  <GrowthChip label="D-30" value={row.growth.d30} />
                  <GrowthChip label="D-365" value={row.growth.d365} />
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${growing ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                  {growing ? 'Crescimento' : 'Queda'}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
