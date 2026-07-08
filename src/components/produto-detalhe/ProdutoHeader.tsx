import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMarketplaceColor, type Product, type ProductStatus } from '@/data/mockData'

const statusConfig: Record<ProductStatus, { color: string; bg: string; border: string }> = {
  'Saudável': { color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  'Atenção': { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  'Crítico': { color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
  'Parado': { color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20' },
}

export default function ProdutoHeader({ product, status }: { product: Product; status: ProductStatus }) {
  const navigate = useNavigate()
  const mp = getMarketplaceColor(product.marketplace)
  const cfg = statusConfig[status]

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <button
        onClick={() => navigate(-1)}
        className="mb-3 flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </button>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="break-words text-lg font-bold tracking-tight text-text-primary sm:text-xl">{product.name}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
            <span className="font-mono">{product.sku}</span>
            <span>·</span>
            <span>{product.category}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5 font-medium" style={{ color: mp }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
              {product.marketplace}
            </span>
          </div>
        </div>
        <span className={`shrink-0 self-start rounded-full border px-3 py-1.5 text-[12px] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
          {status}
        </span>
      </div>
    </div>
  )
}
