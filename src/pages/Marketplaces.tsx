import MarketplaceStats from '@/components/marketplaces/MarketplaceStats'
import PerformanceRanking from '@/components/marketplaces/PerformanceRanking'
import OpportunitiesByMarketplace from '@/components/marketplaces/OpportunitiesByMarketplace'

export default function Marketplaces() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <MarketplaceStats />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <PerformanceRanking />
        <OpportunitiesByMarketplace />
      </div>
    </div>
  )
}
