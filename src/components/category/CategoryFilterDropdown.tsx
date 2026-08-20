import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { CategoryOption } from '@/lib/categoryAnalytics'

interface Props {
  options: CategoryOption[]
  selected: Set<string>
  onChange: (next: Set<string>) => void
  compact?: boolean
}

export default function CategoryFilterDropdown({ options, selected, onChange, compact = false }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function closeOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', closeOutside)
    return () => document.removeEventListener('mousedown', closeOutside)
  }, [])

  const selectedLabels = options.filter((option) => selected.has(option.key)).map((option) => option.label)
  const label = selectedLabels.length === 0 ? 'Todas as categorias' : selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} categorias`

  function toggle(key: string) {
    const next = new Set(selected)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    onChange(next)
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${compact ? 'motion-chip h-8 rounded-sm px-3 text-[11.5px]' : 'motion-input h-11 w-full rounded-xl px-3.5 text-sm'} flex cursor-pointer items-center justify-between gap-2 border border-border-subtle bg-bg-card/60 font-medium text-text-secondary hover:border-border-default focus:border-accent-blue/50 ${open || selected.size > 0 ? 'control-active' : 'control-inactive'}`}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="truncate">{label}</span>
        <ChevronDown className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-40 mt-1.5 max-h-64 min-w-[220px] overflow-y-auto rounded-lg border border-border-subtle bg-bg-card p-1 shadow-2xl" role="listbox" aria-label="Categorias">
          <button type="button" onClick={() => { onChange(new Set()); setOpen(false) }} className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[12px] font-medium ${selected.size === 0 ? 'control-active' : 'text-text-secondary hover:bg-bg-card-hover'}`}>
            Todas as categorias
            {selected.size === 0 && <Check className="h-3.5 w-3.5" />}
          </button>
          {options.map((option) => {
            const active = selected.has(option.key)
            return (
              <button key={option.key} type="button" onClick={() => toggle(option.key)} className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-[12px] font-medium ${active ? 'control-active' : 'text-text-secondary hover:bg-bg-card-hover'}`} role="option" aria-selected={active}>
                <span className="truncate">{option.label}</span>
                {active && <Check className="h-3.5 w-3.5 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
