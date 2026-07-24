import { CheckCircle, RefreshCw, Package, ShoppingCart } from 'lucide-react'
import { marketplaceConnections, getMarketplaceColor } from '@/data/mockData'

export default function MarketplaceStatus() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-7">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-text-primary">Marketplaces Conectados</h3>
          <p className="text-sm text-text-muted">Status de sincronização</p>
        </div>
        <button className="flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-bg-secondary px-3 text-xs font-medium text-text-secondary transition-colors hover:text-text-primary">
          <RefreshCw className="h-3.5 w-3.5" />
          Sincronizar
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
        {marketplaceConnections.map((mp) => {
          const color = getMarketplaceColor(mp.name)
          return (
            <div
              key={mp.name}
              className="rounded-xl border border-border-subtle/50 p-4 transition-all duration-200 hover:border-border-default hover:bg-bg-card-hover"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: color }}
                  />
                  <span className="text-sm font-semibold text-text-primary">{mp.name}</span>
                </div>
                <CheckCircle className="h-4 w-4 text-accent-emerald" />
              </div>

              <div className="mb-2 text-xs text-text-muted">
                Última sinc: <span className="text-text-secondary">{mp.lastSync}</span>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1 text-text-secondary">
                  <Package className="h-3 w-3 text-text-muted" />
                  {mp.products} produtos
                </div>
                <div className="flex items-center gap-1 text-text-secondary">
                  <ShoppingCart className="h-3 w-3 text-text-muted" />
                  {mp.orders} pedidos
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
