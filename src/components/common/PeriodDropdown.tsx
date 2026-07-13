import { useEffect, useRef, useState } from 'react'
import { Calendar, Check, ChevronDown } from 'lucide-react'
import type { PeriodOption } from '@/lib/periods'

interface Props {
  options: PeriodOption[]
  selectedKey: string
  onChange: (key: string) => void
  /** 'compact' = pill trigger for toolbars/headers. 'field' = full-width form field, matches other filter dropdowns. 'icon' = icon+chevron only, no label — for tight topbars. */
  variant?: 'compact' | 'field' | 'icon'
}

// Shared dropdown trigger + menu. Replaces the old row-of-buttons period
// selectors (30/90/12 meses) that overflowed and didn't do anything.
export default function PeriodDropdown({ options, selectedKey, onChange, variant = 'compact' }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const selected = options.find((o) => o.key === selectedKey) ?? options[0]
  const isField = variant === 'field'
  const isIcon = variant === 'icon'

  return (
    <div ref={ref} className={`relative ${isField ? 'w-full' : 'shrink-0'}`}>
      <button
        type="button"
        title={selected.label}
        onClick={() => setOpen((o) => !o)}
        className={
          isField
            ? 'flex h-11 w-full cursor-pointer items-center justify-between gap-1.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 text-sm font-medium text-text-secondary transition-colors hover:border-border-default focus:border-accent-blue/50'
            : isIcon
              ? 'flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary'
              : 'flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-3 text-xs font-medium text-text-secondary transition-colors hover:border-border-default hover:text-text-primary'
        }
      >
        {isIcon ? (
          <Calendar className="h-[18px] w-[18px]" />
        ) : (
          <span className="flex min-w-0 items-center gap-2">
            <Calendar className={`shrink-0 text-accent-blue ${isField ? 'h-4 w-4' : 'h-3.5 w-3.5'}`} />
            <span className="truncate whitespace-nowrap">{selected.label}</span>
          </span>
        )}
        {!isIcon && <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />}
      </button>
      {open && (
        <div className="absolute right-0 top-full z-30 mt-1.5 w-60 overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              onClick={() => { onChange(opt.key); setOpen(false) }}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2.5 text-left text-[12.5px] font-medium transition-colors ${
                opt.key === selectedKey ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              {opt.label}
              {opt.key === selectedKey && <Check className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
