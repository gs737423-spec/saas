import { useEffect, useMemo, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { getCategoryMetrics, type CategorySourceItem } from '@/lib/categoryAnalytics'

interface Props {
  categoryKey: string | null
  products: CategorySourceItem[]
  onClose: () => void
}

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export default function CategoryDrawer({ categoryKey, products, onClose }: Props) {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const [search, setSearch] = useState('')
  const metrics = useMemo(() => categoryKey ? getCategoryMetrics(products, categoryKey) : null, [categoryKey, products])

  useEffect(() => {
    if (!categoryKey) return
    previousFocusRef.current = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>('button, input, a[href], [tabindex]:not([tabindex="-1"])')].filter((element) => !element.hasAttribute('disabled'))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [categoryKey])

  useEffect(() => { if (!categoryKey) setSearch('') }, [categoryKey])

  if (!categoryKey || !metrics) return null
  const query = search.trim().toLocaleLowerCase('pt-BR')
  const visibleProducts = query
    ? metrics.products.filter((product) => [product.name, product.sku, product.marketplace].some((value) => value?.toLocaleLowerCase('pt-BR').includes(query)))
    : metrics.products

  return (
    <div className="fixed inset-0 z-[70] bg-black/30" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside ref={panelRef} className="category-drawer ml-auto flex h-full w-full max-w-[560px] flex-col border-l border-border-default bg-bg-elevated shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="category-drawer-title">
        <header className="sticky top-0 z-10 border-b border-border-subtle bg-bg-elevated px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Categoria</p>
              <h2 id="category-drawer-title" className="mt-0.5 truncate text-lg font-semibold text-text-primary">{metrics.label}</h2>
              <p className="mt-1 text-[11.5px] text-text-secondary">{metrics.productCount} {metrics.productCount === 1 ? 'produto' : 'produtos'} · ordenados por faturamento</p>
            </div>
            <button ref={closeRef} type="button" onClick={onClose} className="rounded-lg border border-border-subtle p-2 text-text-muted hover:bg-bg-card-hover hover:text-text-primary" aria-label="Fechar análise da categoria"><X className="h-4 w-4" /></button>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric label="Faturamento" value={money.format(metrics.revenue)} />
            <Metric label="Vendas" value={metrics.units.toLocaleString('pt-BR')} />
            <Metric label="Estoque" value={metrics.stock.toLocaleString('pt-BR')} />
            <Metric label="Produtos" value={metrics.productCount.toLocaleString('pt-BR')} />
          </div>
          {metrics.products.length > 8 && (
            <label className="mt-3 flex h-9 items-center gap-2 rounded-lg border border-border-subtle bg-bg-card px-3 focus-within:border-accent-blue/50">
              <Search className="h-3.5 w-3.5 text-text-muted" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar nesta categoria..." className="min-w-0 flex-1 bg-transparent text-xs font-medium text-text-primary outline-none placeholder:text-text-muted" />
            </label>
          )}
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2 sm:px-5">
          {visibleProducts.length === 0 ? <p className="py-10 text-center text-sm text-text-muted">Nenhum produto encontrado nesta categoria.</p> : visibleProducts.map((product) => (
            <article key={`${product.marketplace}:${product.id}`} className="border-b border-border-subtle py-3 last:border-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[13px] font-semibold text-text-primary" title={product.name}>{product.name}</h3>
                  <p className="mt-0.5 truncate text-[10.5px] text-text-muted">{product.sku ?? 'SKU não informado'} · {product.marketplace}</p>
                </div>
                <p className="shrink-0 font-mono text-[12px] font-semibold text-text-primary">{money.format(product.revenue)}</p>
              </div>
              <div className="mt-2 flex gap-4 text-[10.5px] text-text-secondary">
                <span>Vendas <strong className="font-mono text-text-primary">{product.units?.toLocaleString('pt-BR') ?? '—'}</strong></span>
                <span>Estoque <strong className="font-mono text-text-primary">{product.stock?.toLocaleString('pt-BR') ?? '—'}</strong></span>
              </div>
            </article>
          ))}
        </div>
      </aside>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-lg border border-border-subtle bg-bg-card px-2.5 py-2"><p className="text-[9px] font-semibold uppercase tracking-wider text-text-muted">{label}</p><p className="mt-1 truncate font-mono text-[12px] font-bold text-text-primary" title={value}>{value}</p></div>
}
