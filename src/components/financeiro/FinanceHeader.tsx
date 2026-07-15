import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { Marketplace } from '@/data/mockData'
import { getMarketplaceColor } from '@/data/mockData'

const marketplaces: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']

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

  const label = value === 'all' ? 'Todos os canais' : value

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="motion-header-control flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 text-xs font-medium text-text-secondary hover:border-border-default hover:text-text-primary"
      >
        {value !== 'all' && <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: getMarketplaceColor(value) }} />}
        <span className="truncate whitespace-nowrap">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-52 overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          <button
            type="button"
            onClick={() => { onChange('all'); setOpen(false) }}
            className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
              value === 'all' ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
            }`}
          >
            Todos os canais
            {value === 'all' && <Check className="h-3.5 w-3.5 shrink-0" />}
          </button>
          <div className="mx-3 border-t border-border-subtle" />
          {marketplaces.map((mp) => (
            <button
              key={mp}
              type="button"
              onClick={() => { onChange(mp); setOpen(false) }}
              className={`flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                value === mp ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: getMarketplaceColor(mp) }} />
              {mp}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  marketplaceFilter: Marketplace | 'all'
  onMarketplaceFilterChange: (v: Marketplace | 'all') => void
  lastUpdated: string
  isDemo: boolean
}

export default function FinanceHeader({ marketplaceFilter, onMarketplaceFilterChange, lastUpdated, isDemo }: Props) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold tracking-tight text-text-primary">Financeiro</h1>
          {isDemo && (
            <span className="rounded-full border border-border-default/70 bg-bg-primary/50 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
              Demonstração
            </span>
          )}
        </div>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Acompanhe faturamento, comissão, estornos e valor líquido estimado de todos os canais de venda.
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <span className="text-[11px] text-text-muted">Atualizado {lastUpdated}</span>
        <MarketplaceDropdown value={marketplaceFilter} onChange={onMarketplaceFilterChange} />
      </div>
    </div>
  )
}
