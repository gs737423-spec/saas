import type { SupabaseClient } from '@supabase/supabase-js'
import { randomUUID } from 'node:crypto'

export class SyncAlreadyRunningError extends Error {}
export class SyncLockUnavailableError extends Error {}

export const SYNC_LOCK_STALE_MINUTES = 10

export interface SyncLease {
  companyId: string
  connectionId: string
  owner: string
  token: string
  heartbeatAt: string
}

const activeLeases = new Map<string, SyncLease>()

function leaseKey(companyId: string, connectionId: string): string {
  return `${companyId}\u0000${connectionId}`
}

export function getStaleSyncLockCutoff(now = new Date()): string {
  return new Date(now.getTime() - SYNC_LOCK_STALE_MINUTES * 60 * 1000).toISOString()
}

function isMissingLockColumn(error: { code?: string; message?: string }): boolean {
  return error.code === '42703' || error.code === 'PGRST204' || /sync_started_at/i.test(error.message ?? '')
}

/** Claim atômico por conexão. A migration 015 é obrigatória: sem a coluna,
 * bloqueamos o sync explicitamente em vez de voltar a aceitar escritas concorrentes. */
export async function claimSyncLock(supabase: SupabaseClient, companyId: string, connectionId: string, startedAt: Date): Promise<SyncLease> {
  const staleBefore = getStaleSyncLockCutoff(startedAt)
  const token = startedAt.toISOString()
  const owner = randomUUID()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .update({ sync_started_at: token })
    .eq('id', connectionId)
    .eq('company_id', companyId)
    .or(`sync_started_at.is.null,sync_started_at.lt.${staleBefore}`)
    .select('id')

  if (error) {
    if (isMissingLockColumn(error)) {
      throw new SyncLockUnavailableError('Atualização de banco pendente para habilitar a trava de sincronização.')
    }
    throw new Error(`Failed to claim sync lock: ${error.message}`)
  }
  if (!data || data.length === 0) throw new SyncAlreadyRunningError('Já existe uma sincronização em andamento para esta empresa.')
  const lease = { companyId, connectionId, owner, token, heartbeatAt: token }
  activeLeases.set(leaseKey(companyId, connectionId), lease)
  return lease
}

/** Renova somente a lease ainda pertencente ao chamador. O timestamp anterior
 * funciona como fencing token persistido sem exigir uma migration adicional. */
export async function heartbeatSyncLock(supabase: SupabaseClient, lease: SyncLease, now = new Date()): Promise<void> {
  const requestedMs = now.getTime()
  const previousMs = Date.parse(lease.heartbeatAt)
  const nextHeartbeat = new Date(Math.max(requestedMs, previousMs + 1)).toISOString()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .update({ sync_started_at: nextHeartbeat })
    .eq('id', lease.connectionId)
    .eq('company_id', lease.companyId)
    .eq('sync_started_at', lease.heartbeatAt)
    .select('id')
  if (error) throw new Error(`Failed to heartbeat sync lock: ${error.message}`)
  if (!data || data.length === 0) throw new SyncAlreadyRunningError(`Lease de sincronização perdida pelo owner ${lease.owner}.`)
  lease.heartbeatAt = nextHeartbeat
}

export async function releaseSyncLock(supabase: SupabaseClient, lease: SyncLease): Promise<void>
export async function releaseSyncLock(supabase: SupabaseClient, companyId: string, connectionId: string): Promise<void>
export async function releaseSyncLock(supabase: SupabaseClient, leaseOrCompanyId: SyncLease | string, legacyConnectionId?: string): Promise<void> {
  const lease = typeof leaseOrCompanyId === 'string'
    ? activeLeases.get(leaseKey(leaseOrCompanyId, legacyConnectionId ?? ''))
    : leaseOrCompanyId
  if (!lease) {
    console.error('[syncLock] Refusing release without the owning lease token')
    return
  }
  const { error } = await supabase
    .from('marketplace_connections')
    .update({ sync_started_at: null })
    .eq('id', lease.connectionId)
    .eq('company_id', lease.companyId)
    .eq('sync_started_at', lease.heartbeatAt)
  if (error) console.error('[syncLock] Failed to release lock', error.message)
  const key = leaseKey(lease.companyId, lease.connectionId)
  if (activeLeases.get(key) === lease) activeLeases.delete(key)
}
