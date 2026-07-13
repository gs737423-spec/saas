// Shared period-range options used by every period selector in the app.
// Anchored to a fixed "today" so all mock data across pages stays consistent.
export const TODAY = new Date(2026, 6, 13)

export interface PeriodOption {
  key: string
  label: string
  /** Days covered by this range — drives how mock totals scale. */
  days: number
  /** Small deterministic multiplier so short/near ranges don't look identical. */
  jitter: number
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function buildPeriodOptions(): PeriodOption[] {
  const dayOfMonth = TODAY.getDate()
  const monthStart = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1)
  return [
    { key: 'today', label: 'Hoje', days: 1, jitter: 1.08 },
    { key: 'yesterday', label: 'Ontem', days: 1, jitter: 0.91 },
    { key: '7d', label: 'Últimos 7 dias', days: 7, jitter: 1 },
    { key: '14d', label: 'Últimos 14 dias', days: 14, jitter: 1 },
    { key: '21d', label: 'Últimos 21 dias', days: 21, jitter: 1 },
    { key: 'month', label: `Este mês (${shortDate(monthStart)} – ${shortDate(TODAY)})`, days: dayOfMonth, jitter: 1 },
  ]
}

export const DEFAULT_PERIOD_KEY = 'month'

/** Mock totals in this app are baselined to a 30-day window. */
export const BASELINE_DAYS = 30
