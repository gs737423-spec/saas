import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
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

/** Substitui o antigo MarketplaceComparison (100% mock, com "crescimento"
 *  D-1/D-7/D-30/D-365 fabricado matematicamente a partir de um número
 *  inventado). Reaproveita /api/dashboard/finance — mesmo dado real que já
 *  alimenta a página Financeiro — sem inventar tendência que não temos
 *  histórico suficiente pra calcular ainda. */
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
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">GMV por marketplace</h3>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const color = getMarketplaceColor(row.marketplace)
          const share = totalGross > 0 ? (row.grossRevenue / totalGross) * 100 : 0
          const feePct = row.grossRevenue > 0 ? (row.fees / row.grossRevenue) * 100 : 0
          return (
            <div key={row.marketplace} className="flex items-center gap-3">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 text-[12px]">
                  <span className="font-medium text-text-primary">{row.marketplace}</span>
                  <span className="font-semibold text-text-primary">R$ {brl(row.grossRevenue)}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-bg-card">
                  <div className="h-full rounded-full" style={{ width: `${share}%`, backgroundColor: color }} />
                </div>
                <div className="mt-1 flex items-center gap-3 text-[10px] text-text-muted">
                  <span>{share.toFixed(1)}% do bruto</span>
                  <span>{feePct.toFixed(1)}% comissão</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
