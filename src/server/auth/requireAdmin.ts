import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { getBearerToken, requireUser } from './requireUser.js'

const UNDEFINED_TABLE = '42P01'

function getAssuranceLevel(token: string): 'aal1' | 'aal2' {
  try {
    const payload = token.split('.')[1]
    if (!payload) return 'aal1'
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { aal?: unknown }
    return claims.aal === 'aal2' ? 'aal2' : 'aal1'
  } catch {
    return 'aal1'
  }
}

/** MFA continua opt-in: um admin sem fator verificado pode seguir em AAL1.
 * Assim que ele cadastra TOTP, toda API administrativa exige AAL2. A consulta
 * é server-side, filtrada pelo id do usuário já validado, e falha fechada. */
async function hasVerifiedMfaFactor(userId: string): Promise<boolean> {
  const supabase = await getSupabaseAdmin()
  // API administrativa oficial: usa /auth/v1/admin/users/:id/factors e
  // funciona com as novas `sb_secret_...`; a rota PostgREST em `auth` não é
  // uma interface pública estável para esse propósito.
  const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId })
  if (error) throw new Error(`MFA factor lookup failed: ${error.message}`)
  return (data?.factors ?? []).some((factor) => factor.status === 'verified')
}

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

  try {
    if (await hasVerifiedMfaFactor(user.id)) {
      const token = getBearerToken(req)
      if (!token || getAssuranceLevel(token) !== 'aal2') {
        res.status(403).json({ ok: false, error: 'mfa_required', message: 'Conclua a verifica\u00e7\u00e3o em duas etapas para continuar.' })
        return null
      }
    }
  } catch (mfaError) {
    console.error('[requireAdmin] MFA verification failed', mfaError)
    res.status(503).json({ ok: false, error: 'mfa_unavailable', message: 'N\u00e3o foi poss\u00edvel verificar a autentica\u00e7\u00e3o em duas etapas.' })
    return null
  }

  return { user }
}
