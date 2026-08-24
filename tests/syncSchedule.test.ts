import { describe, expect, it } from 'vitest'
import { nextIntegrationFailureState, nextScheduledSyncAt } from '../src/server/integrations/syncSchedule.js'

describe('integration sync scheduling', () => {
  const now = new Date('2026-08-24T12:00:00.000Z')

  it('respects the configured interval instead of running every cron tick', () => {
    expect(nextScheduledSyncAt(60, now)).toBe('2026-08-24T13:00:00.000Z')
  })

  it('uses bounded exponential retry and opens the circuit after repeated failures', () => {
    expect(nextIntegrationFailureState(0, now)).toMatchObject({ failureCount: 1, nextSyncAt: '2026-08-24T12:05:00.000Z', circuitOpenUntil: null })
    expect(nextIntegrationFailureState(4, now)).toMatchObject({ failureCount: 5, nextSyncAt: '2026-08-24T13:20:00.000Z', circuitOpenUntil: '2026-08-24T13:20:00.000Z' })
  })
})
