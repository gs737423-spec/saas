import { useCallback, useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMarketplaceColor, getMarketplaceBadge } from '@/data/mockData'
import type { DashboardProduct as Product } from '@/server/dashboardProducts'
import ProductFilters, { type ProductFilterState } from './ProductFilters'
import DataTableViewport from '@/components/common/DataTableViewport'
import PaginationBar from '@/components/common/PaginationBar'
import { useTheme } from '@/contexts/ThemeContext'
import CategoryDrawer from '@/components/category/CategoryDrawer'
import type { CategoryOption } from '@/lib/categoryAnalytics'
import { categoryKey, categoryLabel } from '@/lib/categoryAnalytics'
import { categoryItemFromProduct } from '@/lib/categoryAdapters'
import { exactProductPath } from '@/lib/routes'

type SortKey = 'sku' | 'name' | 'marketplace' | 'units' | 'stock' | 'revenue' | 'margin' | 'trend'
type SortDir = 'asc' | 'desc'

/** null vira "sem dado" — nunca menor nem maior que os demais na ordenação,
 *  sempre vai pro fim independente da direção. */
function compareNullable(a: number | null, b: number | null): number {
  if (a === null && b === null) return 0
  if (a === null) return -1
  if (b === null) return 1
  return a - b
}

function TrendBadge({ trend }: { trend: number | null }) {
  if (trend === null) return <span className="font-mono text-[11px] text-text-muted">—</span>
  const positive = trend >= 0
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '+' : ''}{trend.toFixed(1)}%
    </span>
  )
}

function GrowthCell({ label, value }: { label: string; value: number | null }) {
  if (value === null) {
    return (
      <div className="flex w-11 shrink-0 flex-col items-center gap-0.5">
        <span className="font-mono text-[11px] font-bold text-text-muted">—</span>
        <span className="text-[8px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
      </div>
    )
  }
  const positive = value >= 0
  return (
    <div className="flex w-11 shrink-0 flex-col items-center gap-0.5">
      <span className={`font-mono text-[11px] font-bold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
        {positive ? '+' : ''}{value}%
      </span>
      <span className="text-[8px] font-semibold uppercase tracking-wider text-text-muted">{label}</span>
    </div>
  )
}

function MarginCell({ product, editable, onSetCost }: { product: Product; editable: boolean; onSetCost?: (product: Product, costPrice: number) => Promise<void> }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const margin = product.margin

  async function save() {
    if (saving) return
    const parsed = Number(value.replace(',', '.'))
    if (!Number.isFinite(parsed) || parsed < 0 || !onSetCost) return
    setSaving(true)
    try {
      await onSetCost(product, parsed)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="flex items-center justify-center gap-1">
        <span className="text-[11px] text-text-muted">R$</span>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
          placeholder="custo"
          className="w-16 rounded border border-border-subtle bg-bg-primary/60 px-1.5 py-0.5 text-[11px] text-text-primary focus:border-accent-primary/50 focus:outline-none"
        />
        <button type="button" onClick={save} disabled={saving} className="text-[11px] font-medium text-accent-primary disabled:opacity-40">
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : 'ok'}
        </button>
      </div>
    )
  }

  if (margin === null) {
    if (!editable) return <span className="text-[11px] text-text-muted">sem custo</span>
    return (
      <button type="button" onClick={() => setEditing(true)} className="text-[11px] font-medium text-accent-primary hover:underline" title="Informar custo do produto pra calcular margem">
        definir custo
      </button>
    )
  }
  return (
    <button type="button" onClick={() => editable && setEditing(true)} className={`flex items-center justify-center gap-2 ${editable ? 'cursor-pointer' : 'cursor-default'}`} title={editable ? 'Clique pra editar o custo' : undefined}>
      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-border-subtle">
        <div className="h-full rounded-full bg-accent-emerald" style={{ width: `${Math.max(0, Math.min(100, margin))}%` }} />
      </div>
      <span className="font-mono text-text-secondary">{margin.toFixed(0)}%</span>
    </button>
  )
}

function stockTone(stock: number) {
  if (stock <= 25) return 'text-accent-rose'
  if (stock <= 60) return 'text-accent-amber'
  return 'text-text-secondary'
}

function sortProducts(products: Product[], key: SortKey, dir: SortDir): Product[] {
  const sorted = [...products].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case 'sku': cmp = (a.sku ?? '').localeCompare(b.sku ?? ''); break
      case 'name': cmp = a.name.localeCompare(b.name); break
      case 'marketplace': cmp = a.marketplace.localeCompare(b.marketplace); break
      case 'units': cmp = a.units - b.units; break
      case 'stock': cmp = a.stock - b.stock; break
      case 'revenue': cmp = a.revenue - b.revenue; break
      case 'margin': cmp = compareNullable(a.margin, b.margin); break
      case 'trend': cmp = compareNullable(a.trend, b.trend); break
    }
    return dir === 'asc' ? cmp : -cmp
  })
  return sorted
}

interface Props {
  allProducts: Product[]
  filteredProducts: Product[]
  filters: ProductFilterState
  onFiltersChange: (next: ProductFilterState) => void
  categoryOptions: CategoryOption[]
  /** Edição de custo só faz sentido quando há produto real por trás (linha
   *  em marketplace_products) — no demo não tem o que salvar. */
  editable?: boolean
  onSetCost?: (product: Product, costPrice: number) => Promise<void>
  /** Quando presente, a ordenação e a paginação já foram feitas no banco. */
  serverPage?: { page: number; totalPages: number; totalRows: number; pageSize: number }
  serverSort?: { key: SortKey; dir: SortDir }
  onServerSortChange?: (key: SortKey, dir: SortDir) => void
  onServerPageChange?: (page: number) => void
}

const columns: { key: SortKey; label: string; align?: 'right' | 'center' }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Produto' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'units', label: 'Vendas', align: 'center' },
  { key: 'stock', label: 'Estoque', align: 'center' },
  { key: 'revenue', label: 'Faturamento', align: 'center' },
  { key: 'margin', label: 'Margem', align: 'center' },
  { key: 'trend', label: 'Tendência', align: 'center' },
]

export default function ProductTable({ allProducts, filteredProducts, filters, onFiltersChange, categoryOptions, editable = false, onSetCost, serverPage, serverSort, onServerSortChange, onServerPageChange }: Props) {
  const { theme } = useTheme()
  const [localSortKey, setLocalSortKey] = useState<SortKey>('revenue')
  const [localSortDir, setLocalSortDir] = useState<SortDir>('desc')
  const [localPage, setLocalPage] = useState(1)
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null)
  const categoryProducts = useMemo(() => allProducts.map(categoryItemFromProduct), [allProducts])
  const closeCategory = useCallback(() => setSelectedCategoryKey(null), [])
  const sortKey = serverSort?.key ?? localSortKey
  const sortDir = serverSort?.dir ?? localSortDir
  const page = serverPage?.page ?? localPage

  function handleSort(key: SortKey) {
    const nextDir: SortDir = sortKey === key
      ? (sortDir === 'asc' ? 'desc' : 'asc')
      : (key === 'name' || key === 'sku' || key === 'marketplace' ? 'asc' : 'desc')
    if (serverSort && onServerSortChange) {
      onServerSortChange(key, nextDir)
      return
    }
    if (sortKey === key) {
      setLocalSortDir(nextDir)
    } else {
      setLocalSortKey(key)
      setLocalSortDir(nextDir)
    }
  }

  const sorted = serverPage ? filteredProducts : sortProducts(filteredProducts, sortKey, sortDir)
  const pageSize = 100
  const totalPages = serverPage?.totalPages ?? Math.max(1, Math.ceil(sorted.length / pageSize))
  const totalRows = serverPage?.totalRows ?? sorted.length
  const visibleProducts = serverPage ? sorted : sorted.slice((Math.min(page, totalPages) - 1) * pageSize, Math.min(page, totalPages) * pageSize)

  useEffect(() => {
    if (!serverPage) setLocalPage(1)
  }, [filters, sortKey, sortDir, serverPage])

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-blue" /> : <ArrowDown className="h-3 w-3 text-accent-blue" />
  }

  const sortLabel = columns.find((c) => c.key === sortKey)?.label ?? ''

  return (
    <div className="glass-panel motion-panel workspace-table-panel workspace-product-table rounded-2xl p-4 sm:p-5">
      <div className="workspace-panel-header mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Catalogo de Produtos</h3>
          <p className="mt-0.5 text-xs text-text-muted">{totalRows} produtos · vendas, estoque, margem e tendencia</p>
        </div>
        <button
          type="button"
          onClick={() => {
            const nextDir: SortDir = sortDir === 'asc' ? 'desc' : 'asc'
            if (serverSort && onServerSortChange) onServerSortChange(sortKey, nextDir)
            else setLocalSortDir(nextDir)
          }}
          title="Inverter ordem"
          className="control-active motion-chip hidden cursor-pointer items-center gap-1.5 rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[11px] font-medium text-text-secondary hover:border-border-default hover:text-text-primary sm:inline-flex"
        >
          Ordenado por {sortLabel} {sortDir === 'asc' ? '(crescente)' : '(decrescente)'}
          {sortDir === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        </button>
      </div>

      <div className="workspace-filter-slot mb-3.5">
        <ProductFilters filters={filters} onChange={onFiltersChange} categoryOptions={categoryOptions} />
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {visibleProducts.map((p) => {
          const mp = getMarketplaceColor(p.marketplace)
          return (
            <div key={`${p.connectionId}:${p.id}`} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={exactProductPath(p)} className="block truncate text-[13px] font-semibold leading-relaxed tracking-tight text-text-primary hover:text-accent-blue hover:underline">{p.name}</Link>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-text-muted">{p.sku}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[10px] font-medium" style={{ color: getMarketplaceBadge(p.marketplace, theme).text }}>{p.marketplace}</span>
                  </div>
                  <CategoryTrigger product={p} onOpen={setSelectedCategoryKey} className="mt-1" />
                </div>
                <TrendBadge trend={p.trend} />
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border-subtle/50 pt-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Faturamento</p>
                  <p className="mt-0.5 font-mono text-[13px] font-semibold text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Margem</p>
                  <div className="mt-1"><MarginCell product={p} editable={editable} onSetCost={onSetCost} /></div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Vendas</p>
                  <p className="mt-0.5 font-mono text-[13px] text-text-secondary">{p.units.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Estoque</p>
                  <p className={`mt-0.5 font-mono text-[13px] ${stockTone(p.stock)}`}>{p.stock}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop table */}
      <div className="workspace-table-area hidden md:block">
        <DataTableViewport size="large" ariaLabel="Catálogo de produtos. Role para visualizar mais itens." className="-mx-1 rounded-xl px-1">
        <table className="workspace-data-table enterprise-table w-full min-w-[920px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle bg-bg-secondary/60 text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`group cursor-pointer py-3 pr-4 font-semibold select-none transition-colors hover:text-text-secondary ${col.key === 'trend' ? 'pr-0' : ''} ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : ''}`}
                  onClick={() => handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    <SortIcon col={col.key} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleProducts.map((p) => {
              const mp = getMarketplaceColor(p.marketplace)
              return (
                <tr key={`${p.connectionId}:${p.id}`} className="motion-row border-b border-border-subtle/50 hover:border-border-default/70 hover:bg-bg-card-hover/50">
                  <td className="max-w-[140px] truncate py-3.5 pr-4 font-mono text-[11px] text-text-muted" title={p.sku ?? undefined}>{p.sku}</td>
                  <td className="max-w-[280px] py-3.5 pr-4">
                    <Link to={exactProductPath(p)} className="block truncate text-[14px] font-semibold leading-relaxed tracking-tight text-text-primary hover:text-accent-blue hover:underline" title={p.name}>{p.name}</Link>
                    <CategoryTrigger product={p} onOpen={setSelectedCategoryKey} className="mt-0.5" />
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: getMarketplaceBadge(p.marketplace, theme).bg, color: getMarketplaceBadge(p.marketplace, theme).text }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                      {p.marketplace}
                    </span>
                  </td>
                  <td className="py-3.5 pr-4 text-center font-mono text-[13px] font-medium text-text-secondary">{p.units.toLocaleString('pt-BR')}</td>
                  <td className={`py-3.5 pr-4 text-center font-mono text-[13px] font-medium ${stockTone(p.stock)}`}>{p.stock}</td>
                  <td className="py-3.5 pr-4 text-center font-mono text-[14px] font-semibold text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</td>
                  <td className="py-3.5 pr-4 text-center"><MarginCell product={p} editable={editable} onSetCost={onSetCost} /></td>
                  <td className="py-3.5 text-center">
                    <div className="flex items-center justify-center gap-2.5">
                      <GrowthCell label="Período" value={p.trend === null ? null : Math.round(p.trend * 10) / 10} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </DataTableViewport>
      </div>

      {totalRows === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">Nenhum produto encontrado com os filtros aplicados.</div>
      )}
      <PaginationBar page={Math.min(page, totalPages)} totalPages={totalPages} totalRows={totalRows} pageSize={serverPage?.pageSize ?? pageSize} onPageChange={(nextPage) => {
        if (serverPage && onServerPageChange) onServerPageChange(nextPage)
        else setLocalPage(nextPage)
      }} />
      <CategoryDrawer categoryKey={selectedCategoryKey} products={categoryProducts} onClose={closeCategory} />
    </div>
  )
}

function CategoryTrigger({ product, onOpen, className = '' }: { product: Product; onOpen: (key: string) => void; className?: string }) {
  const source = categoryItemFromProduct(product)
  return (
    <button type="button" onClick={() => onOpen(categoryKey(source))} className={`${className} group/category flex max-w-full items-center gap-0.5 truncate text-[10.5px] font-medium text-text-muted hover:text-text-primary hover:underline`} title={`Analisar categoria ${categoryLabel(source)}`}>
      <span className="truncate">{categoryLabel(source)}</span><ChevronRight className="h-3 w-3 shrink-0 opacity-60 transition-transform group-hover/category:translate-x-0.5" />
    </button>
  )
}
