import { describe, expect, it } from 'vitest'
import { VtexApiError } from '../src/server/integrations/vtex/errors'
import {
  assertVtexCircuitClosed,
  getVtexCircuitRetryAfterMs,
  isVtexSyncDue,
  nextVtexFailureState,
  nextVtexSyncAt,
  VTEX_AUTO_SYNC_INTERVAL_MS,
  VTEX_PERSISTENT_CIRCUIT_COOLDOWN_MS,
} from '../src/server/integrations/vtex/schedule'

const NOW = new Date('2026-08-14T12:00:00.000Z')

describe('VTEX durable scheduling policy', () => {
  it('keeps cron wake-up frequency separate from the 24-hour account schedule', () => {
    expect(isVtexSyncDue(null, NOW)).toBe(true)
    expect(isVtexSyncDue('2026-08-14T11:59:59.000Z', NOW)).toBe(true)
    expect(isVtexSyncDue('2026-08-14T12:00:01.000Z', NOW)).toBe(false)
    expect(Date.parse(nextVtexSyncAt(NOW)) - NOW.getTime()).toBe(VTEX_AUTO_SYNC_INTERVAL_MS)
  })

  it('opens the persisted circuit for one hour on the fifth consecutive run failure', () => {
    expect(nextVtexFailureState(3, NOW)).toEqual({ failureCount: 4, circuitOpenUntil: null })
    const opened = nextVtexFailureState(4, NOW)
    expect(opened.failureCount).toBe(5)
    expect(Date.parse(opened.circuitOpenUntil!)- NOW.getTime()).toBe(VTEX_PERSISTENT_CIRCUIT_COOLDOWN_MS)
  })

  it('blocks provider work while the durable circuit is open and allows it after expiry', () => {
    const openUntil = '2026-08-14T12:30:00.000Z'
    expect(getVtexCircuitRetryAfterMs(openUntil, NOW)).toBe(30 * 60 * 1000)
    expect(() => assertVtexCircuitClosed(openUntil, NOW)).toThrowError(VtexApiError)
    try {
      assertVtexCircuitClosed(openUntil, NOW)
    } catch (error) {
      expect(error).toMatchObject({ code: 'VTEX_CIRCUIT_OPEN', retryAfterMs: 30 * 60 * 1000 })
    }
    expect(() => assertVtexCircuitClosed(openUntil, new Date('2026-08-14T12:30:00.000Z'))).not.toThrow()
  })
})
