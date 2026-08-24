import { describe, expect, it } from 'vitest'
import { advanceHistoricalWindow, canReconcileCatalog, catalogCheckpoint, historicalWindow, narrowHistoricalWindow } from '../src/server/integrations/continuity'

describe('integration continuity', () => {
  const now = new Date('2026-08-24T12:00:00.000Z')

  it('resumes a historical window without moving its frozen target', () => {
    const first = historicalWindow({}, now, 90, 15)
    const nextCheckpoint = advanceHistoricalWindow(first)
    const resumed = historicalWindow(nextCheckpoint, new Date('2026-08-25T12:00:00.000Z'), 90, 15)

    expect(resumed.to).toBe(first.from)
    expect(resumed.checkpoint.targetEnd).toBe(now.toISOString())
    expect(resumed.isLatestWindow).toBe(false)
  })

  it('starts a fresh cycle after reaching the historical floor', () => {
    let window = historicalWindow({}, now, 15, 15)
    const completed = advanceHistoricalWindow(window)
    expect(completed.complete).toBe(true)

    window = historicalWindow(completed, new Date('2026-08-25T12:00:00.000Z'), 15, 15)
    expect(window.checkpoint.targetEnd).toBe('2026-08-25T12:00:00.000Z')
    expect(window.isLatestWindow).toBe(true)
    expect(advanceHistoricalWindow(window).complete).toBe(true)
  })

  it('never reconciles a partial or failed catalog cycle', () => {
    expect(canReconcileCatalog(false, 0)).toBe(false)
    expect(canReconcileCatalog(true, 1)).toBe(false)
    expect(canReconcileCatalog(true, 0)).toBe(true)
  })

  it('narrows a truncated order window without advancing its end', () => {
    const window = historicalWindow({}, now, 365, 30)
    const narrowed = narrowHistoricalWindow(window)
    expect(narrowed.nextWindowEnd).toBe(window.to)
    expect(narrowed.windowSpanMs).toBe(15 * 24 * 60 * 60 * 1000)
    expect(narrowed.complete).toBe(false)
  })

  it('sanitizes malformed catalog checkpoints', () => {
    expect(catalogCheckpoint({ nextOffset: -1, processed: 'many' }, now)).toEqual({
      cycleStartedAt: now.toISOString(), nextOffset: 0, processed: 0, complete: false, hadErrors: false, reconciled: false,
    })
  })
})
