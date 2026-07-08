import KPICards from '@/components/dashboard/KPICards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import ProductPerformance from '@/components/dashboard/ProductPerformance'
import PerformanceSummary from '@/components/dashboard/PerformanceSummary'
import Opportunities from '@/components/dashboard/Opportunities'
import AlertsPanel from '@/components/dashboard/AlertsPanel'
import MarketplaceStatus from '@/components/dashboard/MarketplaceStatus'

export default function Dashboard() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <KPICards />

      {/* Flagship performance block: horizontal ranking + summary rail */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <ProductPerformance />
        <PerformanceSummary />
      </div>

      {/* Monthly revenue + connected marketplaces */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <MarketplaceStatus />
      </div>

      {/* Marketplace opportunities + intelligent alerts */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Opportunities />
        <AlertsPanel />
      </div>
    </div>
  )
}
