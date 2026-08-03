import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { requireUser } from './requireUser.js'

const UNDEFINED_TABLE = '42P01'

/**
 * requireUser() + confirma que o usuário está em `platform_admins`.
 * Usado só pelos endpoints de administração (criar empresa, convidar
 * cliente) — nunca pelos endpoints que um cliente comum chama.
 */
export async function requireAdmin(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res)
  if (!user) return null

  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    if (error.code === UNDEFINED_TABLE) {
      res.status(503).json({ ok: false, error: 'not_configured', message: 'Configuração de administração pendente.' })
      return null
    }
    res.status(500).json({ ok: false, error: 'server_error', message: 'Falha ao verificar permissão.' })
    return null
  }

  if (!data) {
    res.status(403).json({ ok: false, error: 'not_admin', message: 'Acesso restrito à equipe interna.' })
    return null
  }

  return { user }
}
