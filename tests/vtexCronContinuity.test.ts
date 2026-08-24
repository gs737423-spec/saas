import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('VTEX cron fairness', () => {
  const cron = readFileSync(resolve('api/cron/sync-vtex.ts'), 'utf8')
  const sync = readFileSync(resolve('src/server/integrations/vtex/sync.ts'), 'utf8')

  it('processes exactly one connection per tick and prioritizes an active run', () => {
    expect(cron).toContain(".order('created_at', { ascending: true }).limit(1)")
    expect(cron).toContain("const nextConnection = resumableConnections.data?.[0] ?? dueConnections.data?.[0] ?? null")
    expect(cron).toContain('for (const connection of nextConnection ? [nextConnection] : [])')
    expect(cron).not.toContain('for (const connection of connectionsToProcess.values())')
  })

  it('preserves the unprocessed retry tail when a catalog retry times out', () => {
    expect(sync).toContain('const retryTail = retryingFailedSkus ? batch.slice(processedInThisCall) : []')
    expect(sync).toContain('const retryTail = retryingFailedSkus ? batch.slice(processedCount) : []')
    expect(sync).toContain('catalogFailedSkuIds: [...new Set([...failedSkuIds, ...retryTail])]')
  })

  it('starts full before the first success and self-heals the removed dense-window failure', () => {
    expect(cron).toContain("recoveringDenseFullRun || !connection.last_success_at ? 'full' : 'incremental'")
    expect(cron).toContain("connection.last_error === 'VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT'")
    expect(cron).toMatch(/failure_count:\s*0[\s\S]{0,100}circuit_open_until:\s*null/)
    expect(cron).toMatch(/\.eq\('id', connection\.id\)\.eq\('company_id', connection\.company_id\)\.eq\('provider', 'vtex'\)/)
  })

  it('does not require a closed breaker to select or resume an already active run', () => {
    expect(cron).toMatch(/activeRunCompanyIds\.length > 0[\s\S]{0,240}\.or\(lockAvailable\)/)
    expect(cron).not.toMatch(/activeRunCompanyIds\.length > 0[\s\S]{0,240}\.or\(circuitClosed\)/)
    expect(sync.indexOf('if (active)')).toBeLessThan(sync.indexOf('assertVtexCircuitClosed(connection.circuit_open_until)'))
  })
})
