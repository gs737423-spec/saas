import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { signState as signMercadoLivreState, verifyState as verifyMercadoLivreState } from '../../src/server/integrations/mercadolivre/auth.js'
import { signState as signShopeeState, verifyState as verifyShopeeState } from '../../src/server/integrations/shopee/auth.js'

describe('OAuth state regression', () => {
  beforeEach(() => { process.env.OAUTH_STATE_SECRET = 'fake-test-secret-at-least-32-characters' })
  afterEach(() => { delete process.env.OAUTH_STATE_SECRET; vi.useRealTimers() })

  it.each([
    ['Mercado Livre', signMercadoLivreState, verifyMercadoLivreState],
    ['Shopee', signShopeeState, verifyShopeeState],
  ])('%s binds a valid signed state to the company and rejects tampering', (_provider, sign, verify) => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-14T12:00:00Z'))
    const state = sign('tenant-a')
    const [payloadB64, signatureB64] = state.split('.')
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as { nonce: string }
    const tamperedPayload = Buffer.from(JSON.stringify({ ...payload, nonce: `${payload.nonce}-tampered` })).toString('base64url')
    const signature = Buffer.from(signatureB64, 'base64url')
    signature[0] ^= 0xff

    expect(verify(state)?.companyId).toBe('tenant-a')
    expect(verify(`${tamperedPayload}.${signatureB64}`)).toBeNull()
    expect(verify(`${payloadB64}.${signature.toString('base64url')}`)).toBeNull()
    expect(verify('malformed')).toBeNull()
    expect(verify(null)).toBeNull()
    vi.advanceTimersByTime(10 * 60 * 1000 + 1)
    expect(verify(state)).toBeNull()
  })
})
