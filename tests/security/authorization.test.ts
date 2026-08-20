import { describe, expect, it } from 'vitest'
import { canAssignRole, canRemoveRole, hasCapability } from '../../src/server/auth/authorization.js'
import { normalizeCompanyRole, parseRequestedCompanyId, resolveMembership, type CompanyRole } from '../../src/server/auth/requireCompany.js'

describe('role normalization and capability matrix', () => {
  const roles: CompanyRole[] = ['owner', 'admin', 'manager', 'member', 'viewer', 'unknown']

  it.each(roles)('normalizes the supported role %s', (role) => expect(normalizeCompanyRole(role)).toBe(role))
  it.each([null, undefined, '', 'platform_admin', 'superadmin', 'ADMIN'])('denies unknown role %s', (role) => {
    expect(normalizeCompanyRole(role)).toBe('unknown')
    expect(hasCapability('unknown', 'team.invite')).toBe(false)
  })

  it('allows team reads for tenant roles but no privileged action for unknown', () => {
    for (const role of ['owner', 'admin', 'manager', 'member', 'viewer'] as CompanyRole[]) expect(hasCapability(role, 'team.read')).toBe(true)
    expect(hasCapability('unknown', 'team.read')).toBe(false)
  })

  it('limits team mutations to owner/admin', () => {
    expect(hasCapability('owner', 'team.invite')).toBe(true)
    expect(hasCapability('admin', 'team.remove')).toBe(true)
    for (const role of ['manager', 'member', 'viewer', 'unknown'] as CompanyRole[]) {
      expect(hasCapability(role, 'team.invite')).toBe(false)
      expect(hasCapability(role, 'team.remove')).toBe(false)
    }
  })

  it('keeps viewers read-only', () => {
    expect(hasCapability('viewer', 'products.read')).toBe(true)
    expect(hasCapability('viewer', 'products.write')).toBe(false)
    expect(hasCapability('viewer', 'marketplaces.manage')).toBe(false)
  })

  it('prevents generic owner assignment and authority escalation', () => {
    expect(canAssignRole('owner', 'owner')).toBe(false)
    expect(canAssignRole('admin', 'admin')).toBe(false)
    expect(canAssignRole('admin', 'manager')).toBe(true)
    expect(canAssignRole('member', 'viewer')).toBe(false)
  })

  it('prevents owner and unknown-role removal', () => {
    expect(canRemoveRole('owner', 'owner')).toBe(false)
    expect(canRemoveRole('admin', 'owner')).toBe(false)
    expect(canRemoveRole('admin', 'unknown')).toBe(false)
    expect(canRemoveRole('admin', 'member')).toBe(true)
  })
})

describe('explicit tenant resolution', () => {
  const a = { company_id: 'tenant-a', role: 'admin' }
  const b = { company_id: 'tenant-b', role: 'member' }

  it('denies zero memberships', () => expect(resolveMembership([], null).status).toBe('none'))
  it('automatically resolves exactly one membership', () => expect(resolveMembership([a], null)).toEqual({ status: 'resolved', membership: a }))
  it('requires explicit context for multiple memberships', () => expect(resolveMembership([a, b], null).status).toBe('context_required'))
  it('resolves a valid explicit membership', () => expect(resolveMembership([a, b], 'tenant-b')).toEqual({ status: 'resolved', membership: b }))
  it('denies a cross-tenant company id even when it is known', () => expect(resolveMembership([a], 'tenant-b').status).toBe('forbidden'))
  it('accepts only syntactically valid explicit UUID contexts', () => {
    expect(parseRequestedCompanyId('00000000-0000-4000-8000-000000000001')).toBe('00000000-0000-4000-8000-000000000001')
    expect(parseRequestedCompanyId('tenant-a')).toBeNull()
    expect(parseRequestedCompanyId(['00000000-0000-4000-8000-000000000001'])).toBeNull()
  })
})
