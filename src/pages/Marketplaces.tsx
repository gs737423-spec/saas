import ChannelHeader from '@/components/marketplaces/ChannelHeader'
import ChannelKPIVerdict from '@/components/marketplaces/ChannelKPIVerdict'
import ChannelDiagnostic from '@/components/marketplaces/ChannelDiagnostic'
import ChannelDeepComparison from '@/components/marketplaces/ChannelDeepComparison'
import RevenueByChannelChart from '@/components/marketplaces/RevenueByChannelChart'
import ChannelMiniCharts from '@/components/marketplaces/ChannelMiniCharts'
import OpportunitiesByMarketplace from '@/components/marketplaces/OpportunitiesByMarketplace'
import TopProductByChannel from '@/components/marketplaces/TopProductByChannel'
import ChannelConnectionStatus from '@/components/marketplaces/ChannelConnectionStatus'

export default function Marketplaces() {
  return (
    <div className="space-y-3">
      {/* Cabeçalho + KPIs/veredictos */}
      <ChannelHeader />
      <ChannelKPIVerdict />

      {/* Diagnóstico executivo + Comparativo profundo */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_2fr]">
        <ChannelDiagnostic />
        <ChannelDeepComparison />
      </div>

      {/* Gráfico com profundidade + small multiples, um único painel */}
      <RevenueByChannelChart />
      <div className="overview-glass rounded-2xl p-3.5 sm:p-4">
        <ChannelMiniCharts />
      </div>

      {/* Oportunidades + Produtos destaque lado a lado */}
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <OpportunitiesByMarketplace />
        <TopProductByChannel />
      </div>

      {/* Status de conexão, apoio secundário */}
      <ChannelConnectionStatus />
    </div>
  )
}
