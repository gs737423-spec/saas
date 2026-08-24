export interface AnalyticsDateRange {
  from: Date
  to: Date
  days: number
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
