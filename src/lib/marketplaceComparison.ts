export type ComparisonChannelKey = 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria'

export interface ComparisonDailyPoint {
  date: string
  label: string
  mercadolivre: number
  shopee: number
  amazon: number
  lojapropria: number
  total: number
}

export interface ComparisonSlot {
  key: string
  label: string
  currentDateLabel: string
  previousDateLabel: string
  current: number
  previous: number | null
}

export interface ChannelComparison {
  currentTotal: number
  previousTotal: number
  hasCompletePreviousRange: boolean
  deltaPct: number | null
  slots: ComparisonSlot[]
}

export function shiftIsoDate(date: string, offsetDays: number): string {
  const shifted = new Date(`${date}T12:00:00Z`)
  shifted.setUTCDate(shifted.getUTCDate() - offsetDays)
  return shifted.toISOString().slice(0, 10)
}

export function safeDeltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

export function bucketSizeFor(periodDays: number): number {
  if (periodDays <= 15) return 1
  if (periodDays <= 30) return 2
  if (periodDays <= 90) return 3
  return 7
}

function compactDay(date: string): string {
  return date.slice(8, 10)
}

function fullDate(date: string): string {
  return new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' })
}

function rangeLabel(dates: string[], formatter: (date: string) => string): string {
  if (dates.length === 0) return '—'
  if (dates.length === 1) return formatter(dates[0])
  return `${formatter(dates[0])}–${formatter(dates[dates.length - 1])}`
}

/**
 * Compara cada dia atual com a data deslocada pela regra já usada na tela.
 * Em períodos longos, soma dias consecutivos em buckets; nunca descarta dias.
 * A escala visual deve ser calculada depois com current e previous juntos.
 */
export function buildChannelComparison(
  allDays: ComparisonDailyPoint[],
  periodDays: number,
  offsetDays: number,
  channel: ComparisonChannelKey,
): ChannelComparison {
  const currentDays = allDays.slice(-periodDays)
  const byDate = new Map(allDays.map((point) => [point.date, point]))
  const bucketSize = bucketSizeFor(periodDays)
  const slots: ComparisonSlot[] = []

  for (let index = 0; index < currentDays.length; index += bucketSize) {
    const bucket = currentDays.slice(index, index + bucketSize)
    const currentDates = bucket.map((point) => point.date)
    const previousDates = currentDates.map((date) => shiftIsoDate(date, offsetDays))
    const previousPoints = previousDates.map((date) => byDate.get(date))
    const hasCompletePreviousRange = previousPoints.every(Boolean)

    slots.push({
      key: `${currentDates[0]}:${currentDates[currentDates.length - 1]}`,
      label: rangeLabel(currentDates, compactDay),
      currentDateLabel: rangeLabel(currentDates, fullDate),
      previousDateLabel: rangeLabel(previousDates, fullDate),
      current: bucket.reduce((sum, point) => sum + point[channel], 0),
      previous: hasCompletePreviousRange
        ? previousPoints.reduce((sum, point) => sum + (point?.[channel] ?? 0), 0)
        : null,
    })
  }

  const currentTotal = currentDays.reduce((sum, point) => sum + point[channel], 0)
  const alignedPrevious = currentDays.map((point) => byDate.get(shiftIsoDate(point.date, offsetDays)))
  const previousTotal = alignedPrevious.reduce((sum, point) => sum + (point?.[channel] ?? 0), 0)
  const hasCompletePreviousRange = alignedPrevious.every(Boolean)

  return {
    currentTotal,
    previousTotal,
    hasCompletePreviousRange,
    deltaPct: hasCompletePreviousRange ? safeDeltaPct(currentTotal, previousTotal) : null,
    slots,
  }
}
