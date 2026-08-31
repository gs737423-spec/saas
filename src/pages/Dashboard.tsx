import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import KPICards from '@/components/dashboard/KPICards'
import RealMarketplaceBreakdown from '@/components/dashboard/RealMarketplaceBreakdown'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'
import type { DashboardSummary } from '@/server/integrations/types'
import type { OverviewKpi } from '@/data/mockData'

const brl = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Constrói os 5 KPIs a partir do resumo real de orders/order_items — mesma
// forma que o mock (OverviewKpi), só que sem escala/jitter. change vem da
// comparação real com o período anterior de mesma duração (null quando não
// há pedido pago no período anterior pra comparar). Os KPIs reais entram sem
// selo visual: a origem já é garantida pelo contrato da API, não precisa
// disputar espaço com o número que o cliente veio consultar.
function buildRealKpis(s: DashboardSummary): OverviewKpi[] {
  return [
    { key: 'gross', label: 'Faturamento Bruto', value: brl(s.grossRevenue), raw: s.grossRevenue, scalesWithPeriod: true, prefix: 'R$', change: s.grossRevenueChangePct, context: '', tone: 'cyan', hero: true },
    { key: 'orders', label: 'Pedidos', value: s.ordersCount.toLocaleString('pt-BR'), raw: s.ordersCount, scalesWithPeriod: true, change: s.ordersCountChangePct, context: 'Volume consolidado', tone: 'blue' },
    { key: 'ticket', label: 'Ticket Médio', value: brl(s.averageTicket), raw: s.averageTicket, scalesWithPeriod: false, prefix: 'R$', change: null, context: 'Bruto por pedido', tone: 'violet' },
    { key: 'returns', label: 'Estornos e Devoluções', value: brl(s.returnsAmount), raw: s.returnsAmount, scalesWithPeriod: true, prefix: 'R$', change: null, context: s.refundDataStatus === 'known' ? `${s.returnsCount.toLocaleString('pt-BR')} pedidos` : 'A integração não informou reembolsos', tone: 'neutral', unavailable: s.refundDataStatus !== 'known' },
  ]
}

export default function Dashboard() {
  const { period } = usePeriod()
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<DashboardSummary>(`/api/dashboard/summary?${period.query}`).then((data) => {
      if (!cancelled) {
        setSummary(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.query])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  // Empresa nunca conectou/sincronizou nada ainda — nenhum número
  // ilustrativo aparece, só o caminho pra conectar. "Demonstração com
  // banner" foi trocado por vazio real (ver decisão 2026-08-05).
  if (!summary || (summary.source !== 'real' && summary.source !== 'demo')) {
    return <ConnectMarketplacePrompt />
  }

  const kpis = buildRealKpis(summary)

  return (
    <div className="workspace-page workspace-page--overview">
      {/* KPIs com hierarquia: hero Bruto + secundários */}
      <div className="motion-block-in">
        <KPICards period={period} kpis={kpis} />
      </div>

      <div className="motion-block-in motion-block-in-2 workspace-primary-panel">
        <RealMarketplaceBreakdown />
      </div>
    </div>
  )
}
