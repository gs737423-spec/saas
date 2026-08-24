import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('shared sync cron continuity', () => {
  const source = readFileSync(resolve('api/cron/sync-all.ts'), 'utf8')

  it('processa uma conexão por tick para nunca iniciar trabalho perto do maxDuration', () => {
    expect(source).toContain('.limit(1)')
    expect(source).toContain("continuation: remainingCount > 0 ? 'next_scheduled_tick' : null")
  })

  it('prioriza a conexão vencida mais antiga e mede quantas ficam para ticks seguintes', () => {
    expect(source).toContain(".order('next_sync_at', { ascending: true, nullsFirst: true })")
    expect(source).toContain('next_sync_at.is.null,next_sync_at.lte.')
    expect(source).toContain(".select('id, company_id, provider, last_sync_at, failure_count', { count: 'exact' })")
    expect(source).toContain('const remainingCount = Math.max(0, (count ?? orderedConnections.length) - results.length)')
  })

  it('adia falha precoce para a mesma conexão não causar starvation', () => {
    expect(source).toContain('nextIntegrationFailureState(conn.failure_count)')
    expect(source).toContain(".eq('id', conn.id).eq('company_id', conn.company_id).eq('provider', provider)")
  })
})
