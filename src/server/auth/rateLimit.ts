import type { VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'

const UNDEFINED_FUNCTION = '42883'

/**
 * Limite real, atômico, guardado no Postgres (ver 006_rate_limits.sql) —
 * sobrevive entre invocações de função serverless (memória local não
 * serviria, cada invocação é um processo novo). `key` deve identificar
 * quem/o quê está sendo limitado (ex: `invite:${userId}`, `ml-sync:${companyId}`).
 *
 * Se a migration 006 ainda não rodou, deixa passar (fail-open) em vez de
 * quebrar a rota inteira — mesma lógica de tolerância das outras migrations.
 */
export async function checkRateLimit(res: VercelResponse, key: string, max: number, windowSeconds: number): Promise<boolean> {
  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase.rpc('check_rate_limit', { p_key: key, p_max: max, p_window_seconds: windowSeconds })

  if (error) {
    if (error.code === UNDEFINED_FUNCTION) return true
    console.error('[rate_limit] check failed:', error.message)
    return true
  }

  if (!data) {
    res.status(429).json({ ok: false, error: 'rate_limited', message: `Muitas tentativas — aguarde e tente novamente em até ${Math.ceil(windowSeconds / 60)} min.` })
    return false
  }

  return true
}
