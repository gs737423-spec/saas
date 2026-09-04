import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'

interface AlertRow {
  id: string
  rule: 'Estoque zerado' | 'Estoque baixo'
  message: string
  severity: 'danger' | 'warning'
  sku: string | null
}

/** A barra global não pode carregar todo o catálogo só para mostrar até seis
 * alertas. Esta leitura é limitada, tenant-scoped e independente da tabela
 * detalhada de Produtos. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (getMissingEnvVars(CORE_ENV_VARS).length > 0) {
      res.status(200).json({ ok: false, alerts: [] })
      return
    }
    const auth = await requireCompany(req, res)
    if (!auth) return

    const supabase = await getSupabaseAdmin()
    const { data: rows, error } = await supabase
      .from('marketplace_inventory')
      .select('connection_id, external_product_id, sku, title, available_quantity')
      .eq('company_id', auth.companyId)
      .eq('active', true)
      .lte('available_quantity', 10)
      .order('available_quantity', { ascending: true })
      .limit(8)
    if (error) throw new Error(error.message)

    const alerts: AlertRow[] = (rows ?? []).map((row) => {
      const stock = Number(row.available_quantity)
      const empty = stock === 0
      const rule: AlertRow['rule'] = empty ? 'Estoque zerado' : 'Estoque baixo'
      const severity: AlertRow['severity'] = empty ? 'danger' : 'warning'
      return {
        id: `stock:${row.connection_id}:${row.external_product_id}`,
        rule,
        message: empty ? `${row.title} está sem estoque disponível.` : `${row.title} tem só ${stock} unidade(s) disponíveis.`,
        severity,
        sku: row.sku,
      }
    }).slice(0, 6)
    res.status(200).json({ ok: true, alerts })
  } catch (error) {
    console.error('[api/dashboard/alerts]', error)
    res.status(200).json({ ok: false, alerts: [] })
  }
}
