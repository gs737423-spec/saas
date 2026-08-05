import { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import InventoryKPIs from '@/components/estoque/InventoryKPIs'
import InventoryTable from '@/components/estoque/InventoryTable'
import RealInventoryTable from '@/components/estoque/RealInventoryTable'
import { defaultInventoryFilters, type InventoryFilterState } from '@/components/estoque/InventoryFilters'
import type { DashboardInventoryResponse } from '@/server/integrations/types'
import { apiFetchJson } from '@/lib/apiFetch'

export default function Estoque() {
  const [filters, setFilters] = useState<InventoryFilterState>(defaultInventoryFilters)
  const [inventory, setInventory] = useState<DashboardInventoryResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<DashboardInventoryResponse>('/api/dashboard/inventory').then((data) => {
      if (!cancelled) setInventory(data)
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
          {source === 'demo' && (
            <div className="flex items-center gap-2 rounded-lg border border-accent-amber/25 bg-accent-amber/10 px-3 py-2 text-xs font-medium text-accent-amber">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              Dados de demonstração — conecte um marketplace em Conexões pra ver o estoque real.
            </div>
          )}
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
