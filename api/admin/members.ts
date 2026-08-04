import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'

// Lista/remove membros de uma empresa. E-mail não fica em company_members
// (só user_id) — precisa cruzar com auth.admin.listUsers(), não dá pra ler
// auth.users direto via postgrest.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : ''
      if (!companyId) {
        res.status(400).json({ ok: false, message: 'companyId é obrigatório.' })
        return
      }

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
      }))
      res.status(200).json({ ok: true, members: result })
    } catch (err) {
      console.error('[api/admin/members:GET]', err)
      res.status(500).json({ ok: false, message: 'Erro ao listar membros.' })
    }
    return
  }

  if (req.method === 'DELETE') {
    if (!(await checkRateLimit(res, `remove-member:${admin.user.id}`, 20, 1800))) return

    try {
      const userId = typeof req.query.userId === 'string' ? req.query.userId : typeof req.body?.userId === 'string' ? req.body.userId : ''
      const companyId = typeof req.query.companyId === 'string' ? req.query.companyId : typeof req.body?.companyId === 'string' ? req.body.companyId : ''
      if (!userId || !companyId) {
        res.status(400).json({ ok: false, message: 'userId e companyId são obrigatórios.' })
        return
      }

      const { error } = await supabase.from('company_members').delete().eq('user_id', userId).eq('company_id', companyId)
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[api/admin/members:DELETE]', err)
      res.status(500).json({ ok: false, message: 'Erro ao remover acesso.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
