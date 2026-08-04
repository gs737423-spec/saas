import ChannelKPIVerdict from '@/components/marketplaces/ChannelKPIVerdict'
import RevenueByChannelChart from '@/components/marketplaces/RevenueByChannelChart'
import ChannelMiniCharts from '@/components/marketplaces/ChannelMiniCharts'
import PageHeader from '@/components/layout/PageHeader'

export default function Marketplaces() {
  return (
    <div className="space-y-2">
      <PageHeader />
      {/* KPIs/veredictos */}
      <div className="motion-block-in">
        <ChannelKPIVerdict />
      </div>

      {/* Gráfico com profundidade + small multiples, um único painel */}
      <div className="motion-block-in motion-block-in-2">
        <RevenueByChannelChart />
      </div>
      <div className="overview-glass motion-panel motion-block-in motion-block-in-3 rounded-2xl p-3.5 sm:p-4">
        <ChannelMiniCharts />
      </div>
    </div>
  )
}
