import { describe, expect, it } from 'vitest'
import { dashboardCacheTtlMs } from '../src/lib/dashboardCachePolicy'

describe('dashboard cache policy', () => {
  const now = Date.parse('2026-09-01T16:00:00.000Z')

  it('reduz validade de um período ainda aberto sem desabilitar cache', () => {
    expect(dashboardCacheTtlMs('/api/dashboard/summary?to=2026-09-01T16%3A00%3A00.000Z', now)).toBe(20_000)
  })

  it('mantém validade maior para período encerrado', () => {
    expect(dashboardCacheTtlMs('/api/dashboard/summary?to=2026-08-31T03%3A00%3A00.000Z', now)).toBe(5 * 60_000)
  })
})
