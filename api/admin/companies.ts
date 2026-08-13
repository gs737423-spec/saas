import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'
import { checkRateLimit } from '../../src/server/auth/rateLimit.js'
import { getRequestId } from '../../src/server/security/requestContext.js'

const DELETE_LIMIT = { max: 10, windowSeconds: 1800 }
const COMPANY_COLUMNS = 'id, name, created_at, contact_email, contact_phone, notes, cnpj, whatsapp, website, status, receita_data, logo_url'
const STATUSES = ['onboarding', 'ativo', 'em_risco', 'suspenso'] as const

// Snapshot da Receita Federal — mesmo shape de CnpjInfo (api/cnpj-lookup.ts),
// gravado como veio, sem reformatar. Todos os campos são opcionais porque a
// consulta pode ter vindo parcial (ex: lead antigo sem alguns dados).
interface ReceitaData {
  razaoSocial?: string | null
  nomeFantasia?: string | null
  situacaoCadastral?: string | null
  dataSituacaoCadastral?: string | null
  dataInicioAtividade?: string | null
  atividadePrincipal?: string | null
  cnaeCodigo?: string | null
  cnaesSecundarios?: string[]
  naturezaJuridica?: string | null
  porte?: string | null
  capitalSocial?: number | null
  telefone?: string | null
  email?: string | null
  endereco?: string | null
  matrizFilial?: string | null
  simplesNacional?: string | null
  socios?: string[]
  inscricaoEstadual?: string | null
}

function mapCompany(c: {
  id: string
  name: string
  created_at: string
  contact_email: string | null
  contact_phone: string | null
  notes: string | null
  cnpj: string | null
  whatsapp: string | null
  website: string | null
  status: string
  receita_data: ReceitaData | null
  logo_url: string | null
  company_members?: { count: number }[]
}) {
  return {
    id: c.id,
    name: c.name,
    createdAt: c.created_at,
    contactEmail: c.contact_email,
    contactPhone: c.contact_phone,
    notes: c.notes,
    cnpj: c.cnpj,
    whatsapp: c.whatsapp,
    website: c.website,
    status: c.status,
    receitaData: c.receita_data,
    logoUrl: c.logo_url,
    memberCount: Array.isArray(c.company_members) ? (c.company_members[0]?.count ?? 0) : 0,
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const requestId = getRequestId(req, res)
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('companies')
        .select(`${COMPANY_COLUMNS}, company_members(count)`)
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
    if (!(await checkRateLimit(res, `create-company:${admin.user.id}`, 20, 1800, { req, route: '/api/admin/companies', policy: 'critical' }))) return

    try {
      const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
      const contactEmail = typeof req.body?.contactEmail === 'string' ? req.body.contactEmail.trim() || null : null
      const contactPhone = typeof req.body?.contactPhone === 'string' ? req.body.contactPhone.trim() || null : null
      const notes = typeof req.body?.notes === 'string' ? req.body.notes.trim() || null : null
      const cnpj = typeof req.body?.cnpj === 'string' ? req.body.cnpj.trim() || null : null
      const whatsapp = typeof req.body?.whatsapp === 'string' ? req.body.whatsapp.trim() || null : null
      const website = typeof req.body?.website === 'string' ? req.body.website.trim() || null : null
      const receitaData = req.body?.receitaData && typeof req.body.receitaData === 'object' ? (req.body.receitaData as ReceitaData) : null
      if (!name) {
        res.status(400).json({ ok: false, message: 'Nome da empresa é obrigatório.' })
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .insert({ name, contact_email: contactEmail, contact_phone: contactPhone, notes, cnpj, whatsapp, website, receita_data: receitaData })
        .select(COMPANY_COLUMNS)
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

      const body = req.body ?? {}
      const update: Record<string, string | null | ReceitaData> = {}
      if (typeof body.name === 'string' && body.name.trim()) update.name = body.name.trim()
      if ('contactEmail' in body) update.contact_email = typeof body.contactEmail === 'string' ? body.contactEmail.trim() || null : null
      if ('contactPhone' in body) update.contact_phone = typeof body.contactPhone === 'string' ? body.contactPhone.trim() || null : null
      if ('notes' in body) update.notes = typeof body.notes === 'string' ? body.notes.trim() || null : null
      if ('cnpj' in body) update.cnpj = typeof body.cnpj === 'string' ? body.cnpj.trim() || null : null
      if ('whatsapp' in body) update.whatsapp = typeof body.whatsapp === 'string' ? body.whatsapp.trim() || null : null
      if ('website' in body) update.website = typeof body.website === 'string' ? body.website.trim() || null : null
      if ('status' in body && STATUSES.includes(body.status)) update.status = body.status
      if (body.receitaData && typeof body.receitaData === 'object') update.receita_data = body.receitaData as ReceitaData

      if (Object.keys(update).length === 0) {
        res.status(400).json({ ok: false, message: 'Nenhum campo pra atualizar.' })
        return
      }

      const { data, error } = await supabase
        .from('companies')
        .update(update)
        .eq('id', id)
        .select(`${COMPANY_COLUMNS}, company_members(count)`)
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
    if (!(await checkRateLimit(res, `delete-company:${admin.user.id}`, DELETE_LIMIT.max, DELETE_LIMIT.windowSeconds, { req, route: '/api/admin/companies', policy: 'critical' }))) return

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
      const { data, error } = await supabase.rpc('delete_company_if_empty', { p_company_id: id, p_actor_user_id: admin.user.id, p_request_id: requestId })
      if (error) {
        if (error.code === '42883') {
          res.status(503).json({ ok: false, error: { code: 'SECURITY_MIGRATION_REQUIRED', message: 'Exclus\u00e3o bloqueada at\u00e9 a migration de seguran\u00e7a ser aplicada.' }, requestId })
          return
        }
        throw new Error(error.message)
      }
      const result = data as { status?: string; dependencies?: Record<string, number> } | null
      if (result?.status === 'blocked') {
        res.status(409).json({ ok: false, error: { code: 'COMPANY_HAS_DEPENDENT_DATA', message: 'A empresa possui dados vinculados e n\u00e3o pode ser exclu\u00edda.', dependencies: result.dependencies ?? {} }, requestId })
        return
      }
      if (result?.status === 'not_found') {
        res.status(404).json({ ok: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Empresa n\u00e3o encontrada.' }, requestId })
        return
      }
      res.status(200).json({ ok: true, requestId })
    } catch (err) {
      console.error('[api/admin/companies:DELETE]', err)
      res.status(500).json({ ok: false, message: 'Erro ao excluir empresa.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
