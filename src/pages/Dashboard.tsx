import KPICards from '@/components/dashboard/KPICards'
import MarketplaceComparison from '@/components/dashboard/MarketplaceComparison'
import { usePeriod } from '@/contexts/PeriodContext'

export default function Dashboard() {
  const { period } = usePeriod()

  return (
    <div className="space-y-2">
      {/* KPIs com hierarquia: hero Bruto + secundários */}
      <KPICards period={period} />

      {/* Comparativo (GMV) */}
      <MarketplaceComparison />
    </div>
  )
}
