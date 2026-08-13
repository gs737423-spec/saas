import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, findUserIdByEmail } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'
import { normalizeCompanyRole } from '../../src/server/auth/requireCompany.js'
import { writeSecurityAudit } from '../../src/server/security/auditLog.js'
import { getRequestId } from '../../src/server/security/requestContext.js'

// Convida um cliente por e-mail (Supabase Auth manda o e-mail de convite —
// o cliente define a própria senha no link, ninguém da equipe cria/vê
// senha de ninguém) e vincula à empresa em company_members.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = getRequestId(req, res)
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const admin = await requireAdmin(req, res)
  if (!admin) return

  // 10 convites por 30min por admin — impede loop de spam de convite
  // (cada convite dispara e-mail real, custa cota do provedor de e-mail).
  if (!(await checkRateLimit(res, `invite:${admin.user.id}`, 10, 1800, { req, route: '/api/admin/invite', policy: 'critical' }))) return

  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
    const companyId = typeof req.body?.companyId === 'string' ? req.body.companyId : ''
    const role = normalizeCompanyRole(req.body?.role ?? 'member')

    if (!email || !companyId) {
      res.status(400).json({ ok: false, message: 'E-mail e empresa são obrigatórios.' })
      return
    }
    if (!['admin', 'manager', 'member', 'viewer'].includes(role)) {
      res.status(400).json({ ok: false, error: { code: 'INVALID_ROLE', message: 'Role inv\u00e1lida.' }, requestId })
      return
    }

    const supabase = await getSupabaseAdmin()
    const appBaseUrl = process.env.APP_BASE_URL

    const { data: company, error: companyError } = await supabase.from('companies').select('id').eq('id', companyId).maybeSingle()
    if (companyError) throw new Error(companyError.message)
    if (!company) {
      res.status(404).json({ ok: false, message: 'Empresa não encontrada.' })
      return
    }

    let userId: string | null = null

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: appBaseUrl ? `${appBaseUrl}/redefinir-senha` : undefined,
    })

    if (inviteError) {
      // Usuário já existe no Supabase Auth — não é erro, só precisa achar o
      // id dele em vez de criar de novo. listUsers pagina; perPage generoso
      // é suficiente pro volume esperado nesta fase (dezenas de clientes).
      const alreadyExists = /already.*registered|already.*exists/i.test(inviteError.message)
      if (!alreadyExists) throw new Error(inviteError.message)

      const existingId = await findUserIdByEmail(supabase, email)
      if (!existingId) throw new Error('Usuário já registrado, mas não encontrado na listagem.')
      userId = existingId
    } else {
      userId = inviteData.user.id
    }

    const { error: memberError } = await supabase
      .from('company_members')
      .upsert({ user_id: userId, company_id: companyId, role }, { onConflict: 'user_id,company_id' })
    if (memberError) throw new Error(memberError.message)

    await writeSecurityAudit({ requestId, actorUserId: admin.user.id, companyId, action: 'team.invite', targetType: 'user', targetId: userId, metadata: { role, platformAdmin: true } })

    res.status(200).json({ ok: true, userId, invited: !inviteError })
  } catch {
    const message = 'N\u00e3o foi poss\u00edvel concluir o convite.'
    res.status(500).json({ ok: false, message: `Erro ao convidar usuário: ${message}` })
  }
}
