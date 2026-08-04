import KPICards from '@/components/dashboard/KPICards'
import MarketplaceComparison from '@/components/dashboard/MarketplaceComparison'
import { usePeriod } from '@/contexts/PeriodContext'
import PageHeader from '@/components/layout/PageHeader'

export default function Dashboard() {
  const { period } = usePeriod()

  return (
    <div className="space-y-2">
      <PageHeader />
      {/* KPIs com hierarquia: hero Bruto + secundários */}
      <div className="motion-block-in">
        <KPICards period={period} />
      </div>

      {/* Comparativo (GMV) */}
      <div className="motion-block-in motion-block-in-2">
        <MarketplaceComparison />
      </div>
    </div>
  )
}
