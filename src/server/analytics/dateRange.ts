export interface AnalyticsDateRange {
  from: Date
  to: Date
  days: number
}

/** A operação e os filtros do produto usam horário de São Paulo. Centralizar
 * essa conversão impede que resumo (limite local) e gráficos (chave UTC)
 * coloquem a mesma venda em dias distintos entre 21h e 23h59 locais. */
export const ANALYTICS_TIME_ZONE = 'America/Sao_Paulo'

const DATE_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
})

const DATE_TIME_PARTS_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: ANALYTICS_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})

function numericParts(formatter: Intl.DateTimeFormat, value: Date): Record<string, number> {
  return Object.fromEntries(formatter.formatToParts(value)
    .filter((part) => part.type !== 'literal')
    .map((part) => [part.type, Number(part.value)]))
}

export function saoPauloDateKey(value: Date | string): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (!Number.isFinite(date.getTime())) throw new Error('ANALYTICS_INVALID_DATE')
  const parts = numericParts(DATE_PARTS_FORMATTER, date)
  return `${parts.year}-${String(parts.month).padStart(2, '0')}-${String(parts.day).padStart(2, '0')}`
}

/** Desloca uma chave de calendário, não um instante UTC. Meio-dia UTC evita
 * bordas de fuso durante a aritmética; a chave resultante continua local. */
export function shiftSaoPauloDate(day: string, offsetDays: number): string {
  const date = new Date(`${day}T12:00:00.000Z`)
  if (!Number.isFinite(date.getTime())) throw new Error('ANALYTICS_INVALID_DAY')
  date.setUTCDate(date.getUTCDate() + offsetDays)
  return date.toISOString().slice(0, 10)
}

function saoPauloOffsetMsAtLocalNoon(day: string): number {
  const noon = new Date(`${day}T12:00:00.000Z`)
  const parts = numericParts(DATE_TIME_PARTS_FORMATTER, noon)
  const zonedAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return zonedAsUtc - noon.getTime()
}

/** Limites exatos do dia operacional em São Paulo, sempre em UTC para as
 * queries timestamptz do Supabase. */
export function saoPauloDayBounds(day: string): { from: string; until: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day)
  if (!match) throw new Error('ANALYTICS_INVALID_DAY')
  const [, year, month, date] = match
  const startUtc = Date.UTC(Number(year), Number(month) - 1, Number(date))
  const from = new Date(startUtc - saoPauloOffsetMsAtLocalNoon(day))
  const nextDay = shiftSaoPauloDate(day, 1)
  const [nextYear, nextMonth, nextDate] = nextDay.split('-').map(Number)
  const until = new Date(Date.UTC(nextYear, nextMonth - 1, nextDate) - saoPauloOffsetMsAtLocalNoon(nextDay))
  return { from: from.toISOString(), until: until.toISOString() }
}

export function saoPauloDaysAgoKey(days: number, now = new Date()): string {
  return shiftSaoPauloDate(saoPauloDateKey(now), -days)
}

export function saoPauloDateLabel(day: string): string {
  return new Date(`${day}T12:00:00.000Z`).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', timeZone: ANALYTICS_TIME_ZONE,
  })
}

function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

export function resolveAnalyticsDateRange(
  query: Record<string, string | string[] | undefined>,
  maxDays = 365,
  now = new Date(),
): AnalyticsDateRange {
  const requestedDays = Math.min(maxDays, Math.max(1, Number(queryValue(query.days)) || 30))
  const rawFrom = queryValue(query.from)
  const rawTo = queryValue(query.to)
  const parsedFrom = rawFrom ? new Date(rawFrom) : null
  const parsedTo = rawTo ? new Date(rawTo) : null
  if (parsedFrom && parsedTo && Number.isFinite(parsedFrom.getTime()) && Number.isFinite(parsedTo.getTime())) {
    const duration = parsedTo.getTime() - parsedFrom.getTime()
    if (duration > 0 && duration <= maxDays * 86_400_000) {
      return { from: parsedFrom, to: parsedTo, days: Math.max(1, Math.ceil(duration / 86_400_000)) }
    }
  }
  return { from: new Date(now.getTime() - requestedDays * 86_400_000), to: now, days: requestedDays }
}
