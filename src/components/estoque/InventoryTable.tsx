import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  inventoryItems,
  getMarketplaceColor,
  getCoverageStatus,
  turnoverStatusStyle,
} from '@/data/mockData'
import InventoryFilters, { type InventoryFilterState } from './InventoryFilters'

const abcStyle: Record<'A' | 'B' | 'C', { color: string; bg: string }> = {
  A: { color: '#16C784', bg: 'rgba(22,199,132,0.14)' },
  B: { color: '#4C82F7', bg: 'rgba(76,130,247,0.14)' },
  C: { color: '#59688A', bg: 'rgba(89,104,138,0.16)' },
}

type SortKey = 'revenue' | 'stock' | 'coverageDays' | 'units30d'
const sortOptions: { key: SortKey; label: string }[] = [
  { key: 'revenue', label: 'Faturamento' },
  { key: 'stock', label: 'Estoque' },
  { key: 'units30d', label: 'Vendas 30d' },
  { key: 'coverageDays', label: 'Cobertura' },
]

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const defaultFilters: InventoryFilterState = {
  abc: new Set(),
  onlyCritical: false,
  onlyStalled: false,
  marketplace: 'all',
  manufacturerSearch: '',
  onlyLowCoverage: false,
  onlyExcess: false,
  onlyNoRecentEntry: false,
}

function daysSinceEntry(dateStr: string): number {
  const [d, m, y] = dateStr.split('/').map(Number)
  const entryDate = new Date(y, m - 1, d)
  const refDate = new Date(2026, 6, 10)
  return Math.round((refDate.getTime() - entryDate.getTime()) / 86400000)
}

export default function InventoryTable() {
  const [filters, setFilters] = useState<InventoryFilterState>(defaultFilters)
  const [sort, setSort] = useState<SortKey>('revenue')

  const filtered = useMemo(() => {
    return inventoryItems.filter((i) => {
      if (filters.abc.size > 0 && !filters.abc.has(i.abcClass)) return false
      if (filters.onlyCritical && i.status !== 'critical') return false
      if (filters.onlyStalled && !(i.turnoverStatus === 'Parado' || i.turnoverStatus === 'Parado crítico')) return false
      if (filters.marketplace !== 'all' && i.marketplace !== filters.marketplace) return false
      if (filters.manufacturerSearch && !i.manufacturerCode.toLowerCase().includes(filters.manufacturerSearch.toLowerCase())) return false
      if (filters.onlyLowCoverage && i.coverageDays > 20) return false
      if (filters.onlyExcess && i.coverageDays <= 45) return false
      if (filters.onlyNoRecentEntry && daysSinceEntry(i.lastEntryDate) <= 60) return false
      return true
    })
  }, [filters])

  const sorted = useMemo(() => [...filtered].sort((a, b) => (b[sort] as number) - (a[sort] as number)), [filtered, sort])

  return (
    <div className="overview-glass-elevated flex flex-col rounded-2xl p-4 sm:rounded-3xl sm:p-5">
      <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Estoque por Produto</h3>
          <p className="mt-0.5 text-xs text-text-muted">{sorted.length} de {inventoryItems.length} produtos · inclui Curva ABC</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border-subtle bg-bg-primary/40 p-0.5">
          <span className="px-1.5 text-[9px] font-medium uppercase tracking-wider text-text-muted">Ordenar</span>
          {sortOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setSort(o.key)}
              className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                sort === o.key ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3.5">
        <InventoryFilters filters={filters} onChange={setFilters} />
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {sorted.map((i) => {
          const cov = getCoverageStatus(i.coverageDays)
          const abc = abcStyle[i.abcClass]
          const turn = turnoverStatusStyle[i.turnoverStatus]
          const mp = getMarketplaceColor(i.marketplace)
          return (
            <div key={i.sku} className="overview-glass relative overflow-hidden rounded-xl p-3.5" style={{ boxShadow: `inset 3px 0 0 ${cov.color}` }}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/produto/${i.sku}`} className="block truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">{i.name}</Link>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-text-muted">{i.sku}</span>
                    <span className="text-text-muted">·</span>
                    <span className="text-[10px] font-medium" style={{ color: mp }}>{i.marketplace}</span>
                  </div>
                </div>
                <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ color: abc.color, background: abc.bg }}>{i.abcClass}</span>
              </div>
              <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border-subtle/50 pt-2.5 text-[11px]">
                <div><p className="text-text-muted">Estoque</p><p className="mt-0.5 font-mono text-text-primary">{i.stock}</p></div>
                <div><p className="text-text-muted">Vendas 30d</p><p className="mt-0.5 font-mono text-text-secondary">{i.units30d}</p></div>
                <div><p className="text-text-muted">Cobertura</p><p className="mt-0.5 font-mono font-semibold" style={{ color: cov.color }}>{i.coverageDays}d</p></div>
                <div><p className="text-text-muted">Custo</p><p className="mt-0.5 font-mono text-text-secondary">R$ {brl2(i.cost)}</p></div>
                <div><p className="text-text-muted">Faturamento</p><p className="mt-0.5 font-mono text-text-secondary">R$ {brl(i.revenue)}</p></div>
                <div><p className="text-text-muted">Giro</p><p className="mt-0.5 font-semibold" style={{ color: turn.color }}>{i.turnoverStatus}</p></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="-mx-1 hidden overflow-x-auto px-1 md:block">
        <table className="w-full min-w-[1280px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-3 pl-2 font-semibold">Código</th>
              <th className="pb-3 pr-3 font-semibold">Descrição</th>
              <th className="pb-3 pr-3 font-semibold">Cód. Fabricante</th>
              <th className="pb-3 pr-3 text-right font-semibold">Estoque</th>
              <th className="pb-3 pr-3 text-right font-semibold">Vendas 30d</th>
              <th className="pb-3 pr-3 text-right font-semibold">Cobertura</th>
              <th className="pb-3 pr-3 text-right font-semibold">Últ. Entrada</th>
              <th className="pb-3 pr-3 text-right font-semibold">Qtd. Entrada</th>
              <th className="pb-3 pr-3 text-right font-semibold">Custo</th>
              <th className="pb-3 pr-3 text-right font-semibold">Custo Entrada</th>
              <th className="pb-3 pr-3 text-right font-semibold">Faturamento</th>
              <th className="pb-3 pr-3 text-right font-semibold">Share</th>
              <th className="pb-3 pr-3 text-center font-semibold">ABC</th>
              <th className="pb-3 pr-2 text-center font-semibold">Giro</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => {
              const cov = getCoverageStatus(i.coverageDays)
              const abc = abcStyle[i.abcClass]
              const turn = turnoverStatusStyle[i.turnoverStatus]
              const costUp = i.lastEntryCost > i.previousEntryCost
              return (
                <tr key={i.sku} className="border-b border-border-subtle/50 transition-colors hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-3 pl-2 font-mono text-[11px] text-text-muted">{i.sku}</td>
                  <td className="py-3 pr-3">
                    <Link to={`/produto/${i.sku}`} className="font-medium text-text-primary hover:text-accent-blue hover:underline">{i.name}</Link>
                  </td>
                  <td className="py-3 pr-3 font-mono text-[11px] text-text-muted">{i.manufacturerCode}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{i.stock}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{i.units30d}</td>
                  <td className="py-3 pr-3 text-right">
                    <span className="rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold" style={{ color: cov.color, background: `${cov.color}1F` }}>
                      {i.coverageDays}d · {cov.label}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-[11px] text-text-secondary">{i.lastEntryDate}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{i.lastEntryQty}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">R$ {brl2(i.cost)}</td>
                  <td className="py-3 pr-3 text-right font-mono" style={costUp ? { color: '#F5A524' } : undefined}>
                    R$ {brl2(i.lastEntryCost)}
                  </td>
                  <td className="py-3 pr-3 text-right font-mono text-text-primary">R$ {brl(i.revenue)}</td>
                  <td className="py-3 pr-3 text-right font-mono text-text-secondary">{pct(i.sharePct)}%</td>
                  <td className="py-3 pr-3 text-center">
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: abc.color, background: abc.bg }}>{i.abcClass}</span>
                  </td>
                  <td className="py-3 pr-2 text-center">
                    <span className="whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-semibold" style={{ color: turn.color, background: turn.bg }}>{i.turnoverStatus}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
