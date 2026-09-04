// Shared period-range options used by every period selector in the app.
// Real selectors follow the current calendar. Demo fixtures remain
// deterministic in demoData.ts; a fixed application-wide date made "Este
// mês" stale and eventually wrong for every real tenant.
export const TODAY = new Date()

export interface PeriodOption {
  key: string
  label: string
  /** Days covered by this range — drives how mock totals scale. */
  days: number
  /** Small deterministic multiplier so short/near ranges don't look identical. */
  jitter: number
  query: string
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export function buildPeriodOptions(): PeriodOption[] {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterdayStart = new Date(todayStart.getTime() - 86400000)
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const query = (days: number, from: Date, to: Date) => new URLSearchParams({ days: String(days), from: from.toISOString(), to: to.toISOString() }).toString()
  const rolling = (days: number) => query(days, new Date(now.getTime() - days * 86400000), now)
  const dayOfMonth = now.getDate()
  return [
    { key: 'today', label: 'Hoje', days: 1, jitter: 1.08, query: query(1, todayStart, now) },
    { key: 'yesterday', label: 'Ontem', days: 1, jitter: 0.91, query: query(1, yesterdayStart, todayStart) },
    { key: '7d', label: 'Últimos 7 dias', days: 7, jitter: 1, query: rolling(7) },
    { key: '14d', label: 'Últimos 14 dias', days: 14, jitter: 1, query: rolling(14) },
    { key: '21d', label: 'Últimos 21 dias', days: 21, jitter: 1, query: rolling(21) },
    { key: 'month', label: `Este mês (${shortDate(monthStart)} – ${shortDate(now)})`, days: dayOfMonth, jitter: 1, query: query(dayOfMonth, monthStart, now) },
  ]
}

export const DEFAULT_PERIOD_KEY = 'month'

/** Mock totals in this app are baselined to a 30-day window. */
export const BASELINE_DAYS = 30
