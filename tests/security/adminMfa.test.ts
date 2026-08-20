import { describe, expect, it } from 'vitest'
import { getAssuranceLevel, hasVerifiedMfaFactor } from '../../src/server/auth/adminMfa.js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function token(claims: Record<string, unknown>): string {
  return `header.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.signature`
}

describe('mandatory platform-admin MFA', () => {
  it('accepts only a verified factor', () => {
    expect(hasVerifiedMfaFactor([{ status: 'verified' }])).toBe(true)
    expect(hasVerifiedMfaFactor([{ status: 'unverified' }, { status: 'pending' }])).toBe(false)
    expect(hasVerifiedMfaFactor([])).toBe(false)
    expect(hasVerifiedMfaFactor(undefined)).toBe(false)
  })

  it('accepts only an explicit aal2 claim and fails malformed tokens closed', () => {
    expect(getAssuranceLevel(token({ aal: 'aal2' }))).toBe('aal2')
    for (const value of [null, '', 'broken', token({ aal: 'aal1' }), token({ aal: 'AAL2' }), token({})]) {
      expect(getAssuranceLevel(value)).toBe('aal1')
    }
  })

  it('enforces the same MFA gate on admin APIs and tenant-context APIs', () => {
    const admin = readFileSync(resolve('src/server/auth/requireAdmin.ts'), 'utf8')
    const company = readFileSync(resolve('src/server/auth/requireCompany.ts'), 'utf8')
    expect(admin).toContain('requirePlatformAdminMfa(req, res, user.id)')
    expect(company).toContain('requirePlatformAdminMfa(req, res, user.id)')
  })
})
