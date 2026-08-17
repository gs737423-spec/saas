import type { SupabaseClient } from '@supabase/supabase-js'

export class SyncAlreadyRunningError extends Error {}
export class SyncLockUnavailableError extends Error {}

export const SYNC_LOCK_STALE_MINUTES = 10

export function getStaleSyncLockCutoff(now = new Date()): string {
  return new Date(now.getTime() - SYNC_LOCK_STALE_MINUTES * 60 * 1000).toISOString()
}

function isMissingLockColumn(error: { code?: string; message?: string }): boolean {
  return error.code === '42703' || error.code === 'PGRST204' || /sync_started_at/i.test(error.message ?? '')
}

/** Claim atômico por conexão. A migration 015 é obrigatória: sem a coluna,
 * bloqueamos o sync explicitamente em vez de voltar a aceitar escritas concorrentes. */
export async function claimSyncLock(supabase: SupabaseClient, companyId: string, connectionId: string, startedAt: Date): Promise<void> {
  const staleBefore = getStaleSyncLockCutoff(startedAt)
  const { data, error } = await supabase
    .from('marketplace_connections')
    .update({ sync_started_at: startedAt.toISOString() })
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
}

export async function releaseSyncLock(supabase: SupabaseClient, companyId: string, connectionId: string): Promise<void> {
  const { error } = await supabase.from('marketplace_connections').update({ sync_started_at: null }).eq('id', connectionId).eq('company_id', companyId)
  if (error) console.error('[syncLock] Failed to release lock', error.message)
}
