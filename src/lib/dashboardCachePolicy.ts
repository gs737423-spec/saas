const CLOSED_PERIOD_CACHE_TTL_MS = 5 * 60_000
const LIVE_PERIOD_CACHE_TTL_MS = 20_000

/** Períodos cujo fim ainda está no presente (Hoje/Este mês) mudam enquanto o
 * usuário olha a tela. Mantemos deduplicação e cache curto, sem congelar um
 * faturamento parcial por cinco minutos; ontem e períodos fechados continuam
 * usando o TTL normal para preservar desempenho. */
export function dashboardCacheTtlMs(url: string, now = Date.now()): number {
  const until = new URL(url, 'http://x').searchParams.get('to')
  const untilMs = until ? Date.parse(until) : NaN
  return Number.isFinite(untilMs) && Math.abs(untilMs - now) <= 5 * 60_000
    ? LIVE_PERIOD_CACHE_TTL_MS
    : CLOSED_PERIOD_CACHE_TTL_MS
}
