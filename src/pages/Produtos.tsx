import ProductFilters from '@/components/produtos/ProductFilters'
import ProductKPIs from '@/components/produtos/ProductKPIs'
import ProductTable from '@/components/produtos/ProductTable'
import Top5Products from '@/components/produtos/Top5Products'
import CategoryPerformance from '@/components/produtos/CategoryPerformance'
import ProductAlerts from '@/components/produtos/ProductAlerts'
import ProductOpportunities from '@/components/produtos/ProductOpportunities'

export default function Produtos() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <ProductFilters />

      <ProductKPIs />

      {/* Main table + side intelligence rail */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <ProductTable />
        <div className="flex flex-col gap-4">
          <Top5Products />
          <ProductAlerts />
        </div>
      </div>

      {/* Category performance + product opportunities */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CategoryPerformance />
        <ProductOpportunities />
      </div>
    </div>
  )
}
