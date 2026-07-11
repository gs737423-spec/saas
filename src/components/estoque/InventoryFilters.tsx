import { Search } from 'lucide-react'
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

const marketplaces: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors ${
        active
          ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue'
          : 'border-border-subtle bg-bg-primary/40 text-text-muted hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
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
    <div className="overview-glass flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-3">
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

      <select
        value={filters.marketplace}
        onChange={(e) => onChange({ ...filters, marketplace: e.target.value as Marketplace | 'all' })}
        className="cursor-pointer rounded-full border border-border-subtle bg-bg-primary/40 px-3 py-1.5 text-[11.5px] font-medium text-text-secondary"
      >
        <option value="all">Todos os canais</option>
        {marketplaces.map((m) => (
          <option key={m} value={m}>{m}</option>
        ))}
      </select>

      <div className="flex min-w-[160px] flex-1 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-primary/40 px-3 py-1.5">
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
