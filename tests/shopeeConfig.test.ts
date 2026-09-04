import { describe, expect, it } from 'vitest'
import { SHOPEE_ENV_VARS } from '../src/server/integrations/supabaseAdmin.js'
import { resolveShopeeApiHost } from '../src/server/integrations/shopee/auth.js'

describe('Shopee production host configuration', () => {
  it('requires the API host in shared endpoint and cron validation', () => {
    expect(SHOPEE_ENV_VARS).toContain('SHOPEE_API_HOST')
  })

  it('accepts only the explicit production host', () => {
    expect(resolveShopeeApiHost('https://partner.shopeemobile.com')).toBe('https://partner.shopeemobile.com')
  })

  it.each([
    undefined,
    '',
    'https://partner.test-stable.shopeemobile.com',
    'http://partner.shopeemobile.com',
    'https://partner.shopeemobile.com/other',
  ])('fails closed for absent or non-production host %s', (host) => {
    expect(() => resolveShopeeApiHost(host)).toThrow(/SHOPEE_API_HOST/)
  })
})
