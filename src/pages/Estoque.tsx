import InventoryKPIs from '@/components/estoque/InventoryKPIs'
import InventoryTable from '@/components/estoque/InventoryTable'
import InventoryAlerts from '@/components/estoque/InventoryAlerts'

export default function Estoque() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <InventoryKPIs />
      <InventoryTable />
      <InventoryAlerts />
    </div>
  )
}
