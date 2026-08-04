import { useEffect, useState } from 'react'
import InventoryKPIs from '@/components/estoque/InventoryKPIs'
import InventoryTable from '@/components/estoque/InventoryTable'
import RealInventoryTable from '@/components/estoque/RealInventoryTable'
import { defaultInventoryFilters, type InventoryFilterState } from '@/components/estoque/InventoryFilters'
import type { DashboardInventoryResponse } from '@/server/integrations/types'

export default function Estoque() {
  const [filters, setFilters] = useState<InventoryFilterState>(defaultInventoryFilters)
  const [inventory, setInventory] = useState<DashboardInventoryResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/dashboard/inventory')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: DashboardInventoryResponse | null) => {
        if (!cancelled) setInventory(data)
      })
      .catch(() => {
        if (!cancelled) setInventory(null)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const source = inventory?.source ?? 'demo'
  const showRealTable = source === 'real' && inventory && inventory.items.length > 0

  return (
    <div className="space-y-2 sm:space-y-2.5">
      {showRealTable ? (
        <RealInventoryTable items={inventory.items} />
      ) : (
        <>
          <div className="motion-block-in">
            <InventoryKPIs filters={filters} onChange={setFilters} />
          </div>
          <div className="motion-block-in motion-block-in-2">
            <InventoryTable filters={filters} onChange={setFilters} />
          </div>
        </>
      )}
    </div>
  )
}
