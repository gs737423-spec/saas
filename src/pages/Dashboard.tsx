import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import KPICards from '@/components/dashboard/KPICards'
import MarketplaceComparison from '@/components/dashboard/MarketplaceComparison'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'
import type { DashboardSummary } from '@/server/integrations/types'
import type { OverviewKpi } from '@/data/mockData'

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Constrói os 5 KPIs a partir do resumo real de orders/order_items — mesma
// forma que o mock (OverviewKpi), só que sem escala/jitter e sem comparação
// (change: null, ver KPICards.Delta) porque não temos período anterior
// agregado ainda. tag 'dado real' faz o KPICards pular o resolveKpi mock.
function buildRealKpis(s: DashboardSummary): OverviewKpi[] {
  return [
    { key: 'gross', label: 'Faturamento Bruto', value: brl(s.grossRevenue), raw: s.grossRevenue, scalesWithPeriod: true, prefix: 'R$', change: null, context: '', tag: 'dado real', tone: 'cyan', hero: true },
    { key: 'orders', label: 'Pedidos', value: s.ordersCount.toLocaleString('pt-BR'), raw: s.ordersCount, scalesWithPeriod: true, change: null, context: 'Volume consolidado', tag: 'dado real', tone: 'blue' },
    { key: 'ticket', label: 'Ticket Médio', value: brl(s.averageTicket), raw: s.averageTicket, scalesWithPeriod: false, prefix: 'R$', change: null, context: 'Bruto por pedido', tag: 'dado real', tone: 'violet' },
    { key: 'fees', label: 'Comissão', value: brl(s.feesTotal), raw: s.feesTotal, scalesWithPeriod: true, prefix: 'R$', change: null, context: s.grossRevenue > 0 ? `${((s.feesTotal / s.grossRevenue) * 100).toFixed(1)}% do bruto` : '', tag: 'dado real', tone: 'amber' },
    { key: 'returns', label: 'Devoluções', value: brl(s.returnsAmount), raw: s.returnsAmount, scalesWithPeriod: true, prefix: 'R$', change: null, context: `${s.returnsCount.toLocaleString('pt-BR')} pedidos`, tag: 'dado real', tone: 'neutral' },
  ]
}

export default function Dashboard() {
  const { period } = usePeriod()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<DashboardSummary>(`/api/dashboard/summary?days=${period.days}`).then((data) => {
      if (!cancelled) setSummary(data)
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  const isReal = summary?.source === 'real'
  const kpis = isReal ? buildRealKpis(summary!) : undefined

  return (
    <div className="space-y-2">
      {summary && summary.source === 'demo' && (
        <div className="flex items-center gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-xs font-medium text-accent-amber">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Dados de demonstração — conecte um marketplace em Conexões pra ver o faturamento real.
        </div>
      )}

      {/* KPIs com hierarquia: hero Bruto + secundários */}
      <div className="motion-block-in">
        <KPICards period={period} kpis={kpis} />
      </div>

      {/* Comparativo (GMV) — ainda mock, depende de histórico por canal que não existe hoje */}
      <div className="motion-block-in motion-block-in-2">
        <MarketplaceComparison />
      </div>
    </div>
  )
}
