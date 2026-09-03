import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { getMarketplaceColor } from '@/data/mockData'

export interface MarketplaceOption {
  value: string
  label: string
}

function MarketplaceDropdown({ value, options, onChange }: { value: string | 'all'; options: MarketplaceOption[]; onChange: (v: string | 'all') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const label = value === 'all' ? 'Todos os canais' : options.find((option) => option.value === value)?.label ?? 'Canal selecionado'

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
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => { onChange(option.value); setOpen(false) }}
              className={`flex w-full cursor-pointer items-center gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                value === option.value ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: getMarketplaceColor(option.label) }} />
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface Props {
  marketplaceFilter: string | 'all'
  marketplaceOptions: MarketplaceOption[]
  onMarketplaceFilterChange: (v: string | 'all') => void
  lastUpdated: string
}

export default function FinanceHeader({ marketplaceFilter, marketplaceOptions, onMarketplaceFilterChange, lastUpdated }: Props) {
  return (
    <div className="flex justify-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <span className="text-[11px] text-text-muted">Atualizado {lastUpdated}</span>
        <MarketplaceDropdown value={marketplaceFilter} options={marketplaceOptions} onChange={onMarketplaceFilterChange} />
      </div>
    </div>
  )
}
