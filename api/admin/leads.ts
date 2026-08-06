import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'

const UNDEFINED_TABLE = '42P01'
const LEAD_COLUMNS = 'id, name, whatsapp, company, cnpj, marketplaces, message, receita_data, status, created_at'
const STATUSES = ['pendente', 'aprovado', 'recusado'] as const

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
}

function mapLead(l: {
  id: string
  name: string
  whatsapp: string
  company: string
  cnpj: string
  marketplaces: string | null
  message: string
  receita_data: ReceitaData | null
  status: string
  created_at: string
}) {
  return {
    id: l.id,
    name: l.name,
    whatsapp: l.whatsapp,
    company: l.company,
    cnpj: l.cnpj,
    marketplaces: l.marketplaces,
    message: l.message,
    receitaData: l.receita_data,
    status: l.status,
    createdAt: l.created_at,
  }
}

// Lista/atualiza solicitações reais vindas do formulário do site (grava em
// api/leads.ts) — troca o dado de exemplo que src/pages/AdminLeads.tsx
// usava (MOCK_LEADS) por linha real da tabela `leads` (ver migration 013).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const supabase = await getSupabaseAdmin()

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select(LEAD_COLUMNS)
        .eq('status', 'pendente')
        .order('created_at', { ascending: false })
      if (error) throw error

      res.status(200).json({ ok: true, leads: (data ?? []).map(mapLead) })
    } catch (err) {
      const code = (err as { code?: string })?.code
      if (code === UNDEFINED_TABLE) {
        res.status(200).json({ ok: true, leads: [] })
        return
      }
      console.error('[api/admin/leads:GET]', err)
      res.status(500).json({ ok: false, message: 'Erro ao listar solicitações.' })
    }
    return
  }

  if (req.method === 'PATCH') {
    try {
      const id = typeof req.body?.id === 'string' ? req.body.id : ''
      const status = typeof req.body?.status === 'string' ? req.body.status : ''
      if (!id || !STATUSES.includes(status as typeof STATUSES[number])) {
        res.status(400).json({ ok: false, message: 'id e status válido são obrigatórios.' })
        return
      }

      const { error } = await supabase.from('leads').update({ status }).eq('id', id)
      if (error) throw new Error(error.message)

      res.status(200).json({ ok: true })
    } catch (err) {
      console.error('[api/admin/leads:PATCH]', err)
      res.status(500).json({ ok: false, message: 'Erro ao atualizar solicitação.' })
    }
    return
  }

  res.status(405).json({ ok: false, error: 'method_not_allowed' })
}
