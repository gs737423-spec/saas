import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../src/server/integrations/supabaseAdmin.js'
import { requireCapability } from '../src/server/auth/authorization.js'

// Dados cadastrais da PRÓPRIA empresa do usuário logado (nunca de outra —
// requireCompany já resolve isso via company_members, sem aceitar
// company_id arbitrário de cliente comum). Usado na aba "Minha Conta".
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const auth = await requireCapability(req, res, 'company.read')
  if (!auth) return

  try {
    const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, cnpj, receita_data, contact_email, contact_phone, whatsapp, logo_url')
      .eq('id', auth.companyId)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) {
      res.status(404).json({ ok: false, message: 'Empresa não encontrada.' })
      return
    }

    res.status(200).json({
      ok: true,
      company: {
        id: data.id,
        name: data.name,
        cnpj: data.cnpj,
        receitaData: data.receita_data,
        contactEmail: data.contact_email,
        contactPhone: data.contact_phone,
        whatsapp: data.whatsapp,
        logoUrl: data.logo_url,
      },
    })
  } catch (err) {
    console.error('[api/company]', err)
    res.status(500).json({ ok: false, message: 'Erro ao carregar dados da empresa.' })
  }
}
