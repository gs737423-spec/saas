import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('service-role tenant scope regressions', () => {
  it('scopes team target lookup and mutation by the server company context', () => {
    const source = readFileSync(resolve('api/team.ts'), 'utf8')
    const companyScopes = source.match(/\.eq\(['"]company_id['"], companyId\)/g) ?? []
    expect(companyScopes.length).toBeGreaterThanOrEqual(3)
    expect(source).not.toContain('req.body?.companyId')
    expect(source).not.toContain('req.body?.company_id')
  })

  it.each([
    'api/dashboard/summary.ts', 'api/dashboard/finance.ts', 'api/dashboard/inventory.ts',
    'api/dashboard/products.ts', 'api/integrations/status.ts', 'api/integrations/logs.ts',
  ])('%s carries an explicit company_id scope', (file) => {
    const source = readFileSync(resolve(file), 'utf8')
    expect(source).toMatch(/\.eq\(['"]company_id['"], auth\.companyId\)/)
  })

  it('keeps cross-tenant resource removal impossible', () => {
    const source = readFileSync(resolve('api/team.ts'), 'utf8')
    expect(source).toMatch(/\.delete\(\)\.eq\(['"]user_id['"], userId\)\.eq\(['"]company_id['"], companyId\)/)
  })

  it('scopes sync locks and connection mutations by both connection and company', () => {
    const lock = readFileSync(resolve('src/server/integrations/syncLock.ts'), 'utf8')
    expect(lock).toContain(".eq('id', connectionId)")
    expect(lock).toContain(".eq('company_id', companyId)")
    expect(lock.match(/\.eq\('company_id', lease\.companyId\)/g)?.length).toBeGreaterThanOrEqual(2)
    expect(lock.match(/\.eq\('sync_started_at', lease\.heartbeatAt\)/g)?.length).toBeGreaterThanOrEqual(2)

    for (const file of ['src/server/integrations/mercadolivre/sync.ts', 'src/server/integrations/shopee/sync.ts']) {
      const source = readFileSync(resolve(file), 'utf8')
      expect(source).toContain('const lease = await claimSyncLock(supabase, companyId, connection.id, startedAt)')
      expect(source).toContain('releaseSyncLock(supabase, lease)')
      expect(source).toContain('persistCanonicalOrder(supabase')
    }

    const canonical = readFileSync(resolve('src/server/integrations/orderIdentity.ts'), 'utf8')
    expect(canonical.match(/\.eq\('company_id', input\.companyId\)/g)?.length).toBeGreaterThanOrEqual(4)
  })

  it('does not trust company identifiers from mutation bodies', () => {
    for (const file of ['api/team.ts', 'api/support/tickets.ts', 'api/company-logo.ts']) {
      const source = readFileSync(resolve(file), 'utf8')
      expect(source).not.toMatch(/req\.body\?\.(?:companyId|company_id)/)
    }
  })
})
