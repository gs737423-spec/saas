import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { companyDeletionDecision } from '../../src/server/security/companyDeletion.js'

describe('safe company deletion', () => {
  it('blocks when any operational dependency exists', () => {
    expect(companyDeletionDecision({ orders: 1, products: 0 })).toEqual({ allowed: false, dependencies: { orders: 1 } })
  })
  it('allows only an empty dependency set', () => expect(companyDeletionDecision({ orders: 0, products: 0 })).toEqual({ allowed: true }))
  it('uses one transactional RPC and never directly deletes in the API', () => {
    const source = readFileSync(resolve('api/admin/companies.ts'), 'utf8')
    expect(source).toContain("rpc('delete_company_if_empty'")
    expect(source).not.toMatch(/from\(['"]companies['"]\)\.delete\(/)
  })
  it('locks the company, checks dependencies, and restricts the RPC', () => {
    const migration = readFileSync(resolve('supabase/migrations/018_security_hardening_phase2.sql'), 'utf8')
    expect(migration).toContain('for update')
    expect(migration).toContain("'company.delete_blocked'")
    expect(migration).toContain('revoke all on function')
    expect(migration).toContain('grant execute on function')
    expect(migration).toContain('revoke all on table public.security_audit_logs from anon, authenticated')
    expect(migration).toContain('revoke all on function public.check_rate_limit')
  })
})
