import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, created_at, company_members(count)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)

      const companies = (data ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
        memberCount: Array.isArray(c.company_members) ? (c.company_members[0]?.count ?? 0) : 0,
      }))
      res.status(200).json({ ok: true, companies })
    } catch (err) {
      console.error('[api/admin/companies:GET]', err)
      res.status(500).json({ ok: false, message: 'Erro ao listar empresas.' })
    }
    return
  }

  if (req.method === 'POST') {
    // 20 empresas criadas por 30min por admin — bem acima do uso real
    // (contrato novo é evento raro), só trava abuso automatizado.
    if (!(await checkRateLimit(res, `create-company:${admin.user.id}`, 20, 1800))) return

    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
      if (!name) {
        res.status(400).json({ ok: false, message: 'Nome da empresa é obrigatório.' })
        return
      }

      const { data, error } = await supabase.from('companies').insert({ name }).select('id, name, created_at').single()
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true, company: { id: data.id, name: data.name, createdAt: data.created_at, memberCount: 0 } })
    } catch (err) {
      console.error('[api/admin/companies:POST]', err)
      res.status(500).json({ ok: false, message: 'Erro ao criar empresa.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
