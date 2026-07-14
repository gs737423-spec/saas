import { useEffect, useRef, useState } from 'react'
import { Search, ChevronDown, Check } from 'lucide-react'
import type { Marketplace } from '@/data/mockData'

export interface InventoryFilterState {
  abc: Set<'A' | 'B' | 'C'>
  onlyCritical: boolean
  onlyStalled: boolean
  marketplace: Marketplace | 'all'
  manufacturerSearch: string
  onlyLowCoverage: boolean
  onlyExcess: boolean
  onlyNoRecentEntry: boolean
}

interface Props {
  filters: InventoryFilterState
  onChange: (next: InventoryFilterState) => void
}

export const defaultInventoryFilters: InventoryFilterState = {
  abc: new Set(),
  onlyCritical: false,
  onlyStalled: false,
  marketplace: 'all',
  manufacturerSearch: '',
  onlyLowCoverage: false,
  onlyExcess: false,
  onlyNoRecentEntry: false,
}

const marketplaces: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`motion-chip cursor-pointer rounded-full border px-3 py-1.5 text-[11.5px] font-medium ${
        active
          ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue'
          : 'border-border-subtle bg-bg-primary/40 text-text-muted hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  )
}

function MarketplaceDropdown({ value, onChange }: { value: Marketplace | 'all'; onChange: (v: Marketplace | 'all') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const options: (Marketplace | 'all')[] = ['all', ...marketplaces]
  const optionLabel = (v: Marketplace | 'all') => (v === 'all' ? 'Todos os canais' : v)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`motion-chip flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium ${
          open
            ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue'
            : 'border-border-subtle bg-bg-primary/40 text-text-secondary hover:text-text-primary'
        }`}
      >
        {optionLabel(value)}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => {
                onChange(opt)
                setOpen(false)
              }}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-left text-[12px] font-medium transition-colors ${
                value === opt ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              {optionLabel(opt)}
              {value === opt && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InventoryFilters({ filters, onChange }: Props) {
  const toggleAbc = (c: 'A' | 'B' | 'C') => {
    const next = new Set(filters.abc)
    if (next.has(c)) next.delete(c)
    else next.add(c)
    onChange({ ...filters, abc: next })
  }

  return (
    <div className="overview-glass motion-panel flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-3">
      <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Curva</span>
      {(['A', 'B', 'C'] as const).map((c) => (
        <Chip key={c} active={filters.abc.has(c)} onClick={() => toggleAbc(c)}>{c}</Chip>
      ))}

      <span className="mx-1 h-4 w-px bg-border-subtle" />

      <Chip active={filters.onlyCritical} onClick={() => onChange({ ...filters, onlyCritical: !filters.onlyCritical })}>Crítico</Chip>
      <Chip active={filters.onlyStalled} onClick={() => onChange({ ...filters, onlyStalled: !filters.onlyStalled })}>Parado</Chip>
      <Chip active={filters.onlyLowCoverage} onClick={() => onChange({ ...filters, onlyLowCoverage: !filters.onlyLowCoverage })}>Cobertura baixa</Chip>
      <Chip active={filters.onlyExcess} onClick={() => onChange({ ...filters, onlyExcess: !filters.onlyExcess })}>Excesso</Chip>
      <Chip active={filters.onlyNoRecentEntry} onClick={() => onChange({ ...filters, onlyNoRecentEntry: !filters.onlyNoRecentEntry })}>Sem entrada recente</Chip>

      <span className="mx-1 h-4 w-px bg-border-subtle" />

      <MarketplaceDropdown
        value={filters.marketplace}
        onChange={(v) => onChange({ ...filters, marketplace: v })}
      />

      <div className="motion-input flex min-w-[160px] flex-1 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-primary/40 px-3 py-1.5 focus-within:border-accent-blue/50">
        <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
        <input
          value={filters.manufacturerSearch}
          onChange={(e) => onChange({ ...filters, manufacturerSearch: e.target.value })}
          placeholder="Código fabricante..."
          className="w-full bg-transparent text-[11.5px] text-text-secondary placeholder:text-text-muted focus:outline-none"
        />
      </div>
    </div>
  )
}
