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
})
