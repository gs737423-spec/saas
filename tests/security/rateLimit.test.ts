import { describe, expect, it } from 'vitest'
import { checkRateLimit, evaluateRateLimit } from '../../src/server/auth/rateLimit.js'

describe('rate limit tri-state', () => {
  it('returns allowed only on a successful true RPC result', async () => {
    await expect(evaluateRateLimit('fake', 1, 60, async () => ({ data: true, error: null }))).resolves.toEqual({ status: 'allowed' })
  })
  it('returns limited with Retry-After information', async () => {
    await expect(evaluateRateLimit('fake', 1, 60, async () => ({ data: false, error: null }))).resolves.toEqual({ status: 'limited', retryAfter: 60 })
  })
  it('never converts unavailable infrastructure into allowed', async () => {
    await expect(evaluateRateLimit('fake', 1, 60, async () => ({ data: null, error: { code: '42883' } }))).resolves.toEqual({ status: 'unavailable', reason: '42883' })
    await expect(evaluateRateLimit('fake', 1, 60, async () => { throw new Error('offline') })).resolves.toEqual({ status: 'unavailable', reason: 'rpc_exception' })
  })

  it('returns 503 and does not continue on critical infrastructure failure', async () => {
    const response = fakeResponse()
    await expect(checkRateLimit(response.res, 'fake', 1, 60, { route: '/critical', policy: 'critical', evaluate: async () => ({ status: 'unavailable', reason: 'offline' }) })).resolves.toBe(false)
    expect(response.status).toBe(503)
    expect(response.headers['Retry-After']).toBe('30')
  })

  it('returns 429 with Retry-After when limited', async () => {
    const response = fakeResponse()
    await expect(checkRateLimit(response.res, 'fake', 1, 60, { evaluate: async () => ({ status: 'limited', retryAfter: 42 }) })).resolves.toBe(false)
    expect(response.status).toBe(429)
    expect(response.headers['Retry-After']).toBe('42')
  })
})

function fakeResponse() {
  const state: { status?: number; body?: unknown; headers: Record<string, string> } = { headers: {} }
  const res = {
    setHeader(name: string, value: string) { state.headers[name] = value; return this },
    status(code: number) { state.status = code; return this },
    json(body: unknown) { state.body = body; return this },
  }
  return Object.assign(state, { res: res as never })
}
