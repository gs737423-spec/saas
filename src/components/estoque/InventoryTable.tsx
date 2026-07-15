import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  inventoryItems,
  getMarketplaceColor,
} from '@/data/mockData'
import InventoryFilters, { type InventoryFilterState } from './InventoryFilters'
import { useInventorySettings } from '@/contexts/InventorySettingsContext'
import DataTableViewport from '@/components/common/DataTableViewport'

interface Props {
  filters: InventoryFilterState
  onChange: (next: InventoryFilterState) => void
}

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

function daysSinceEntry(dateStr: string): number {
  const [d, m, y] = dateStr.split('/').map(Number)
  const entryDate = new Date(y, m - 1, d)
  const refDate = new Date(2026, 6, 10)
  return Math.round((refDate.getTime() - entryDate.getTime()) / 86400000)
}

export default function InventoryTable({ filters, onChange }: Props) {
  const [sort, setSort] = useState<SortKey>('revenue')
  const { settings, classifyGiro, giroColorFor, classifyCoverage } = useInventorySettings()

  const filtered = useMemo(() => {
    return inventoryItems.filter((i) => {
      if (filters.abc.size > 0 && !filters.abc.has(i.abcClass)) return false
      if (filters.onlyCritical && i.status !== 'critical') return false
      if (filters.onlyStalled) {
        const st = classifyGiro(i.coverageDays)
        if (!(st === 'Parado' || st === 'Parado crítico')) return false
      }
      if (filters.marketplace !== 'all' && i.marketplace !== filters.marketplace) return false
      if (filters.manufacturerSearch && !i.manufacturerCode.toLowerCase().includes(filters.manufacturerSearch.toLowerCase())) return false
      if (filters.onlyLowCoverage && i.coverageDays > settings.coverage.thresholds.atencaoMaxDays) return false
      if (filters.onlyExcess && i.coverageDays <= settings.coverage.thresholds.saudavelMaxDays) return false
      if (filters.onlyNoRecentEntry && daysSinceEntry(i.lastEntryDate) <= settings.stock.noRecentEntryDays) return false
      return true
    })
  }, [filters, classifyGiro, settings])

  const sorted = useMemo(() => [...filtered].sort((a, b) => (b[sort] as number) - (a[sort] as number)), [filtered, sort])

  return (
    <div className="overview-glass-elevated motion-panel flex flex-col rounded-2xl p-4 sm:rounded-3xl sm:p-5">
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
              className={`motion-chip cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium ${
                sort === o.key ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3.5">
        <InventoryFilters filters={filters} onChange={onChange} />
      </div>

      {/* Mobile: stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {sorted.map((i) => {
          const cov = classifyCoverage(i.coverageDays)
          const abc = abcStyle[i.abcClass]
          const turnStatus = classifyGiro(i.coverageDays)
          const turn = giroColorFor(turnStatus)
          const mp = getMarketplaceColor(i.marketplace)
          return (
            <div key={i.sku} className="overview-glass relative overflow-hidden rounded-xl p-3.5" style={{ boxShadow: `inset 3px 0 0 ${cov.color}` }}>
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/app/produto/${i.sku}`} className="block truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">{i.name}</Link>
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
                <div><p className="text-text-muted">Última NF</p><p className="mt-0.5 font-mono text-text-secondary">R$ {brl2(i.cost)}</p></div>
                <div><p className="text-text-muted">Valor em Estoque</p><p className="mt-0.5 font-mono text-text-secondary">R$ {brl(i.stock * i.cost)}</p></div>
                <div><p className="text-text-muted">Giro</p><p className="mt-0.5 font-semibold" style={{ color: turn.color }}>{turnStatus}</p></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Desktop: table */}
      <div className="hidden md:block">
        <DataTableViewport size="large" ariaLabel="Estoque por produto. Role para visualizar mais itens." className="-mx-1 rounded-xl px-1">
        <table className="w-full min-w-[1040px] text-sm">
          <thead>
            <tr className="border-b border-border-subtle text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
              <th className="pb-3 pr-2 pl-2 font-semibold">Código</th>
              <th className="pb-3 pr-2 font-semibold">Descrição</th>
              <th className="hidden pb-3 pr-2 font-semibold xl:table-cell">Cód. Fabricante</th>
              <th className="pb-3 pr-2 text-center font-semibold">Estoque</th>
              <th className="pb-3 pr-2 text-center font-semibold">Vendas 30d</th>
              <th className="pb-3 pr-2 text-center font-semibold">Cobertura</th>
              <th className="hidden pb-3 pr-2 text-center font-semibold lg:table-cell">Últ. Entrada</th>
              <th className="hidden pb-3 pr-2 text-center font-semibold xl:table-cell">Qtd. Entrada</th>
              <th className="pb-3 pr-2 text-center font-semibold">Última NF</th>
              <th className="hidden pb-3 pr-2 text-center font-semibold lg:table-cell">Valor Frete</th>
              <th className="pb-3 pr-2 text-center font-semibold">Valor em Estoque</th>
              <th className="hidden pb-3 pr-2 text-center font-semibold xl:table-cell">Média</th>
              <th className="pb-3 pr-2 text-center font-semibold">Share</th>
              <th className="pb-3 pr-2 text-center font-semibold">ABC</th>
              <th className="pb-3 pr-2 text-center font-semibold">Giro</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((i) => {
              const cov = classifyCoverage(i.coverageDays)
              const abc = abcStyle[i.abcClass]
              const turnStatus = classifyGiro(i.coverageDays)
              const turn = giroColorFor(turnStatus)
              const stockValue = i.stock * i.cost
              const avgTicket = i.units30d > 0 ? i.revenue / i.units30d : 0
              return (
                <tr key={i.sku} className="motion-row border-b border-border-subtle/50 hover:border-border-default/70 hover:bg-bg-card-hover/50">
                  <td className="py-3 pr-2 pl-2 font-mono text-[11px] text-text-muted">{i.sku}</td>
                  <td className="py-3 pr-2">
                    <Link to={`/app/produto/${i.sku}`} className="font-medium text-text-primary hover:text-accent-blue hover:underline">{i.name}</Link>
                  </td>
                  <td className="hidden py-3 pr-2 font-mono text-[11px] text-text-muted xl:table-cell">{i.manufacturerCode}</td>
                  <td className="py-3 pr-2 text-center font-mono text-text-secondary">{i.stock}</td>
                  <td className="py-3 pr-2 text-center font-mono text-text-secondary">{i.units30d}</td>
                  <td className="py-3 pr-2 text-center">
                    <span className="rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold" style={{ color: cov.color, background: `${cov.color}1F` }}>
                      {i.coverageDays}d · {cov.label}
                    </span>
                  </td>
                  <td className="hidden py-3 pr-2 text-center font-mono text-[11px] text-text-secondary lg:table-cell">{i.lastEntryDate}</td>
                  <td className="hidden py-3 pr-2 text-center font-mono text-text-secondary xl:table-cell">{i.lastEntryQty}</td>
                  <td className="py-3 pr-2 text-center font-mono text-text-secondary">R$ {brl2(i.cost)}</td>
                  <td className="hidden py-3 pr-2 text-center font-mono text-text-secondary lg:table-cell">R$ {brl2(i.lastEntryCost)}</td>
                  <td className="py-3 pr-2 text-center font-mono text-text-primary">R$ {brl(stockValue)}</td>
                  <td className="hidden py-3 pr-2 text-center font-mono text-text-secondary xl:table-cell">R$ {brl2(avgTicket)}</td>
                  <td className="py-3 pr-2 text-center font-mono text-text-secondary">{pct(i.sharePct)}%</td>
                  <td className="py-3 pr-2 text-center">
                    <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: abc.color, background: abc.bg }}>{i.abcClass}</span>
                  </td>
                  <td className="py-3 pr-2 text-center">
                    <span className="whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-semibold" style={{ color: turn.color, background: turn.bg }}>{turnStatus}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        </DataTableViewport>
      </div>
    </div>
  )
}
