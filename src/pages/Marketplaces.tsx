import ChannelHeader from '@/components/marketplaces/ChannelHeader'
import ChannelKPIVerdict from '@/components/marketplaces/ChannelKPIVerdict'
import ChannelDiagnostic from '@/components/marketplaces/ChannelDiagnostic'
import ChannelDeepComparison from '@/components/marketplaces/ChannelDeepComparison'
import RevenueByChannelChart from '@/components/marketplaces/RevenueByChannelChart'
import ChannelMiniCharts from '@/components/marketplaces/ChannelMiniCharts'
import ChannelAlerts from '@/components/marketplaces/ChannelAlerts'
import OpportunitiesByMarketplace from '@/components/marketplaces/OpportunitiesByMarketplace'
import TopProductByChannel from '@/components/marketplaces/TopProductByChannel'
import ChannelConnectionStatus from '@/components/marketplaces/ChannelConnectionStatus'

export default function Marketplaces() {
  return (
    <div className="space-y-3.5">
      {/* E1 — Cabeçalho + KPIs/veredictos */}
      <ChannelHeader />
      <ChannelKPIVerdict />

      {/* E2 — Diagnóstico executivo + E3 — Comparativo profundo */}
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-[1fr_2fr]">
        <ChannelDiagnostic />
        <ChannelDeepComparison />
      </div>

      {/* E4 — Gráficos úteis: hero + mini multiples */}
      <RevenueByChannelChart />
      <ChannelMiniCharts />

      {/* E5 — Alertas e oportunidades acionáveis */}
      <div className="grid grid-cols-1 gap-3.5 xl:grid-cols-2">
        <ChannelAlerts />
        <OpportunitiesByMarketplace />
      </div>

      {/* E6 — Produtos destaque por canal */}
      <TopProductByChannel />

      {/* E7 — Status de conexão, apoio secundário */}
      <ChannelConnectionStatus />
    </div>
  )
}
