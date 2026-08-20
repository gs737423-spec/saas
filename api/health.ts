import type { VercelRequest, VercelResponse } from '@vercel/node'
import { CORE_ENV_VARS, getMissingEnvVars, getSupabaseAdmin } from '../src/server/integrations/supabaseAdmin.js'

/**
 * Read-only liveness/readiness endpoint for external uptime monitors.
 * It never returns tenant rows, environment values, or provider credentials.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD')
    res.status(405).json({ ok: false, status: 'method_not_allowed' })
    return
  }

  res.setHeader('Cache-Control', 'no-store')
  const checkedAt = new Date().toISOString()
  if (getMissingEnvVars(CORE_ENV_VARS).length > 0) {
    res.status(503).json({ ok: false, status: 'configuration_unavailable', checkedAt })
    return
  }

  try {
    const supabase = await getSupabaseAdmin()
    const { error } = await supabase.from('marketplace_connections').select('id', { head: true, count: 'exact' }).limit(1)
    if (error) throw error
    res.status(200).json({ ok: true, status: 'ready', checkedAt })
  } catch (error) {
    console.error('[api/health] readiness check failed', error instanceof Error ? error.message : 'unknown_error')
    res.status(503).json({ ok: false, status: 'database_unavailable', checkedAt })
  }
}
