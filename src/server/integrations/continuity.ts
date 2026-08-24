const DAY_MS = 24 * 60 * 60 * 1000

export interface CatalogCheckpoint {
  cycleStartedAt: string
  nextOffset: number
  processed: number
  complete: boolean
  hadErrors: boolean
  reconciled: boolean
}

export interface OrdersCheckpoint {
  cycleStartedAt: string
  backfillFloor: string
  targetEnd: string
  nextWindowEnd: string
  complete: boolean
  windowSpanMs: number
}

export interface HistoricalWindow {
  from: string
  to: string
  checkpoint: OrdersCheckpoint
  isLatestWindow: boolean
  historyAlreadyComplete: boolean
}

function validDate(value: unknown): Date | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function catalogCheckpoint(raw: unknown, now: Date): CatalogCheckpoint {
  const value = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  if (value.complete === true) {
    return { cycleStartedAt: now.toISOString(), nextOffset: 0, processed: 0, complete: false, hadErrors: false, reconciled: false }
  }
  const cycleStartedAt = validDate(value.cycleStartedAt)?.toISOString() ?? now.toISOString()
  const nextOffset = Number.isInteger(value.nextOffset) && Number(value.nextOffset) >= 0 ? Number(value.nextOffset) : 0
  const processed = Number.isInteger(value.processed) && Number(value.processed) >= 0 ? Number(value.processed) : 0
  return {
    cycleStartedAt, nextOffset, processed,
    complete: value.complete === true,
    hadErrors: value.hadErrors === true,
    reconciled: value.reconciled === true,
  }
}

export function historicalWindow(raw: unknown, now: Date, historyDays: number, windowDays: number): HistoricalWindow {
  const value = raw && typeof raw === 'object' ? raw as Record<string, unknown> : {}
  const persistedEnd = validDate(value.nextWindowEnd)
  const persistedFloor = validDate(value.backfillFloor)
  const persistedTarget = validDate(value.targetEnd)
  const historyAlreadyComplete = value.complete === true
  const shouldResume = !historyAlreadyComplete && persistedEnd && persistedFloor && persistedTarget
  const defaultWindowSpanMs = windowDays * DAY_MS
  const persistedWindowSpanMs = typeof value.windowSpanMs === 'number' && Number.isFinite(value.windowSpanMs) && value.windowSpanMs > 0
    ? value.windowSpanMs
    : defaultWindowSpanMs
  const windowSpanMs = shouldResume ? persistedWindowSpanMs : defaultWindowSpanMs
  const targetEnd = shouldResume ? persistedTarget : now
  const backfillFloor = shouldResume
    ? persistedFloor
    : historyAlreadyComplete && persistedFloor
      ? persistedFloor
      : new Date(targetEnd.getTime() - historyDays * DAY_MS)
  const windowEnd = shouldResume ? persistedEnd : targetEnd
  const windowStart = new Date(Math.max(backfillFloor.getTime(), windowEnd.getTime() - windowSpanMs))
  const checkpoint: OrdersCheckpoint = {
    cycleStartedAt: shouldResume
      ? validDate(value.cycleStartedAt)?.toISOString() ?? targetEnd.toISOString()
      : targetEnd.toISOString(),
    backfillFloor: backfillFloor.toISOString(),
    targetEnd: targetEnd.toISOString(),
    nextWindowEnd: windowEnd.toISOString(),
    complete: historyAlreadyComplete,
    windowSpanMs,
  }
  return {
    from: windowStart.toISOString(),
    to: windowEnd.toISOString(),
    checkpoint,
    isLatestWindow: windowEnd.getTime() === targetEnd.getTime(),
    historyAlreadyComplete,
  }
}

export function narrowHistoricalWindow(window: HistoricalWindow, minimumHours = 1): OrdersCheckpoint {
  const minimumMs = minimumHours * 60 * 60 * 1000
  return {
    ...window.checkpoint,
    windowSpanMs: Math.max(minimumMs, Math.floor(window.checkpoint.windowSpanMs / 2)),
    complete: false,
  }
}

export function advanceHistoricalWindow(window: HistoricalWindow): OrdersCheckpoint {
  if (window.historyAlreadyComplete) {
    return { ...window.checkpoint, nextWindowEnd: window.checkpoint.targetEnd, complete: true }
  }
  const reachedFloor = new Date(window.from).getTime() <= new Date(window.checkpoint.backfillFloor).getTime()
  return {
    ...window.checkpoint,
    nextWindowEnd: window.from,
    complete: reachedFloor,
  }
}

export function canReconcileCatalog(complete: boolean, processingErrors: number): boolean {
  return complete && processingErrors === 0
}
