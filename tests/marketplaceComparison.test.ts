import { describe, expect, it } from 'vitest'
import { buildChannelComparison, safeDeltaPct, type ComparisonDailyPoint } from '../src/lib/marketplaceComparison'

const point = (date: string, value: number): ComparisonDailyPoint => ({ date, label: date, mercadolivre: value, shopee: 0, amazon: 0, lojapropria: 0, total: value })

describe('marketplace temporal comparison', () => {
  it.each([
    [120, 100, 20],
    [80, 100, -20],
    [100, 100, 0],
  ])('calculates delta for current %s and previous %s', (current, previous, expected) => {
    expect(safeDeltaPct(current, previous)).toBe(expected)
  })

  it('returns no percentage when previous is zero', () => {
    expect(safeDeltaPct(100, 0)).toBeNull()
  })

  it('keeps current zero as a valid decline', () => {
    expect(safeDeltaPct(0, 100)).toBe(-100)
  })

  it('aligns each current date with the shifted previous date', () => {
    const result = buildChannelComparison([
      point('2026-08-01', 10), point('2026-08-02', 20), point('2026-08-08', 30), point('2026-08-09', 40),
    ], 2, 7, 'mercadolivre')
    expect(result.slots.map((slot) => [slot.current, slot.previous])).toEqual([[30, 10], [40, 20]])
    expect(result.currentTotal).toBe(70)
    expect(result.previousTotal).toBe(30)
  })

  it('marks a missing previous day instead of fabricating a value', () => {
    const result = buildChannelComparison([point('2026-08-01', 10), point('2026-08-08', 30), point('2026-08-09', 40)], 2, 7, 'mercadolivre')
    expect(result.slots[1].previous).toBeNull()
    expect(result.deltaPct).toBeNull()
  })

  it('aggregates long ranges without dropping current values', () => {
    const days = Array.from({ length: 40 }, (_, index) => {
      const date = new Date(Date.UTC(2026, 6, 1 + index)).toISOString().slice(0, 10)
      return point(date, 10)
    })
    const result = buildChannelComparison(days, 20, 7, 'mercadolivre')
    expect(result.currentTotal).toBe(200)
    expect(result.slots.reduce((sum, slot) => sum + slot.current, 0)).toBe(200)
  })
})
