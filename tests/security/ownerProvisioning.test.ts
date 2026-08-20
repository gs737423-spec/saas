import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { COMPANY_PROVISION_RPC, normalizeOwnerEmail, ownerProvisionParams } from '../../src/server/auth/ownerProvisioning.js'

describe('deterministic first-owner provisioning', () => {
  it('normalizes a single explicit owner identity and rejects malformed values', () => {
    expect(normalizeOwnerEmail(' Owner@Example.COM ')).toBe('owner@example.com')
    for (const value of [null, '', 'owner', '@example.com', 'owner @example.com', ['owner@example.com']]) {
      expect(normalizeOwnerEmail(value)).toBeNull()
    }
  })

  it('builds the fixed RPC contract without accepting a caller-controlled role', () => {
    const params = ownerProvisionParams({ company: { name: 'Tenant A' }, ownerUserId: 'user-a', actorUserId: 'admin-a', requestId: 'request-123' })
    expect(COMPANY_PROVISION_RPC).toBe('provision_company_with_owner')
    expect(params).toEqual({ p_company: { name: 'Tenant A' }, p_owner_user_id: 'user-a', p_actor_user_id: 'admin-a', p_request_id: 'request-123' })
    expect(params).not.toHaveProperty('role')
  })

  it('keeps company insert, owner insert and audit in one restricted database transaction', () => {
    const migration = readFileSync(resolve('supabase/migrations/023_platform_admin_mfa_and_owner_provisioning.sql'), 'utf8')
    expect(migration).toMatch(/^--[\s\S]*\nbegin;/)
    expect(migration).toContain("values (p_owner_user_id, v_company.id, 'owner')")
    expect(migration).toContain('platform admin cannot be tenant owner')
    expect(migration).toContain("'company.provision'")
    expect(migration).toContain('grant execute on function public.provision_company_with_owner(jsonb, uuid, uuid, text) to service_role')
    expect(migration).toMatch(/revoke all on function public\.provision_company_with_owner[\s\S]*from public, anon, authenticated/)
    expect(migration.trimEnd().endsWith('commit;')).toBe(true)
  })

  it('does not let the generic invite path overwrite the established owner', () => {
    const endpoint = readFileSync(resolve('api/admin/invite.ts'), 'utf8')
    expect(endpoint).toContain(".eq('company_id', companyId)")
    expect(endpoint).toContain(".eq('role', 'owner')")
    expect(endpoint).toContain("role: 'owner'")
  })
})
