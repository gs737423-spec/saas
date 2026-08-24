import { describe, expect, it } from 'vitest'
import { isExternalAccountSwitch } from '../src/server/integrations/accountIdentity.js'

describe('external account identity protection', () => {
  it('allows first connection and same-account credential rotation', () => {
    expect(isExternalAccountSwitch(null, 'shop-1')).toBe(false)
    expect(isExternalAccountSwitch('SHOP-1', ' shop-1 ')).toBe(false)
  })

  it('blocks changing the external account behind an existing connection', () => {
    expect(isExternalAccountSwitch('seller-1', 'seller-2')).toBe(true)
  })
})
