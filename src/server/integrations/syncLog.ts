import { getSupabaseAdmin } from './supabaseAdmin.js'
import { DEFAULT_COMPANY_ID, type Provider, type SyncLogEventType, type SyncLogStatus } from './types.js'

export interface LogSyncEventParams {
  connectionId: string | null
  provider: Provider
  eventType: SyncLogEventType
  status?: SyncLogStatus
  message?: string
  /** Sanitized only — never pass raw tokens or full API responses containing secrets here. */
  payload?: Record<string, unknown>
  startedAt?: Date
  finishedAt?: Date
}

/** Writes a row to `sync_logs`. Failures here are logged to console but never thrown —
 *  a logging failure must not break the OAuth/sync flow it's trying to record. */
export async function logSyncEvent(params: LogSyncEventParams): Promise<void> {
  try {
    const supabase = await getSupabaseAdmin()
    const { error } = await supabase.from('sync_logs').insert({
      company_id: DEFAULT_COMPANY_ID,
      connection_id: params.connectionId,
      provider: params.provider,
      event_type: params.eventType,
      status: params.status ?? 'info',
      message: params.message ?? null,
      payload: params.payload ?? null,
      started_at: params.startedAt?.toISOString() ?? null,
      finished_at: params.finishedAt?.toISOString() ?? null,
    })
    if (error) {
      console.error('[sync_logs] insert failed:', error.message)
    }
  } catch (err) {
    console.error('[sync_logs] unexpected failure:', err)
  }
}
