import { describe, expect, it } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { claimSyncLock, heartbeatSyncLock, releaseSyncLock, SyncAlreadyRunningError } from '../src/server/integrations/syncLock'

interface Operation {
  payload: Record<string, unknown>
  equals: Array<[string, unknown]>
  or?: string
}

function fakeSupabase(results: Array<{ data?: unknown[]; error?: { message: string } }>) {
  const operations: Operation[] = []
  const client = {
    from() {
      return {
        update(payload: Record<string, unknown>) {
          const operation: Operation = { payload, equals: [] }
          operations.push(operation)
          const builder = {
            eq(column: string, value: unknown) { operation.equals.push([column, value]); return builder },
            or(value: string) { operation.or = value; return builder },
            select: async () => results.shift() ?? { data: [], error: null },
            then(resolve: (value: unknown) => void) { resolve(results.shift() ?? { data: null, error: null }) },
          }
          return builder
        },
      }
    },
  }
  return { supabase: client as unknown as SupabaseClient, operations }
}

describe('sync lock lease fencing', () => {
  it('renova e libera comparando o heartbeat pertencente ao owner', async () => {
    const { supabase, operations } = fakeSupabase([{ data: [{ id: 'conn' }] }, { data: [{ id: 'conn' }] }, { error: undefined }])
    const acquiredAt = new Date('2026-08-20T12:00:00.000Z')
    const lease = await claimSyncLock(supabase, 'company', 'conn', acquiredAt)
    await heartbeatSyncLock(supabase, lease, acquiredAt)
    await releaseSyncLock(supabase, lease)

    expect(lease.owner).toBeTruthy()
    expect(lease.token).toBe(acquiredAt.toISOString())
    expect(lease.heartbeatAt).toBe('2026-08-20T12:00:00.001Z')
    expect(operations[1].equals).toContainEqual(['sync_started_at', acquiredAt.toISOString()])
    expect(operations[2].equals).toContainEqual(['sync_started_at', lease.heartbeatAt])
  })

  it('detecta lease roubada no heartbeat', async () => {
    const { supabase } = fakeSupabase([{ data: [{ id: 'conn' }] }, { data: [] }])
    const lease = await claimSyncLock(supabase, 'company', 'conn', new Date('2026-08-20T12:00:00.000Z'))
    await expect(heartbeatSyncLock(supabase, lease)).rejects.toBeInstanceOf(SyncAlreadyRunningError)
  })
})
