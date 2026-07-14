import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Star } from 'lucide-react'
import { marketplaceMetrics, getTopProductByMarketplace, getMarketplaceColor } from '@/data/mockData'

export default function TopProductByChannel() {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Produtos Destaque por Canal</h3>
        <p className="mt-0.5 text-xs text-text-muted">Produto de maior faturamento em cada marketplace</p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {marketplaceMetrics.map((m) => {
          const product = getTopProductByMarketplace(m.marketplace)
          const mp = getMarketplaceColor(m.marketplace)
          if (!product) return null
          const positive = product.trend >= 0
          return (
            <div key={m.marketplace} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ background: mp }} />
                <span className="text-[11px] font-semibold uppercase tracking-wider text-text-muted">{m.marketplace}</span>
                <Star className="ml-auto h-3.5 w-3.5 text-accent-amber" />
              </div>
              <Link to={`/app/produto/${product.sku}`} className="block truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">
                {product.name}
              </Link>
              <span className="mt-0.5 block font-mono text-[10px] text-text-muted">{product.sku}</span>
              <div className="mt-2.5 flex items-center justify-between border-t border-border-subtle/50 pt-2.5">
                <span className="font-mono text-[13px] font-semibold text-text-primary">R$ {product.revenue.toLocaleString('pt-BR')}</span>
                <span className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{product.trend}%
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
