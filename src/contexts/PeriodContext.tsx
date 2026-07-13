import { createContext, useContext, useState, type ReactNode } from 'react'
import { buildPeriodOptions, DEFAULT_PERIOD_KEY, type PeriodOption } from '@/lib/periods'

const periodOptions = buildPeriodOptions()

interface PeriodContextValue {
  options: PeriodOption[]
  period: PeriodOption
  periodKey: string
  setPeriodKey: (key: string) => void
}

const PeriodContext = createContext<PeriodContextValue | null>(null)

// Single date-range filter shared across the whole platform (topbar), so
// every screen reads from the same selection instead of each page having
// its own disconnected period control.
export function PeriodProvider({ children }: { children: ReactNode }) {
  const [periodKey, setPeriodKey] = useState(DEFAULT_PERIOD_KEY)
  const period = periodOptions.find((p) => p.key === periodKey) ?? periodOptions[0]

  return (
    <PeriodContext.Provider value={{ options: periodOptions, period, periodKey, setPeriodKey }}>
      {children}
    </PeriodContext.Provider>
  )
}

export function usePeriod(): PeriodContextValue {
  const ctx = useContext(PeriodContext)
  if (!ctx) throw new Error('usePeriod must be used within a PeriodProvider')
  return ctx
}
