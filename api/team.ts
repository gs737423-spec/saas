import type { VercelRequest, VercelResponse } from '@vercel/node'
import { findUserIdByEmail, getSupabaseAdmin } from '../src/server/integrations/supabaseAdmin.js'
import { normalizeCompanyRole } from '../src/server/auth/requireCompany.js'
import { canAssignRole, canRemoveRole, requireCapability, type Capability } from '../src/server/auth/authorization.js'
import { checkRateLimit } from '../src/server/auth/rateLimit.js'
import { writeSecurityAudit } from '../src/server/security/auditLog.js'

function methodCapability(method?: string): Capability | null {
  if (method === 'GET') return 'team.read'
  if (method === 'POST') return 'team.invite'
  if (method === 'DELETE') return 'team.remove'
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const capability = methodCapability(req.method)
  if (!capability) {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }
  const auth = await requireCapability(req, res, capability)
  if (!auth) return

  const supabase = await getSupabaseAdmin()
  const companyId = auth.companyId

  if (req.method === 'GET') {
    try {
      const { data: members, error } = await supabase.from('company_members').select('user_id, role, created_at').eq('company_id', companyId).order('created_at', { ascending: true })
      if (error) throw new Error(error.message)
      const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listError) throw new Error(listError.message)
      const emailById = new Map(userList.users.map((user) => [user.id, user.email ?? null]))
      res.status(200).json({ ok: true, members: (members ?? []).map((member) => ({ userId: member.user_id, email: emailById.get(member.user_id) ?? null, role: member.role, addedAt: member.created_at, isSelf: member.user_id === auth.userId })) })
    } catch {
      res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Erro ao listar equipe.' }, requestId: auth.requestId })
    }
    return
  }

  if (req.method === 'POST') {
    if (!(await checkRateLimit(res, `team-invite:${auth.userId}`, 10, 1800, { req, route: '/api/team', policy: 'critical' }))) return
    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      const role = normalizeCompanyRole(req.body?.role ?? 'member')
      if (!email || email.length > 320 || !/^\S+@\S+\.\S+$/.test(email)) {
        res.status(400).json({ ok: false, error: { code: 'INVALID_EMAIL', message: 'E-mail inv\u00e1lido.' }, requestId: auth.requestId })
        return
      }
      const canAssign = auth.isPlatformAdmin ? ['admin', 'manager', 'member', 'viewer'].includes(role) : canAssignRole(auth.role, role)
      if (!canAssign) {
        res.status(403).json({ ok: false, error: { code: 'ROLE_NOT_ASSIGNABLE', message: 'A role solicitada n\u00e3o pode ser atribu\u00edda.' }, requestId: auth.requestId })
        return
      }

      const appBaseUrl = process.env.APP_BASE_URL
      let userId: string | null = null
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, { redirectTo: appBaseUrl ? `${appBaseUrl}/redefinir-senha` : undefined })
      if (inviteError) {
        if (!/already.*registered|already.*exists/i.test(inviteError.message)) throw new Error('invite_failed')
        userId = await findUserIdByEmail(supabase, email)
        if (!userId) throw new Error('user_lookup_failed')
      } else {
        userId = inviteData.user.id
      }

      const { error } = await supabase.from('company_members').upsert(
        { user_id: userId, company_id: companyId, role },
        { onConflict: 'user_id,company_id', ignoreDuplicates: true },
      )
      if (error) throw new Error(error.message)
      await writeSecurityAudit({ requestId: auth.requestId, actorUserId: auth.userId, companyId, action: 'team.invite', targetType: 'user', targetId: userId, metadata: { role } })
      res.status(200).json({ ok: true, userId, invited: !inviteError })
    } catch {
      res.status(500).json({ ok: false, error: { code: 'INVITE_FAILED', message: 'N\u00e3o foi poss\u00edvel concluir o convite.' }, requestId: auth.requestId })
    }
    return
  }

  if (!(await checkRateLimit(res, `team-remove:${auth.userId}`, 20, 1800, { req, route: '/api/team', policy: 'critical' }))) return
  try {
    const userId = typeof req.query.userId === 'string' ? req.query.userId : typeof req.body?.userId === 'string' ? req.body.userId : ''
    if (!userId || userId === auth.userId) {
      res.status(400).json({ ok: false, error: { code: 'INVALID_TARGET', message: 'Membro inv\u00e1lido para remo\u00e7\u00e3o.' }, requestId: auth.requestId })
      return
    }
    const { data: target, error: targetError } = await supabase.from('company_members').select('user_id, role').eq('user_id', userId).eq('company_id', companyId).maybeSingle()
    if (targetError) throw new Error(targetError.message)
    if (!target) {
      res.status(404).json({ ok: false, error: { code: 'MEMBER_NOT_FOUND', message: 'Membro n\u00e3o encontrado.' }, requestId: auth.requestId })
      return
    }
    const targetRole = normalizeCompanyRole(target.role)
    const canRemove = auth.isPlatformAdmin ? targetRole !== 'owner' && targetRole !== 'unknown' : canRemoveRole(auth.role, targetRole)
    if (!canRemove) {
      res.status(403).json({ ok: false, error: { code: 'ROLE_NOT_REMOVABLE', message: 'Este acesso n\u00e3o pode ser removido.' }, requestId: auth.requestId })
      return
    }
    const { error } = await supabase.from('company_members').delete().eq('user_id', userId).eq('company_id', companyId)
    if (error) throw new Error(error.message)
    await writeSecurityAudit({ requestId: auth.requestId, actorUserId: auth.userId, companyId, action: 'team.remove', targetType: 'user', targetId: userId, metadata: { targetRole } })
    res.status(200).json({ ok: true })
  } catch {
    res.status(500).json({ ok: false, error: { code: 'REMOVE_FAILED', message: 'Erro ao remover acesso.' }, requestId: auth.requestId })
  }
}
