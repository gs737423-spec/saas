import { useState } from 'react'
import { TrendingUp, TrendingDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getMarketplaceColor } from '@/data/mockData'
import type { Product } from '@/data/mockData'

type SortKey = 'sku' | 'name' | 'marketplace' | 'units' | 'stock' | 'revenue' | 'margin' | 'trend'
type SortDir = 'asc' | 'desc'

function stockTone(stock: number) {
  if (stock <= 25) return 'text-accent-rose'
  if (stock <= 60) return 'text-accent-amber'
  return 'text-text-secondary'
}

function sortProducts(products: Product[], key: SortKey, dir: SortDir): Product[] {
  const sorted = [...products].sort((a, b) => {
    let cmp = 0
    switch (key) {
      case 'sku': cmp = a.sku.localeCompare(b.sku); break
      case 'name': cmp = a.name.localeCompare(b.name); break
      case 'marketplace': cmp = a.marketplace.localeCompare(b.marketplace); break
      case 'units': cmp = a.units - b.units; break
      case 'stock': cmp = a.stock - b.stock; break
      case 'revenue': cmp = a.revenue - b.revenue; break
      case 'margin': cmp = a.margin - b.margin; break
      case 'trend': cmp = a.trend - b.trend; break
    }
    return dir === 'asc' ? cmp : -cmp
  })
  return sorted
}

interface Props {
  filteredProducts: Product[]
}

const columns: { key: SortKey; label: string; align?: 'right' }[] = [
  { key: 'sku', label: 'SKU' },
  { key: 'name', label: 'Produto' },
  { key: 'marketplace', label: 'Marketplace' },
  { key: 'units', label: 'Vendas', align: 'right' },
  { key: 'stock', label: 'Estoque', align: 'right' },
  { key: 'revenue', label: 'Faturamento', align: 'right' },
  { key: 'margin', label: 'Margem', align: 'right' },
  { key: 'trend', label: 'Tendência', align: 'right' },
]

export default function ProductTable({ filteredProducts }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'sku' || key === 'marketplace' ? 'asc' : 'desc')
    }
  }

  const sorted = sortProducts(filteredProducts, sortKey, sortDir)

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
    return sortDir === 'asc' ? <ArrowUp className="h-3 w-3 text-accent-blue" /> : <ArrowDown className="h-3 w-3 text-accent-blue" />
  }

  const sortLabel = columns.find((c) => c.key === sortKey)?.label ?? ''

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Catalogo de Produtos</h3>
          <p className="mt-0.5 text-xs text-text-muted">{filteredProducts.length} produtos · vendas, estoque, margem e tendencia</p>
        </div>
        <span className="hidden rounded-lg border border-border-subtle bg-bg-card/60 px-3 py-1.5 text-[11px] font-medium text-text-secondary sm:inline">
          Ordenado por {sortLabel} {sortDir === 'asc' ? '(crescente)' : '(decrescente)'}
        </span>
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {sorted.map((p) => {
          const positive = p.trend >= 0
          const mp = getMarketplaceColor(p.marketplace)
          return (
            <div key={p.id} className="rounded-xl border border-border-subtle/60 bg-bg-primary/30 p-3.5">
              <div className="mb-2.5 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/produto/${p.sku}`} className="block truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">{p.name}</Link>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-text-muted">{p.sku}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[10px] font-medium" style={{ color: mp }}>{p.marketplace}</span>
                  </div>
                </div>
                <span className={`inline-flex shrink-0 items-center gap-0.5 rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{p.trend}%
                </span>
              </div>

              <div className="grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-border-subtle/50 pt-2.5">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Faturamento</p>
                  <p className="mt-0.5 font-mono text-[13px] font-semibold text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-text-muted">Margem</p>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border-subtle">
                      <div className="h-full rounded-full bg-accent-emerald" style={{ width: `${p.margin}%` }} />
                    </div>
                    <span className="font-mono text-[11px] text-text-secondary">{p.margin}%</span>
                  </div>
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
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[11px] font-semibold uppercase tracking-wider text-text-muted">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`group cursor-pointer pb-3 pr-4 font-semibold select-none transition-colors hover:text-text-secondary ${col.key === 'trend' ? 'pr-0' : ''} ${col.align === 'right' ? 'text-right' : ''}`}
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
            {sorted.map((p) => {
              const positive = p.trend >= 0
              const mp = getMarketplaceColor(p.marketplace)
              return (
                <tr key={p.id} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-4 font-mono text-[11px] text-text-muted">{p.sku}</td>
                  <td className="py-3 pr-4">
                    <Link to={`/produto/${p.sku}`} className="font-medium text-text-primary hover:text-accent-blue hover:underline">{p.name}</Link>
                    <span className="mt-0.5 block text-[11px] text-text-muted">{p.category}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span
                      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{ background: `${mp}15`, color: mp }}
                    >
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: mp }} />
                      {p.marketplace}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-text-secondary">{p.units.toLocaleString('pt-BR')}</td>
                  <td className={`py-3 pr-4 text-right font-mono ${stockTone(p.stock)}`}>{p.stock}</td>
                  <td className="py-3 pr-4 text-right font-mono font-medium text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="h-1.5 w-14 overflow-hidden rounded-full bg-border-subtle">
                        <div className="h-full rounded-full bg-accent-emerald" style={{ width: `${p.margin}%` }} />
                      </div>
                      <span className="font-mono text-text-secondary">{p.margin}%</span>
                    </div>
                  </td>
                  <td className="py-3 text-right">
                    <span className={`inline-flex items-center gap-1 font-mono font-medium ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {positive ? '+' : ''}{p.trend}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-text-muted">Nenhum produto encontrado com os filtros aplicados.</div>
      )}
    </div>
  )
}
