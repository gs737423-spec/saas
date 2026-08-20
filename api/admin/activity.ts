import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireAdmin } from '../../src/server/auth/requireAdmin.js'

// Feed de atividade real da plataforma inteira (todas as empresas) — puxa de
// sync_logs, a mesma tabela que já alimenta o histórico de integração de
// cada cliente. Sem isso não teria "atividade recente" real pra mostrar.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 15))
    const supabase = await getSupabaseAdmin()

    const { data: logs, error } = await supabase
      .from('sync_logs')
      .select('id, company_id, provider, event_type, status, message, created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(error.message)

    const companyIds = [...new Set((logs ?? []).map((l) => l.company_id).filter(Boolean))]
    const { data: companies } = companyIds.length
      ? await supabase.from('companies').select('id, name').in('id', companyIds)
      : { data: [] as { id: string; name: string }[] }
    const nameById = new Map((companies ?? []).map((c) => [c.id, c.name]))

    const activity = (logs ?? []).map((l) => ({
      id: l.id,
      companyId: l.company_id,
      companyName: l.company_id ? nameById.get(l.company_id) ?? null : null,
      provider: l.provider,
      eventType: l.event_type,
      status: l.status,
      message: l.message,
      createdAt: l.created_at,
    }))

    res.status(200).json({ ok: true, activity })
  } catch (err) {
    console.error('[api/admin/activity]', err)
    res.status(500).json({ ok: false, message: 'Erro ao carregar atividade.' })
  }
}
