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

  if (inventory?.source === 'real' && inventory.items.length === 0) {
    return <ConnectMarketplacePrompt icon={Boxes} title="Estoque ainda não disponível" description="A conexão está ativa e o estoque real está sendo sincronizado. Nenhum valor ilustrativo será exibido enquanto isso." />
  }

  if (inventory?.source === 'error' || inventory?.source === 'config_missing') {
    return <ConnectMarketplacePrompt icon={Boxes} title="Não foi possível carregar o estoque agora" description={'A conexão pode continuar com dados sincronizados. Tente novamente em instantes; nenhum registro foi removido.'} />
  }

  if (!inventory || (inventory.source !== 'real' && inventory.source !== 'demo') || inventory.items.length === 0) {
    return <ConnectMarketplacePrompt icon={Boxes} title="Conecte um marketplace pra ver seu estoque" description="Assim que sincronizar o Mercado Livre, o estoque real de cada produto aparece aqui." />
  }

  return (
    <div className="workspace-page workspace-page--inventory">
      <RealInventoryTable items={inventory.items} />
    </div>
  )
}
