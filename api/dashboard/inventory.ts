import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchAllRows, getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import type { AbcClass, DashboardInventoryItem, DashboardInventoryResponse, Provider } from '../../src/server/integrations/types.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { Marketplace } from '../../src/data/mockData.js'

type InventoryApiResponse = DashboardInventoryResponse & { ok: boolean; message?: string }

// Mesmo mapa de rótulo por provider usado em finance.ts/products.ts.
const PROVIDER_LABEL: Partial<Record<Provider, Marketplace>> = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  vtex: 'Loja Própria',
}

const MARKETPLACE_PROVIDER: Partial<Record<Marketplace, Provider>> = {
  'Mercado Livre': 'mercadolivre',
  Shopee: 'shopee',
  Amazon: 'amazon',
  'Loja Própria': 'vtex',
}

function queryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function queryNumber(value: string | string[] | undefined, fallback: number): number {
  const parsed = Number(queryValue(value))
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback
}

function queryList(value: string | string[] | undefined): string[] {
  const raw = queryValue(value)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function queryBoolean(value: string | string[] | undefined): boolean {
  return queryValue(value) === 'true'
}

function asNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000

interface OrderItemAgg {
  quantity: number
  unit_price: number
  external_product_id: string | null
  orders: { connection_id: string } | { connection_id: string }[]
}

function productKey(connectionId: string, externalProductId: string): string {
  return `${connectionId}:${externalProductId}`
}

/** Classifica por % de faturamento acumulado (maior pro menor): A até 80%,
 *  B até 95%, C o resto — padrão de gestão de estoque. Produtos sem venda
 *  no período (revenue 0) ficam de fora da curva (null), nunca viram "C"
 *  por padrão — C significa "vendeu pouco", não "não vendeu nada". */
function classifyAbc(items: { key: string; revenue: number }[]): Map<string, AbcClass> {
  const withSales = items.filter((i) => i.revenue > 0).sort((a, b) => b.revenue - a.revenue)
  const totalRevenue = withSales.reduce((s, i) => s + i.revenue, 0)
  const result = new Map<string, AbcClass>()
  let cumulative = 0
  for (const item of withSales) {
    cumulative += item.revenue
    const cumulativePct = totalRevenue > 0 ? (cumulative / totalRevenue) * 100 : 0
    result.set(item.key, cumulativePct <= 80 ? 'A' : cumulativePct <= 95 ? 'B' : 'C')
  }
  return result
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      const response: InventoryApiResponse = { ok: false, source: 'config_missing', items: [], lastSyncAt: null, message: 'Configuração do Supabase pendente.' }
      res.status(200).json(response)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, provider, status, last_sync_at, inventory_last_sync_at')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])

    if (connError) throw new Error(connError.message)

    if (!connections || connections.length === 0) {
      const response: InventoryApiResponse = { ok: true, source: 'demo', items: [], lastSyncAt: null }
      res.status(200).json(response)
      return
    }

    const providerByConnectionId = new Map(connections.map((c) => [c.id, c.provider as Provider]))
    const connectionIds = connections.map((c) => c.id)
    const since30d = new Date(Date.now() - THIRTY_DAYS_MS).toISOString()
    const lastSyncAt = connections.reduce<string | null>((latest, c) => {
      const freshness = c.inventory_last_sync_at ?? c.last_sync_at
      if (!freshness) return latest
      if (!latest || freshness > latest) return freshness
      return latest
    }, null)

    // Estoque chama o modo paginado explicitamente. O modo legado fica
    // intacto enquanto consumidores secundários fazem sua migração própria.
    if (queryValue(req.query.page)) {
      const selectedMarketplace = queryValue(req.query.marketplace)
      const provider = selectedMarketplace && selectedMarketplace !== 'all'
        ? MARKETPLACE_PROVIDER[selectedMarketplace as Marketplace]
        : undefined
      const { data, error } = await supabase.rpc('dashboard_inventory_page', {
        p_company_id: auth.companyId,
        p_connection_ids: connectionIds,
        p_since: since30d,
        p_page: queryNumber(req.query.page, 1),
        p_page_size: Math.min(queryNumber(req.query.page_size, 100), 100),
        p_abc: queryList(req.query.abc),
        p_providers: provider ? [provider] : [],
        p_category_keys: queryList(req.query.categories),
        p_only_critical: queryBoolean(req.query.only_critical),
        p_only_stalled: queryBoolean(req.query.only_stalled),
        p_only_low_coverage: queryBoolean(req.query.only_low_coverage),
        p_only_excess: queryBoolean(req.query.only_excess),
        p_sort: queryValue(req.query.sort) ?? 'revenue',
      })
      if (error) throw new Error(error.message)

      const payload = (data ?? {}) as Record<string, unknown>
      const rawItems = Array.isArray(payload.items) ? payload.items as Record<string, unknown>[] : []
      const items: DashboardInventoryItem[] = rawItems.map((item) => {
        const marketplace = PROVIDER_LABEL[item.provider as Provider]
        if (!marketplace) throw new Error('Provider de estoque não suportado.')
        const abc = item.abcClass
        return {
          sku: typeof item.sku === 'string' ? item.sku : null,
          title: String(item.title ?? ''),
          marketplace,
          categoryId: typeof item.categoryId === 'string' ? item.categoryId : null,
          categoryName: typeof item.categoryName === 'string' ? item.categoryName : null,
          availableQuantity: asNumber(item.availableQuantity),
          price: asNumber(item.price),
          status: typeof item.status === 'string' ? item.status : null,
          soldQuantity: asNumber(item.soldQuantity),
          revenue30d: asNumber(item.revenue30d) ?? 0,
          turnoverRate: asNumber(item.turnoverRate),
          abcClass: abc === 'A' || abc === 'B' || abc === 'C' ? abc : null,
          lastSyncAt: typeof item.lastSyncAt === 'string' ? item.lastSyncAt : null,
        }
      })
      const response: InventoryApiResponse = {
        ok: true,
        source: 'real',
        items,
        lastSyncAt,
        pagination: payload.pagination as DashboardInventoryResponse['pagination'],
        categoryOptions: payload.categoryOptions as DashboardInventoryResponse['categoryOptions'],
        metrics: payload.metrics as DashboardInventoryResponse['metrics'],
      }
      res.status(200).json(response)
      return
    }

    // As três leituras usam somente o mesmo tenant e a mesma lista de
    // conexões. Mantê-las paralelas elimina espera serial sem reduzir dados.
    const [inventoryResult, productRowsResult, recentItemsResult] = await Promise.all([
      fetchAllRows((from, to) =>
        supabase
          .from('marketplace_inventory')
          .select('connection_id, external_product_id, sku, title, available_quantity, last_sync_at')
          .in('connection_id', connectionIds)
          .eq('company_id', auth.companyId)
          .eq('active', true)
          .range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('marketplace_products')
          .select('connection_id, external_product_id, price, status, category_id, category_name')
          .in('connection_id', connectionIds)
          .eq('company_id', auth.companyId)
          .eq('active', true)
          .range(from, to)
      ),
      fetchAllRows((from, to) =>
        supabase
          .from('order_items')
          .select('quantity, unit_price, external_product_id, orders!inner(status, ordered_at, connection_id)')
          .eq('company_id', auth.companyId)
          .eq('orders.status', 'paid')
          .eq('orders.analytics_included', true)
          .gte('orders.ordered_at', since30d)
          .range(from, to)
      ),
    ])

    const { data: inventoryRows, error: invError } = inventoryResult

    if (invError) throw new Error(invError.message)

    if (!inventoryRows || inventoryRows.length === 0) {
      // Conectado sem estoque é um snapshot real vazio; fixture demo só entra
      // quando o modo de demonstração foi explicitamente ativado no cliente.
      const response: InventoryApiResponse = { ok: true, source: 'real', items: [], lastSyncAt }
      res.status(200).json(response)
      return
    }

    const { data: productRows, error: productRowsError } = productRowsResult
    if (productRowsError) throw new Error(productRowsError.message)

    // Chave conexão+id externo — dois marketplaces diferentes podem
    // coincidentemente usar o mesmo id.
    const productByKey = new Map((productRows ?? []).map((p) => [productKey(p.connection_id, p.external_product_id), p]))

    // Vendas dos últimos 30 dias por produto, pra Giro de Estoque e Curva
    // ABC — nunca fabricado, vem de order_items de pedidos pagos de verdade.
    const { data: recentItems, error: recentItemsError } = recentItemsResult
    if (recentItemsError) throw new Error(recentItemsError.message)

    const salesByKey = new Map<string, { units: number; revenue: number }>()
    for (const row of (recentItems ?? []) as unknown as OrderItemAgg[]) {
      const order = Array.isArray(row.orders) ? row.orders[0] : row.orders
      if (!row.external_product_id || !order?.connection_id) continue
      const key = productKey(order.connection_id, row.external_product_id)
      const prev = salesByKey.get(key) ?? { units: 0, revenue: 0 }
      prev.units += Number(row.quantity ?? 0)
      prev.revenue += Number(row.unit_price ?? 0) * Number(row.quantity ?? 0)
      salesByKey.set(key, prev)
    }

    const abcByKey = classifyAbc(
      inventoryRows.map((row) => {
        const key = productKey(row.connection_id, row.external_product_id)
        return { key, revenue: salesByKey.get(key)?.revenue ?? 0 }
      })
    )

    // provider desconhecido/não mapeado nunca vira "Mercado Livre" por
    // fallback — item de origem indeterminada fica de fora, não infla o
    // canal errado (mesma regra de api/dashboard/products.ts).
    const items: DashboardInventoryItem[] = inventoryRows
      .map((row): DashboardInventoryItem | null => {
        const provider = providerByConnectionId.get(row.connection_id)
        const marketplace = provider ? PROVIDER_LABEL[provider] : undefined
        if (!marketplace) return null

        const key = productKey(row.connection_id, row.external_product_id)
        const product = productByKey.get(key)
        const sales = salesByKey.get(key)
        const soldQuantity = sales?.units ?? null
        const turnoverRate = sales && row.available_quantity != null && row.available_quantity > 0 ? sales.units / row.available_quantity : null

        return {
          sku: row.sku,
          title: row.title,
          marketplace,
          categoryId: product?.category_id ?? null,
          categoryName: product?.category_name ?? null,
          availableQuantity: row.available_quantity,
          price: product?.price ?? null,
          status: product?.status ?? null,
          soldQuantity,
          revenue30d: sales?.revenue ?? 0,
          turnoverRate,
          abcClass: abcByKey.get(key) ?? null,
          lastSyncAt: row.last_sync_at,
        }
      })
      .filter((i): i is DashboardInventoryItem => i !== null)

    const response: InventoryApiResponse = { ok: true, source: 'real', items, lastSyncAt }
    res.status(200).json(response)
  } catch (err) {
    console.error('[api/dashboard/inventory]', err)
    const response: InventoryApiResponse = { ok: false, source: 'error', items: [], lastSyncAt: null, message: 'Erro controlado ao consultar estoque.' }
    res.status(200).json(response)
  }
}
