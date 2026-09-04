import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'

/** Busca sob demanda, limitada a seis resultados. Não reutiliza o endpoint
 * analítico de Produtos, pois pesquisar na barra global não justifica baixar
 * catálogo, estoque e histórico de vendas inteiros. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (getMissingEnvVars(CORE_ENV_VARS).length > 0) {
      res.status(200).json({ ok: false, items: [] })
      return
    }
    const auth = await requireCompany(req, res)
    if (!auth) return
    const q = (Array.isArray(req.query.q) ? req.query.q[0] : req.query.q)?.trim() ?? ''
    if (q.length < 2 || q.length > 120) {
      res.status(200).json({ ok: true, items: [] })
      return
    }

    const escaped = q.replace(/[^0-9A-Za-zÀ-ÿ\s-]/g, ' ').replace(/\s+/g, ' ').trim()
    if (escaped.length < 2) {
      res.status(200).json({ ok: true, items: [] })
      return
    }
    const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
      .from('marketplace_products')
      .select('connection_id, external_product_id, sku, title, category_name')
      .eq('company_id', auth.companyId)
      .eq('active', true)
      .or(`title.ilike.%${escaped}%,sku.ilike.%${escaped}%,category_name.ilike.%${escaped}%`)
      .order('title', { ascending: true })
      .limit(6)
    if (error) throw new Error(error.message)
    res.status(200).json({ ok: true, items: (data ?? []).map((row) => ({
      id: row.external_product_id,
      connectionId: row.connection_id,
      sku: row.sku,
      name: row.title,
      category: row.category_name,
    })) })
  } catch (error) {
    console.error('[api/dashboard/product-search]', error)
    res.status(200).json({ ok: false, items: [] })
  }
}
