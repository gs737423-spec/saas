import { useCallback, useEffect, useState } from 'react'
import { Loader2, Boxes } from 'lucide-react'
import RealInventoryTable, { type InventoryServerQuery } from '@/components/estoque/RealInventoryTable'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import type { DashboardInventoryResponse } from '@/server/integrations/types'
import { apiFetchJson } from '@/lib/apiFetch'

export default function Estoque() {
  const [inventory, setInventory] = useState<DashboardInventoryResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState<InventoryServerQuery>({
    page: 1,
    sort: 'revenue',
    abc: [],
    marketplace: 'all',
    categories: [],
    onlyCritical: false,
    onlyStalled: false,
    onlyLowCoverage: false,
    onlyExcess: false,
  })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams({
      page: String(query.page), page_size: '100', sort: query.sort,
      abc: JSON.stringify(query.abc), categories: JSON.stringify(query.categories),
      marketplace: query.marketplace, only_critical: String(query.onlyCritical),
      only_stalled: String(query.onlyStalled), only_low_coverage: String(query.onlyLowCoverage),
      only_excess: String(query.onlyExcess),
    })
    apiFetchJson<DashboardInventoryResponse>(`/api/dashboard/inventory?${params}`).then((data) => {
      if (!cancelled) {
        setInventory(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [query])

  const handleServerQueryChange = useCallback((next: InventoryServerQuery) => {
    setQuery((current) => {
      const same = current.page === next.page && current.sort === next.sort
        && current.marketplace === next.marketplace && current.onlyCritical === next.onlyCritical
        && current.onlyStalled === next.onlyStalled && current.onlyLowCoverage === next.onlyLowCoverage
        && current.onlyExcess === next.onlyExcess && current.abc.join('|') === next.abc.join('|')
        && current.categories.join('|') === next.categories.join('|')
      return same ? current : next
    })
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (inventory?.source === 'real' && (inventory.pagination?.totalRows ?? inventory.items.length) === 0) {
    return <ConnectMarketplacePrompt icon={Boxes} title="Estoque ainda não disponível" description="A conexão está ativa e o estoque real está sendo sincronizado. Nenhum valor ilustrativo será exibido enquanto isso." />
  }

  if (inventory?.source === 'error' || inventory?.source === 'config_missing') {
    return <ConnectMarketplacePrompt icon={Boxes} title="Não foi possível carregar o estoque agora" description={'A conexão pode continuar com dados sincronizados. Tente novamente em instantes; nenhum registro foi removido.'} />
  }

  if (!inventory || (inventory.source !== 'real' && inventory.source !== 'demo') || (inventory.pagination?.totalRows ?? inventory.items.length) === 0) {
    return <ConnectMarketplacePrompt icon={Boxes} title="Conecte um marketplace pra ver seu estoque" description="Assim que sincronizar o Mercado Livre, o estoque real de cada produto aparece aqui." />
  }

  return (
    <div className="workspace-page workspace-page--inventory">
      <RealInventoryTable
        items={inventory.items}
        serverPage={inventory.pagination}
        serverMetrics={inventory.metrics}
        serverCategoryOptions={inventory.categoryOptions}
        onServerQueryChange={handleServerQueryChange}
      />
    </div>
  )
}
