import ChannelKPIVerdict from '@/components/marketplaces/ChannelKPIVerdict'
import RevenueByChannelChart from '@/components/marketplaces/RevenueByChannelChart'
import ChannelMiniCharts from '@/components/marketplaces/ChannelMiniCharts'

export default function Marketplaces() {
  return (
    <div className="space-y-2">
      {/* KPIs/veredictos */}
      <ChannelKPIVerdict />

      {/* Gráfico com profundidade + small multiples, um único painel */}
      <RevenueByChannelChart />
      <div className="overview-glass rounded-2xl p-3.5 sm:p-4">
        <ChannelMiniCharts />
      </div>
    </div>
  )
}
