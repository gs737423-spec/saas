import { describe, expect, it } from 'vitest'
import { saoPauloDateKey, saoPauloDayBounds, saoPauloDaysAgoKey } from '../src/server/analytics/dateRange'

describe('analytics date keys in Sao Paulo', () => {
  it('keeps late local-night orders in the operational day instead of UTC next day', () => {
    expect(saoPauloDateKey('2026-09-02T01:59:59.000Z')).toBe('2026-09-01')
    expect(saoPauloDateKey('2026-09-02T03:00:00.000Z')).toBe('2026-09-02')
  })

  it('queries the exact local-day bounds in UTC', () => {
    expect(saoPauloDayBounds('2026-09-01')).toEqual({
      from: '2026-09-01T03:00:00.000Z',
      until: '2026-09-02T03:00:00.000Z',
    })
  })

  it('moves comparison dates by calendar day, not by a UTC timestamp', () => {
    expect(saoPauloDaysAgoKey(1, new Date('2026-09-02T02:00:00.000Z'))).toBe('2026-08-31')
  })
})
