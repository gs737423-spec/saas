import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { requireUser } from './requireUser.js'

/** Postgres "relation does not exist" — a migration correspondente ainda
 *  não rodou no banco. Tratado como "tabela vazia" em vez de erro 500, pra
 *  aplicar as migrations em ordens/momentos ligeiramente diferentes nunca
 *  derrubar TODO endpoint que passa por aqui — só reduz funcionalidade
 *  (sem admin ainda, ou sem empresa ainda) até a migration certa rodar. */
const UNDEFINED_TABLE = '42P01'

/**
 * requireUser() + resolve qual empresa a chamada deve enxergar.
 *
 * Cliente normal: sempre a própria empresa (via `company_members`), nunca
 * lê `req.query.company_id` — um cliente não pode escolher ver dado de
 * outra empresa alterando a URL.
 *
 * Usuário da casa (platform_admins, ver 005): pode consultar qualquer
 * empresa, mas só se passar `?company_id=` explícito na query — sem isso
 * cai em 400, nunca escolhe uma empresa "por padrão" silenciosamente.
 *
 * Usa getSupabaseAdmin (service_role) porque este código já roda em
 * contexto de servidor confiável — não é um jeito de contornar RLS pro
 * client, é a mesma consulta que as policies de 003/005 já autorizam.
 */
export async function requireCompany(req: VercelRequest, res: VercelResponse) {
  const user = await requireUser(req, res)
  if (!user) return null

  const supabase = await getSupabaseAdmin()

  const { data: adminRow, error: adminError } = await supabase
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (adminError && adminError.code !== UNDEFINED_TABLE) {
    res.status(500).json({ ok: false, error: 'server_error', message: 'Falha ao verificar permissão de administrador.' })
    return null
  }

  const isAdmin = !!adminRow

  if (isAdmin) {
    const requestedCompanyId = typeof req.query.company_id === 'string' ? req.query.company_id : null
    if (!requestedCompanyId) {
      res.status(400).json({ ok: false, error: 'missing_company_id', message: 'Informe ?company_id= — administrador precisa escolher a empresa explicitamente.' })
      return null
    }
    return { user, companyId: requestedCompanyId, isAdmin: true as const }
  }

  const { data, error } = await supabase
    .from('company_members')
    .select('company_id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (error) {
    if (error.code === UNDEFINED_TABLE) {
      res.status(503).json({ ok: false, error: 'not_configured', message: 'Configuração multiempresa pendente — migrations do banco ainda não aplicadas.' })
      return null
    }
    res.status(500).json({ ok: false, error: 'server_error', message: 'Falha ao resolver empresa do usuário.' })
    return null
  }

  if (!data) {
    res.status(403).json({ ok: false, error: 'no_company', message: 'Usuário não está vinculado a nenhuma empresa.' })
    return null
  }

  return { user, companyId: data.company_id as string, isAdmin: false as const }
}
