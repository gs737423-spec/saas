import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin'
import { DEFAULT_COMPANY_ID, type SanitizedSyncLogEntry } from '../../src/server/integrations/types'

const DEFAULT_LIMIT = 20
const MAX_LIMIT = 100

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      res.status(200).json({ ok: false, source: 'config_missing', message: 'Configuração do Supabase pendente.', logs: [] as SanitizedSyncLogEntry[] })
      return
    }

    const limit = Math.min(MAX_LIMIT, Math.max(1, Number(req.query.limit) || DEFAULT_LIMIT))
    const provider = typeof req.query.provider === 'string' ? req.query.provider : undefined

    const supabase = await getSupabaseAdmin()
    let query = supabase
      .from('sync_logs')
      .select('id, provider, event_type, status, message, created_at')
      .eq('company_id', DEFAULT_COMPANY_ID)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (provider) query = query.eq('provider', provider)

    const { data, error } = await query
    if (error) throw new Error(error.message)

    // sync_logs.payload may contain raw provider details in the future — this
    // endpoint never selects that column, so there is nothing to sanitize beyond
    // the message string, which is authored server-side and never token content.
    const logs: SanitizedSyncLogEntry[] = (data ?? []).map((row) => ({
      id: row.id,
      provider: row.provider,
      eventType: row.event_type,
      status: row.status,
      message: row.message,
      createdAt: row.created_at,
    }))

    res.status(200).json({ ok: true, source: 'real', logs })
  } catch (err) {
    console.error('[api/integrations/logs]', err)
    res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado ao consultar logs de integração.', logs: [] as SanitizedSyncLogEntry[] })
  }
}
