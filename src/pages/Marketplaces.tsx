import CanalKPIs from '@/components/marketplaces/CanalKPIs'
import MarketplaceStats from '@/components/marketplaces/MarketplaceStats'
import RevenueByChannelChart from '@/components/marketplaces/RevenueByChannelChart'
import PerformanceRanking from '@/components/marketplaces/PerformanceRanking'
import OpportunitiesByMarketplace from '@/components/marketplaces/OpportunitiesByMarketplace'
import ChannelConnectionStatus from '@/components/marketplaces/ChannelConnectionStatus'
import TopProductByChannel from '@/components/marketplaces/TopProductByChannel'

export default function Marketplaces() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <CanalKPIs />

      <MarketplaceStats />

      <RevenueByChannelChart />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PerformanceRanking />
        <OpportunitiesByMarketplace />
      </div>

      <ChannelConnectionStatus />

      <TopProductByChannel />
    </div>
  )
}
