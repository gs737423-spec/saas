import { useEffect, useState } from 'react'
import { Loader2, Store } from 'lucide-react'
import { getMarketplaceColor } from '@/data/mockData'
import type { FinanceOverview, MarketplaceFinance } from '@/data/financeShapes'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import RealMarketplaceBreakdown from '@/components/dashboard/RealMarketplaceBreakdown'
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
      <span className="inline-flex items-center gap-1 rounded-md bg-bg-card px-1.5 py-0.5 text-[10px] font-medium text-text-muted">
        {label} —
      </span>
    )
  }
  const positive = value >= 0
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
      {label} {positive ? '+' : ''}{value.toFixed(1)}%
    </span>
  )
}

export default function Marketplaces() {
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
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  const rows = data?.byMarketplace ?? []

  if (!data || !data.ok || rows.length === 0) {
    return (
      <ConnectMarketplacePrompt
        icon={Store}
        title="Conecte um marketplace pra comparar canais"
        description="Assim que houver pedido pago sincronizado de um marketplace, o comparativo de faturamento, comissão e ticket médio aparece aqui."
      />
    )
  }

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => {
          const color = getMarketplaceColor(row.marketplace)
          const feePct = row.grossRevenue > 0 ? (row.fees / row.grossRevenue) * 100 : 0
          return (
            <div key={row.marketplace} className="glass-panel glass-panel-hover rounded-2xl p-4 sm:p-5">
              <div className="flex items-center gap-2.5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color, boxShadow: `0 0 10px 2px ${color}66` }} />
                <h3 className="text-sm font-semibold text-text-primary">{row.marketplace}</h3>
              </div>
              <p className="mt-3 text-2xl font-bold text-text-primary">R$ {brl(row.grossRevenue)}</p>
              <p className="text-[11px] text-text-muted">Faturamento bruto pago</p>
              <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-subtle pt-3 text-[11px]">
                <div>
                  <span className="text-text-muted">Pedidos</span>
                  <p className="font-semibold text-text-secondary">{row.ordersCount.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <span className="text-text-muted">Ticket médio</span>
                  <p className="font-semibold text-text-secondary">R$ {brl(row.averageTicket)}</p>
                </div>
                <div>
                  <span className="text-text-muted">Comissão</span>
                  <p className="font-semibold text-text-secondary">{feePct.toFixed(1)}%</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5 border-t border-border-subtle pt-3">
                <GrowthChip label="D-1" value={row.growth.d1} />
                <GrowthChip label="D-7" value={row.growth.d7} />
                <GrowthChip label="D-30" value={row.growth.d30} />
                <GrowthChip label="D-365" value={row.growth.d365} />
              </div>
            </div>
          )
        })}
      </div>

      <div className="motion-block-in">
        <RealMarketplaceBreakdown />
      </div>
    </div>
  )
}
