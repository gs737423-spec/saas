import { useEffect, useRef, useState } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import { productCategories } from '@/data/mockData'
import type { Marketplace } from '@/data/mockData'

const marketplaces: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']
const periods = [
  { value: '7d', label: 'Últimos 7 dias' },
  { value: '30d', label: 'Últimos 30 dias' },
  { value: 'month', label: 'Este mês' },
  { value: '90d', label: 'Últimos 90 dias' },
  { value: 'year', label: 'Este ano' },
]

export interface ProductFilterState {
  search: string
  marketplace: Marketplace | 'all'
  category: string
  period: string
}

interface Props {
  filters: ProductFilterState
  onChange: (next: ProductFilterState) => void
}

export const defaultProductFilters: ProductFilterState = {
  search: '',
  marketplace: 'all',
  category: 'all',
  period: '30d',
}

function Dropdown<T extends string>({
  value,
  onChange,
  options,
  labelFn,
}: {
  value: T
  onChange: (v: T) => void
  options: T[]
  labelFn: (v: T) => string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-full cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-default focus:border-accent-blue/50"
      >
        <span className="truncate">{labelFn(value)}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-full min-w-[180px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                value === opt ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              {labelFn(opt)}
              {value === opt && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ProductFilters({ filters, onChange }: Props) {
  const marketplaceOptions: (Marketplace | 'all')[] = ['all', ...marketplaces]
  const categoryOptions: string[] = ['all', ...productCategories]

  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_190px_170px_180px]">
        <div className="group flex h-11 items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 transition-colors focus-within:border-accent-blue/50 focus-within:bg-bg-card">
          <Search className="h-4 w-4 shrink-0 text-text-muted transition-colors group-focus-within:text-accent-blue" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar por produto, SKU ou categoria..."
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <Dropdown
          value={filters.marketplace}
          onChange={(v) => onChange({ ...filters, marketplace: v })}
          options={marketplaceOptions}
          labelFn={(v) => (v === 'all' ? 'Todos os marketplaces' : v)}
        />
        <Dropdown
          value={filters.category}
          onChange={(v) => onChange({ ...filters, category: v })}
          options={categoryOptions}
          labelFn={(v) => (v === 'all' ? 'Todas as categorias' : v)}
        />
        <Dropdown
          value={filters.period}
          onChange={(v) => onChange({ ...filters, period: v })}
          options={periods.map((p) => p.value)}
          labelFn={(v) => periods.find((p) => p.value === v)?.label ?? v}
        />
      </div>
    </div>
  )
}
