import { describe, expect, it } from 'vitest'
import { fetchAllRows } from '../src/server/integrations/supabaseAdmin'

describe('fetchAllRows', () => {
  it('collects every page in order while limiting concurrent reads', async () => {
    const calls: number[] = []
    let inFlight = 0
    let peakInFlight = 0
    const pages = [
      [1, 2],
      [3, 4],
      [5],
    ]

    const result = await fetchAllRows<number>(async (from) => {
      const page = from / 2
      calls.push(page)
      inFlight += 1
      peakInFlight = Math.max(peakInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight -= 1
      return { data: pages[page] ?? [], error: null }
    }, 2)

    expect(result).toEqual({ data: [1, 2, 3, 4, 5], error: null })
    expect(calls).toEqual([0, 1, 2, 3])
    expect(peakInFlight).toBeLessThanOrEqual(4)
  })

  it('does not return a partial result when a page fails', async () => {
    const result = await fetchAllRows<number>(async (from) => {
      if (from === 2) return { data: null, error: { message: 'falha controlada' } }
      return { data: [from, from + 1], error: null }
    }, 2)

    expect(result.error?.message).toBe('falha controlada')
  })
})
