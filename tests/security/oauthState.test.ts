import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { signState as signMercadoLivreState, verifyState as verifyMercadoLivreState } from '../../src/server/integrations/mercadolivre/auth.js'
import { signState as signShopeeState, verifyState as verifyShopeeState } from '../../src/server/integrations/shopee/auth.js'

describe('OAuth state regression', () => {
  beforeEach(() => { process.env.OAUTH_STATE_SECRET = 'fake-test-secret-at-least-32-characters' })
  afterEach(() => { delete process.env.OAUTH_STATE_SECRET })

  it.each([
    ['Mercado Livre', signMercadoLivreState, verifyMercadoLivreState],
    ['Shopee', signShopeeState, verifyShopeeState],
  ])('%s binds a valid signed state to the company and rejects tampering', (_provider, sign, verify) => {
    const state = sign('tenant-a')
    expect(verify(state)?.companyId).toBe('tenant-a')
    expect(verify(`${state.slice(0, -1)}x`)).toBeNull()
    expect(verify(null)).toBeNull()
  })
})
