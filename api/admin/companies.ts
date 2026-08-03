import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'

const DELETE_LIMIT = { max: 10, windowSeconds: 1800 }

function mapCompany(c: {
  id: string
  name: string
  created_at: string
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  company_members?: { count: number }[]
}) {
  return {
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    contactEmail: c.contact_email,
    contactPhone: c.contact_phone,
    notes: c.notes,
    memberCount: Array.isArray(c.company_members) ? (c.company_members[0]?.count ?? 0) : 0,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, created_at, contact_email, contact_phone, notes, company_members(count)')
        .order('created_at', { ascending: false })
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true, companies: (data ?? []).map(mapCompany) })
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
      const contactEmail = typeof req.body?.contactEmail === 'string' ? req.body.contactEmail.trim() || null : null
      const contactPhone = typeof req.body?.contactPhone === 'string' ? req.body.contactPhone.trim() || null : null
      const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() || null : null
      if (!name) {
        res.status(400).json({ ok: false, message: 'Nome da empresa é obrigatório.' })
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({ name, contact_email: contactEmail, contact_phone: contactPhone, notes })
        .select('id, name, created_at, contact_email, contact_phone, notes')
        .single()
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true, company: mapCompany({ ...data, company_members: [{ count: 0 }] }) })
    } catch (err) {
      console.error('[api/admin/companies:POST]', err)
      res.status(500).json({ ok: false, message: 'Erro ao criar empresa.' })
    }
    return
  }

  if (req.method === 'PATCH') {
    try {
      const id = typeof req.body?.id === 'string' ? req.body.id : ''
      if (!id) {
        res.status(400).json({ ok: false, message: 'ID da empresa é obrigatório.' })
        return
      }

      const update: Record<string, string | null> = {}
      if (typeof req.body?.name === 'string' && req.body.name.trim()) update.name = req.body.name.trim()
      if ('contactEmail' in (req.body ?? {})) update.contact_email = typeof req.body.contactEmail === 'string' ? req.body.contactEmail.trim() || null : null
      if ('contactPhone' in (req.body ?? {})) update.contact_phone = typeof req.body.contactPhone === 'string' ? req.body.contactPhone.trim() || null : null
      if ('notes' in (req.body ?? {})) update.notes = typeof req.body.notes === 'string' ? req.body.notes.trim() || null : null

      if (Object.keys(update).length === 0) {
        res.status(400).json({ ok: false, message: 'Nenhum campo pra atualizar.' })
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .update(update)
        .eq('id', id)
        .select('id, name, created_at, contact_email, contact_phone, notes, company_members(count)')
        .single()
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true, company: mapCompany(data) })
    } catch (err) {
      console.error('[api/admin/companies:PATCH]', err)
      res.status(500).json({ ok: false, message: 'Erro ao atualizar empresa.' })
    }
    return
  }

  if (req.method === 'DELETE') {
    if (!(await checkRateLimit(res, `delete-company:${admin.user.id}`, DELETE_LIMIT.max, DELETE_LIMIT.windowSeconds))) return

    try {
      const id = typeof req.query.id === 'string' ? req.query.id : typeof req.body?.id === 'string' ? req.body.id : ''
      if (!id) {
        res.status(400).json({ ok: false, message: 'ID da empresa é obrigatório.' })
        return
      }

      // company_members tem FK on delete cascade (ver 003) — remove o vínculo
      // junto. Dado de integração (marketplace_connections/orders/etc, ver
      // 001/002/007) NÃO é apagado aqui: company_id lá é texto solto, não FK,
      // e apagar histórico de pedidos/faturamento de um cliente é operação
      // destrutiva demais pra acontecer sozinha junto de "excluir empresa" —
      // fica órfão mas inacessível (RLS já bloqueia sem membership).
      const { error } = await supabase.from('companies').delete().eq('id', id)
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[api/admin/companies:DELETE]', err)
      res.status(500).json({ ok: false, message: 'Erro ao excluir empresa.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
