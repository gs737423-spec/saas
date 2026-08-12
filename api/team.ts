import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, findUserIdByEmail } from '../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../src/server/auth/requireCompany.js'
import { checkRateLimit } from '../src/server/auth/rateLimit.js'

// Equipe da PRÓPRIA empresa — mesmo companyId que requireCompany resolveu,
// nunca aceito do body/query pra cliente comum (só admin passa ?company_id=
// explícito, e mesmo assim continua sendo "a empresa que ele escolheu ver",
// nunca outra por engano). Cliente convida/remove gente da própria conta,
// sem depender da equipe interna pra isso.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = await requireCompany(req, res)
  if (!auth) return

  const supabase = await getSupabaseAdmin()
  const companyId = auth.companyId

  if (req.method === 'GET') {
    try {
      const { data: members, error } = await supabase
        .from('company_members')
        .select('user_id, role, created_at')
        .eq('company_id', companyId)
        .order('created_at', { ascending: true })
      if (error) throw new Error(error.message)

      if (!members || members.length === 0) {
        res.status(200).json({ ok: true, members: [] })
        return
      }

      const { data: userList, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })
      if (listError) throw new Error(listError.message)
      const emailById = new Map(userList.users.map((u) => [u.id, u.email ?? null]))

      const result = members.map((m) => ({
        userId: m.user_id,
        email: emailById.get(m.user_id) ?? null,
        role: m.role,
        addedAt: m.created_at,
        isSelf: m.user_id === auth.user.id,
      }))
      res.status(200).json({ ok: true, members: result })
    } catch (err) {
      console.error('[api/team:GET]', err)
      res.status(500).json({ ok: false, message: 'Erro ao listar equipe.' })
    }
    return
  }

  if (req.method === 'POST') {
    // 10 convites por 30min por usuário — mesmo limite do convite feito
    // pela equipe interna (api/admin/invite.ts).
    if (!(await checkRateLimit(res, `team-invite:${auth.user.id}`, 10, 1800))) return

    try {
      const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
      if (!email) {
        res.status(400).json({ ok: false, message: 'E-mail é obrigatório.' })
        return
      }

      const appBaseUrl = process.env.APP_BASE_URL
      let userId: string | null = null

      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo: appBaseUrl ? `${appBaseUrl}/redefinir-senha` : undefined,
      })

      if (inviteError) {
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
        .upsert({ user_id: userId, company_id: companyId, role: 'member' }, { onConflict: 'user_id,company_id' })
      if (memberError) throw new Error(memberError.message)

      res.status(200).json({ ok: true, userId, invited: !inviteError })
    } catch (err) {
      console.error('[api/team:POST]', err)
      const message = err instanceof Error ? err.message : 'Erro desconhecido'
      res.status(500).json({ ok: false, message: `Erro ao convidar: ${message}` })
    }
    return
  }

  if (req.method === 'DELETE') {
    if (!(await checkRateLimit(res, `team-remove:${auth.user.id}`, 20, 1800))) return

    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : typeof req.body?.userId === 'string' ? req.body.userId : ''
      if (!userId) {
        res.status(400).json({ ok: false, message: 'userId é obrigatório.' })
        return
      }
      if (userId === auth.user.id) {
        res.status(400).json({ ok: false, message: 'Você não pode remover o próprio acesso por aqui.' })
        return
      }

      // .eq('company_id', companyId) trava a remoção na própria empresa —
      // não dá pra passar userId de outra empresa e remover de lá.
      const { error } = await supabase.from('company_members').delete().eq('user_id', userId).eq('company_id', companyId)
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[api/team:DELETE]', err)
      res.status(500).json({ ok: false, message: 'Erro ao remover acesso.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
