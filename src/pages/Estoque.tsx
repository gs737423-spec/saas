import { useState } from 'react'
import InventoryKPIs from '@/components/estoque/InventoryKPIs'
import InventoryTable from '@/components/estoque/InventoryTable'
import InventoryAlerts from '@/components/estoque/InventoryAlerts'
import { defaultInventoryFilters, type InventoryFilterState } from '@/components/estoque/InventoryFilters'

export default function Estoque() {
  const [filters, setFilters] = useState<InventoryFilterState>(defaultInventoryFilters)

  return (
    <div className="space-y-3 sm:space-y-4">
      <InventoryKPIs filters={filters} onChange={setFilters} />
      <InventoryTable filters={filters} onChange={setFilters} />
      <InventoryAlerts />
    </div>
  )
}
