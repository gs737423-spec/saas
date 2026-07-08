import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getMarketplaceColor, getProductHealthSummary, type Product, type ProductStatus, type StockItem } from '@/data/mockData'

const statusConfig: Record<ProductStatus, { color: string; bg: string; border: string; dot: string }> = {
  'Saudável': { color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20', dot: '#16C784' },
  'Atenção': { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20', dot: '#F5C24B' },
  'Crítico': { color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20', dot: '#F4436C' },
  'Parado': { color: 'text-accent-violet', bg: 'bg-accent-violet/10', border: 'border-accent-violet/20', dot: '#9061F9' },
}

export default function ProdutoHeader({ product, status, stock }: { product: Product; status: ProductStatus; stock: StockItem | undefined }) {
  const navigate = useNavigate()
  const mp = getMarketplaceColor(product.marketplace)
  const cfg = statusConfig[status]
  const summary = getProductHealthSummary(product, status, stock)

  return (
    <div className="glass-panel glass-panel-hover relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full opacity-50 blur-3xl"
        style={{ background: `radial-gradient(circle, ${cfg.dot}35, transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-70"
        style={{ background: `linear-gradient(90deg, transparent, ${cfg.dot}, transparent)` }}
      />

      <button
        onClick={() => navigate(-1)}
        className="relative mb-4 flex items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[12px] font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar
      </button>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="break-words text-xl font-bold tracking-tight text-text-primary sm:text-2xl">{product.name}</h1>
            <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${cfg.color} ${cfg.bg} ${cfg.border}`}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.dot }} />
              {status}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] text-text-muted">
            <span className="font-mono">{product.sku}</span>
            <span>·</span>
            <span>{product.category}</span>
            <span>·</span>
            <span className="flex items-center gap-1.5 font-medium" style={{ color: mp }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
              {product.marketplace}
            </span>
          </div>

          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-text-secondary">{summary}</p>
        </div>
      </div>
    </div>
  )
}
