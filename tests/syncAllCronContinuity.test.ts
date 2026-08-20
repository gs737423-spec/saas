import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('shared sync cron continuity', () => {
  const source = readFileSync(resolve('api/cron/sync-all.ts'), 'utf8')

  it('processa uma conexão por tick para nunca iniciar trabalho perto do maxDuration', () => {
    expect(source).toContain('.limit(1)')
    expect(source).toContain("continuation: remainingCount > 0 ? 'next_scheduled_tick' : null")
  })

  it('prioriza conexão mais antiga e mede quantas ficam para ticks seguintes', () => {
    expect(source).toContain(".order('last_sync_at', { ascending: true, nullsFirst: true })")
    expect(source).toContain(".select('company_id, provider, last_sync_at', { count: 'exact' })")
    expect(source).toContain('const remainingCount = Math.max(0, (count ?? orderedConnections.length) - results.length)')
  })
})
