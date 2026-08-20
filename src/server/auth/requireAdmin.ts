import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { getBearerToken, requireUser } from './requireUser.js'
import { getAssuranceLevel, hasVerifiedMfaFactor } from './adminMfa.js'

const UNDEFINED_TABLE = '42P01'

/** Platform admins must have a verified factor and present an AAL2 session. */
async function assertVerifiedMfaFactor(userId: string): Promise<void> {
  const supabase = await getSupabaseAdmin()
  // API administrativa oficial: usa /auth/v1/admin/users/:id/factors e
  // funciona com as novas `sb_secret_...`; a rota PostgREST em `auth` não é
  // uma interface pública estável para esse propósito.
  const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId })
  if (error) throw new Error(`MFA factor lookup failed: ${error.message}`)
  if (!hasVerifiedMfaFactor(data?.factors)) throw new Error('MFA enrollment required')
}

export async function requirePlatformAdminMfa(req: VercelRequest, res: VercelResponse, userId: string): Promise<boolean> {
  try {
    await assertVerifiedMfaFactor(userId)
    if (getAssuranceLevel(getBearerToken(req)) !== 'aal2') {
      res.status(403).json({ ok: false, error: 'mfa_required', message: 'Conclua a verifica\u00e7\u00e3o em duas etapas para continuar.' })
      return false
    }
    return true
  } catch (mfaError) {
    console.error('[requireAdmin] MFA verification failed', mfaError)
    const enrollmentMissing = mfaError instanceof Error && mfaError.message === 'MFA enrollment required'
    res.status(enrollmentMissing ? 403 : 503).json({ ok: false, error: enrollmentMissing ? 'mfa_enrollment_required' : 'mfa_unavailable', message: enrollmentMissing ? 'Cadastre a verifica\u00e7\u00e3o em duas etapas para acessar a administra\u00e7\u00e3o.' : 'N\u00e3o foi poss\u00edvel verificar a autentica\u00e7\u00e3o em duas etapas.' })
    return false
  }
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

  if (!(await requirePlatformAdminMfa(req, res, user.id))) return null

  return { user }
}
