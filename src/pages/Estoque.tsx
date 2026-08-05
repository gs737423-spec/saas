import { useEffect, useState } from 'react'
import { Loader2, Boxes } from 'lucide-react'
import RealInventoryTable from '@/components/estoque/RealInventoryTable'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import type { DashboardInventoryResponse } from '@/server/integrations/types'
import { apiFetchJson } from '@/lib/apiFetch'

export default function Estoque() {
  const [inventory, setInventory] = useState<DashboardInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<DashboardInventoryResponse>('/api/dashboard/inventory').then((data) => {
      if (!cancelled) {
        setInventory(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (!inventory || inventory.source !== 'real' || inventory.items.length === 0) {
    return <ConnectMarketplacePrompt icon={Boxes} title="Conecte um marketplace pra ver seu estoque" description="Assim que sincronizar o Mercado Livre, o estoque real de cada produto aparece aqui." />
  }

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <RealInventoryTable items={inventory.items} />
    </div>
  )
}
