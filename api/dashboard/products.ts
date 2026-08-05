import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { DashboardProduct, DashboardProductsResponse } from '../../src/server/dashboardProducts.js'

type ProductsApiResponse = DashboardProductsResponse

interface OrderItemAgg {
  quantity: number
  unit_price: number
  external_product_id: string | null
  sku: string | null
}

function aggregateByProduct(rows: OrderItemAgg[]): Map<string, { revenue: number; units: number }> {
  const map = new Map<string, { revenue: number; units: number }>()
  for (const row of rows) {
    const key = row.external_product_id ?? row.sku ?? ''
    if (!key) continue
    const prev = map.get(key) ?? { revenue: 0, units: 0 }
    prev.revenue += Number(row.unit_price ?? 0) * Number(row.quantity ?? 0)
    prev.units += Number(row.quantity ?? 0)
    map.set(key, prev)
  }
  return map
}

// Produtos reais: junta marketplace_products (catálogo+categoria+custo
// opcional) + marketplace_inventory (estoque) + order_items de pedidos
// pagos (receita/unidades no período, e no período anterior pra tendência
// real por comparação). Nunca fabrica margem/tendência quando falta base.
async function handlePatchCost(req: VercelRequest, res: VercelResponse) {
  const auth = await requireCompany(req, res)
  if (!auth) return

  const { externalProductId, costPrice } = (req.body ?? {}) as { externalProductId?: string; costPrice?: number | null }
  if (!externalProductId) {
    res.status(400).json({ ok: false, message: 'externalProductId é obrigatório.' })
    return
  }
  if (costPrice !== null && (typeof costPrice !== 'number' || !Number.isFinite(costPrice) || costPrice < 0)) {
    res.status(400).json({ ok: false, message: 'costPrice deve ser um número >= 0 ou null.' })
    return
  }

  const supabase = await getSupabaseAdmin()
  const { error } = await supabase
    .from('marketplace_products')
    .update({ cost_price: costPrice })
    .eq('company_id', auth.companyId)
    .eq('external_product_id', externalProductId)

  if (error) {
    res.status(500).json({ ok: false, message: 'Erro ao salvar custo.' })
    return
  }
  res.status(200).json({ ok: true })
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      res.status(200).json({ ok: false, source: 'config_missing', items: [], message: 'Configuração do Supabase pendente.' } satisfies ProductsApiResponse)
      return
    }

    if (req.method === 'PATCH') {
      await handlePatchCost(req, res)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
    const now = Date.now()
    const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString()
    const prevSince = new Date(now - 2 * days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connection, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, status')
      .eq('provider', 'mercadolivre')
      .eq('company_id', auth.companyId)
      .maybeSingle()
    if (connError) throw new Error(connError.message)

    if (!connection || connection.status !== 'connected') {
      res.status(200).json({ ok: true, source: 'demo', items: [] } satisfies ProductsApiResponse)
      return
    }

    const { data: products, error: productsError } = await supabase
      .from('marketplace_products')
      .select('external_product_id, sku, title, price, status, category_name, cost_price')
      .eq('connection_id', connection.id)
      .eq('company_id', auth.companyId)
    if (productsError) throw new Error(productsError.message)

    if (!products || products.length === 0) {
      res.status(200).json({ ok: true, source: 'demo', items: [] } satisfies ProductsApiResponse)
      return
    }

    const { data: inventoryRows } = await supabase
      .from('marketplace_inventory')
      .select('external_product_id, available_quantity')
      .eq('connection_id', connection.id)
      .eq('company_id', auth.companyId)
    const stockByExternalId = new Map((inventoryRows ?? []).map((r) => [r.external_product_id, r.available_quantity]))

    const { data: currentItems } = await supabase
      .from('order_items')
      .select('quantity, unit_price, external_product_id, sku, orders!inner(status, ordered_at)')
      .eq('company_id', auth.companyId)
      .eq('orders.status', 'paid')
      .gte('orders.ordered_at', since)
    const currentByProduct = aggregateByProduct((currentItems ?? []) as unknown as OrderItemAgg[])

    const { data: previousItems } = await supabase
      .from('order_items')
      .select('quantity, unit_price, external_product_id, sku, orders!inner(status, ordered_at)')
      .eq('company_id', auth.companyId)
      .eq('orders.status', 'paid')
      .gte('orders.ordered_at', prevSince)
      .lt('orders.ordered_at', since)
    const previousByProduct = aggregateByProduct((previousItems ?? []) as unknown as OrderItemAgg[])

    const totalRevenue = [...currentByProduct.values()].reduce((s, v) => s + v.revenue, 0)

    const items: DashboardProduct[] = products.map((p) => {
      const agg = currentByProduct.get(p.external_product_id) ?? { revenue: 0, units: 0 }
      const prevAgg = previousByProduct.get(p.external_product_id)
      const trend = prevAgg && prevAgg.revenue > 0 ? ((agg.revenue - prevAgg.revenue) / prevAgg.revenue) * 100 : null
      const costPrice = p.cost_price === null || p.cost_price === undefined ? null : Number(p.cost_price)
      const margin = costPrice !== null && p.price > 0 ? ((p.price - costPrice) / p.price) * 100 : null

      return {
        id: p.external_product_id,
        sku: p.sku,
        name: p.title,
        marketplace: 'Mercado Livre',
        category: p.category_name,
        price: Number(p.price ?? 0),
        costPrice,
        margin,
        stock: stockByExternalId.get(p.external_product_id) ?? 0,
        revenue: agg.revenue,
        units: agg.units,
        trend,
        sharePct: totalRevenue > 0 ? (agg.revenue / totalRevenue) * 100 : 0,
      }
    })

    res.status(200).json({ ok: true, source: 'real', items } satisfies ProductsApiResponse)
  } catch (err) {
    console.error('[api/dashboard/products]', err)
    res.status(200).json({ ok: false, source: 'error', items: [], message: 'Erro controlado ao consultar produtos.' } satisfies ProductsApiResponse)
  }
}
