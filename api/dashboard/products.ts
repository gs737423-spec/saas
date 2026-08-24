import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchAllRows, getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { DashboardProduct, DashboardProductsResponse } from '../../src/server/dashboardProducts.js'
import type { Marketplace } from '../../src/data/mockData.js'
import type { Provider } from '../../src/server/integrations/types.js'
import { resolveAnalyticsDateRange } from '../../src/server/analytics/dateRange.js'

type ProductsApiResponse = DashboardProductsResponse

// Mesmo mapa de rótulo por provider usado em finance.ts — mantém os dois em
// sincronia manualmente por enquanto (ambos pequenos e estáveis; extrair
// pra um módulo compartilhado se um terceiro endpoint precisar do mesmo).
const PROVIDER_LABEL: Partial<Record<Provider, Marketplace>> = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  vtex: 'Loja Própria',
}

interface OrderItemAgg {
  quantity: number
  unit_price: number
  external_product_id: string | null
  sku: string | null
  orders: { connection_id: string } | { connection_id: string }[]
}

/** Chave = conexão + id externo, não só o id externo — dois marketplaces
 *  diferentes podem coincidentemente usar o mesmo external_product_id
 *  (ex.: ambos numéricos sequenciais), e sem isolar por conexão os dados
 *  de um produto Shopee poderiam se misturar com um produto Mercado Livre
 *  que por acaso tem o mesmo id. */
function productKey(connectionId: string, externalProductId: string): string {
  return `${connectionId}:${externalProductId}`
}

function aggregateByProduct(rows: OrderItemAgg[]): Map<string, { revenue: number; units: number }> {
  const map = new Map<string, { revenue: number; units: number }>()
  for (const row of rows) {
    const order = Array.isArray(row.orders) ? row.orders[0] : row.orders
    if (!row.external_product_id || !order?.connection_id) continue
    const key = productKey(order.connection_id, row.external_product_id)
    const prev = map.get(key) ?? { revenue: 0, units: 0 }
    prev.revenue += Number(row.unit_price ?? 0) * Number(row.quantity ?? 0)
    prev.units += Number(row.quantity ?? 0)
    map.set(key, prev)
  }
  return map
}

// Produtos reais de TODOS os marketplaces conectados: junta
// marketplace_products (catálogo+categoria+custo opcional) +
// marketplace_inventory (estoque) + order_items de pedidos pagos
// (receita/unidades no período, e no período anterior pra tendência real
// por comparação). Nunca fabrica margem/tendência quando falta base.
async function handlePatchCost(req: VercelRequest, res: VercelResponse) {
  const auth = await requireCompany(req, res)
  if (!auth) return

  const { connectionId, externalProductId, costPrice } = (req.body ?? {}) as { connectionId?: string; externalProductId?: string; costPrice?: number | null }
  if (!connectionId || !externalProductId) {
    res.status(400).json({ ok: false, message: 'connectionId e externalProductId são obrigatórios.' })
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
    .eq('connection_id', connectionId)
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

    const range = resolveAnalyticsDateRange(req.query, 365)
    const since = range.from.toISOString()
    const until = range.to.toISOString()
    const prevSince = new Date(range.from.getTime() - (range.to.getTime() - range.from.getTime())).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, provider, status')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])
    if (connError) throw new Error(connError.message)

    if (!connections || connections.length === 0) {
      res.status(200).json({ ok: true, source: 'demo', items: [] } satisfies ProductsApiResponse)
      return
    }

    const providerByConnectionId = new Map(connections.map((c) => [c.id, c.provider as Provider]))
    const connectionIds = connections.map((c) => c.id)

    const { data: products, error: productsError } = await fetchAllRows((from, to) =>
      supabase
        .from('marketplace_products')
        .select('connection_id, external_product_id, sku, title, price, status, category_id, category_name, cost_price')
        .in('connection_id', connectionIds)
        .eq('company_id', auth.companyId)
        .eq('active', true)
        .range(from, to)
    )
    if (productsError) throw new Error(productsError.message)

    if (!products || products.length === 0) {
      res.status(200).json({ ok: true, source: 'real', items: [] } satisfies ProductsApiResponse)
      return
    }

    const { data: inventoryRows, error: inventoryError } = await fetchAllRows((from, to) =>
      supabase
        .from('marketplace_inventory')
        .select('connection_id, external_product_id, available_quantity')
        .in('connection_id', connectionIds)
        .eq('company_id', auth.companyId)
        .eq('active', true)
        .range(from, to)
    )
    if (inventoryError) throw new Error(inventoryError.message)
    const stockByExternalId = new Map((inventoryRows ?? []).map((r) => [productKey(r.connection_id, r.external_product_id), r.available_quantity]))

    const { data: currentItems, error: currentItemsError } = await fetchAllRows((from, to) =>
      supabase
        .from('order_items')
        .select('quantity, unit_price, external_product_id, sku, orders!inner(status, ordered_at, connection_id)')
        .eq('company_id', auth.companyId)
        .eq('orders.status', 'paid')
        .eq('orders.analytics_included', true)
        .gte('orders.ordered_at', since)
        .lt('orders.ordered_at', until)
        .range(from, to)
    )
    if (currentItemsError) throw new Error(currentItemsError.message)
    const currentByProduct = aggregateByProduct((currentItems ?? []) as unknown as OrderItemAgg[])

    const { data: previousItems, error: previousItemsError } = await fetchAllRows((from, to) =>
      supabase
        .from('order_items')
        .select('quantity, unit_price, external_product_id, sku, orders!inner(status, ordered_at, connection_id)')
        .eq('company_id', auth.companyId)
        .eq('orders.status', 'paid')
        .eq('orders.analytics_included', true)
        .gte('orders.ordered_at', prevSince)
        .lt('orders.ordered_at', since)
        .range(from, to)
    )
    if (previousItemsError) throw new Error(previousItemsError.message)
    const previousByProduct = aggregateByProduct((previousItems ?? []) as unknown as OrderItemAgg[])

    const totalRevenue = [...currentByProduct.values()].reduce((s, v) => s + v.revenue, 0)

    // provider desconhecido/não mapeado (conexão removida, canal futuro sem
    // label ainda) nunca vira "Mercado Livre" por fallback — isso infla o
    // canal errado com item de origem indeterminada. Fica de fora da lista.
    const items: DashboardProduct[] = products
      .map((p): DashboardProduct | null => {
        const provider = providerByConnectionId.get(p.connection_id)
        const marketplace = provider ? PROVIDER_LABEL[provider] : undefined
        if (!marketplace) return null

        const key = productKey(p.connection_id, p.external_product_id)
        const agg = currentByProduct.get(key) ?? { revenue: 0, units: 0 }
        const prevAgg = previousByProduct.get(key)
        const trend = prevAgg && prevAgg.revenue > 0 ? ((agg.revenue - prevAgg.revenue) / prevAgg.revenue) * 100 : null
        const costPrice = p.cost_price === null || p.cost_price === undefined ? null : Number(p.cost_price)
        const productPrice = p.price === null || p.price === undefined ? null : Number(p.price)
        const margin = costPrice !== null && productPrice !== null && productPrice > 0 ? ((productPrice - costPrice) / productPrice) * 100 : null

        return {
          id: p.external_product_id,
          connectionId: p.connection_id,
          sku: p.sku,
          name: p.title,
          marketplace,
          categoryId: p.category_id,
          category: p.category_name,
          price: productPrice,
          costPrice,
          margin,
          stock: stockByExternalId.has(key) ? stockByExternalId.get(key) ?? null : null,
          revenue: agg.revenue,
          units: agg.units,
          trend,
          sharePct: totalRevenue > 0 ? (agg.revenue / totalRevenue) * 100 : 0,
        }
      })
      .filter((p): p is DashboardProduct => p !== null)

    res.status(200).json({ ok: true, source: 'real', items } satisfies ProductsApiResponse)
  } catch (err) {
    console.error('[api/dashboard/products]', err)
    res.status(200).json({ ok: false, source: 'error', items: [], message: 'Erro controlado ao consultar produtos.' } satisfies ProductsApiResponse)
  }
}
