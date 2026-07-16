import { useEffect, useRef, useState } from 'react'
import { Search, ChevronDown, Check, X } from 'lucide-react'
import { productCategories, getMarketplaceColor } from '@/data/mockData'
import type { Marketplace } from '@/data/mockData'

const marketplaces: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']

export interface ProductFilterState {
  search: string
  marketplaces: Set<Marketplace>
  categories: Set<string>
}

interface Props {
  filters: ProductFilterState
  onChange: (next: ProductFilterState) => void
}

// Period is global (topbar calendar dropdown, PeriodContext) — no local
// period field here anymore so every page reacts to the same selection.
export const defaultProductFilters: ProductFilterState = {
  search: '',
  marketplaces: new Set(),
  categories: new Set(),
}

function MultiMarketplaceDropdown({
  selected,
  onChange,
}: {
  selected: Set<Marketplace>
  onChange: (next: Set<Marketplace>) => void
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

  const toggle = (mp: Marketplace) => {
    const next = new Set(selected)
    if (next.has(mp)) next.delete(mp)
    else next.add(mp)
    onChange(next)
  }

  const label =
    selected.size === 0
      ? 'Todos os marketplaces'
      : selected.size === 1
        ? [...selected][0]
        : `${selected.size} marketplaces`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="motion-input flex h-11 w-full cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 text-sm font-medium text-text-secondary hover:border-border-default focus:border-accent-blue/50"
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selected.size > 0 && selected.size <= 2 ? (
            [...selected].map((mp) => (
              <span key={mp} className="flex items-center gap-1">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: getMarketplaceColor(mp) }} />
                <span className="truncate">{mp}</span>
              </span>
            ))
          ) : (
            <span>{label}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          {/* "Todos" option */}
          <button
            type="button"
            onClick={() => { onChange(new Set()); setOpen(false) }}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
              selected.size === 0 ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            Todos os marketplaces
            {selected.size === 0 && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
          <div className="mx-3 border-t border-border-subtle" />
          {marketplaces.map((mp) => {
            const active = selected.has(mp)
            const color = getMarketplaceColor(mp)
            return (
              <button
                key={mp}
                type="button"
                onClick={() => toggle(mp)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                  active ? 'bg-accent-blue/10 text-text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                  {mp}
                </span>
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent-blue" />}
              </button>
            )
          })}
        </div>
      )}
      {/* Selected tags below */}
      {selected.size > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {[...selected].map((mp) => (
            <span
              key={mp}
              className="flex items-center gap-1 rounded-full border border-border-subtle bg-bg-card/60 px-2 py-0.5 text-[10px] font-medium text-text-secondary"
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: getMarketplaceColor(mp) }} />
              {mp}
              <button
                type="button"
                onClick={() => toggle(mp)}
                className="ml-0.5 cursor-pointer text-text-muted hover:text-text-primary"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function MultiCategoryDropdown({
  options,
  selected,
  onChange,
}: {
  options: string[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
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

  const toggle = (category: string) => {
    const next = new Set(selected)
    if (next.has(category)) next.delete(category)
    else next.add(category)
    onChange(next)
  }

  const label =
    selected.size === 0
      ? 'Todas as categorias'
      : selected.size === 1
        ? [...selected][0]
        : `${selected.size} categorias`

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="motion-input flex h-11 w-full cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 text-sm font-medium text-text-secondary hover:border-border-default focus:border-accent-blue/50"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          <button
            type="button"
            onClick={() => { onChange(new Set()); setOpen(false) }}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
              selected.size === 0 ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            Todas as categorias
            {selected.size === 0 && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
          <div className="mx-3 border-t border-border-subtle" />
          {options.map((category) => {
            const active = selected.has(category)
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggle(category)}
                className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                  active ? 'bg-accent-blue/10 text-text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                }`}
              >
                {category}
                {active && <Check className="h-3.5 w-3.5 shrink-0 text-accent-blue" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function ProductFilters({ filters, onChange }: Props) {
  const categoryOptions: string[] = [...productCategories]

  return (
    <div className="overview-glass motion-panel rounded-xl p-3">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_210px_170px]">
        <div className="motion-input group flex h-11 items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 focus-within:border-accent-blue/50 focus-within:bg-bg-card">
          <Search className="h-4 w-4 shrink-0 text-text-muted transition-colors group-focus-within:text-accent-blue" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Buscar por produto, SKU ou categoria..."
            className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <MultiMarketplaceDropdown
          selected={filters.marketplaces}
          onChange={(v) => onChange({ ...filters, marketplaces: v })}
        />
        <MultiCategoryDropdown
          options={categoryOptions}
          selected={filters.categories}
          onChange={(v) => onChange({ ...filters, categories: v })}
        />
      </div>
    </div>
  )
}
