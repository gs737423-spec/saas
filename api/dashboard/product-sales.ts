import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import { CORE_ENV_VARS, fetchAllRows, getMissingEnvVars, getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import type { ProductSalesPoint, ProductSalesResponse } from '../../src/server/dashboardProducts.js'
import { resolveAnalyticsDateRange } from '../../src/server/analytics/dateRange.js'

interface ProductRef { connectionId: string; externalProductId: string }
interface SalesRow {
  id: string
  external_product_id: string | null
  quantity: number
  unit_price: number
  orders: { connection_id: string; ordered_at: string } | { connection_id: string; ordered_at: string }[]
}

function parseRefs(value: unknown): ProductRef[] {
  if (typeof value !== 'string' || value.length > 4000) return []
  try {
    const parsed = JSON.parse(value) as unknown
    if (!Array.isArray(parsed) || parsed.length === 0 || parsed.length > 20) return []
    return parsed.flatMap((ref): ProductRef[] => {
      if (!ref || typeof ref !== 'object') return []
      const connectionId = 'connectionId' in ref ? ref.connectionId : null
      const externalProductId = 'externalProductId' in ref ? ref.externalProductId : null
      if (typeof connectionId !== 'string' || typeof externalProductId !== 'string' || !connectionId || !externalProductId || externalProductId.length > 300) return []
      return [{ connectionId, externalProductId }]
    })
  } catch {
    return []
  }
}

function dateKey(value: string): string {
  return new Date(value).toISOString().slice(0, 10)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ ok: false, source: 'error', points: [], lastSyncAt: null, message: 'Método não permitido.' } satisfies ProductSalesResponse)
      return
    }
    if (getMissingEnvVars(CORE_ENV_VARS).length > 0) {
      res.status(200).json({ ok: false, source: 'config_missing', points: [], lastSyncAt: null, message: 'Configuração do Supabase pendente.' } satisfies ProductSalesResponse)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return
    const refs = parseRefs(req.query.refs)
    if (refs.length === 0) {
      res.status(400).json({ ok: false, source: 'error', points: [], lastSyncAt: null, message: 'Referências de produto inválidas.' } satisfies ProductSalesResponse)
      return
    }

    const range = resolveAnalyticsDateRange(req.query, 365)
    const since = range.from.toISOString()
    const until = range.to.toISOString()
    const connectionIds = [...new Set(refs.map((ref) => ref.connectionId))]
    const externalProductIds = [...new Set(refs.map((ref) => ref.externalProductId))]
    const allowedPairs = new Set(refs.map((ref) => `${ref.connectionId}:${ref.externalProductId}`))
    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connectionsError } = await supabase
      .from('marketplace_connections')
      .select('id, last_sync_at, orders_last_sync_at')
      .eq('company_id', auth.companyId)
      .in('id', connectionIds)
    if (connectionsError) throw new Error(connectionsError.message)
    const ownedConnectionIds = new Set((connections ?? []).map((connection) => String(connection.id)))
    if (connectionIds.some((id) => !ownedConnectionIds.has(id))) {
      res.status(404).json({ ok: false, source: 'error', points: [], lastSyncAt: null, message: 'Produto não encontrado.' } satisfies ProductSalesResponse)
      return
    }

    const { data, error } = await fetchAllRows((from, to) => supabase
      .from('order_items')
      .select('id, external_product_id, quantity, unit_price, orders!inner(connection_id, ordered_at, status, analytics_included)')
      .eq('company_id', auth.companyId)
      .in('external_product_id', externalProductIds)
      .in('orders.connection_id', connectionIds)
      .eq('orders.status', 'paid')
      .eq('orders.analytics_included', true)
      .gte('orders.ordered_at', since)
      .lt('orders.ordered_at', until)
      .range(from, to))
    if (error) throw new Error(error.message)

    const byDate = new Map<string, ProductSalesPoint>()
    for (const row of (data ?? []) as unknown as SalesRow[]) {
      const order = Array.isArray(row.orders) ? row.orders[0] : row.orders
      if (!order || !row.external_product_id || !allowedPairs.has(`${order.connection_id}:${row.external_product_id}`)) continue
      const date = dateKey(order.ordered_at)
      const point = byDate.get(date) ?? { date, units: 0, revenue: 0 }
      point.units += Number(row.quantity ?? 0)
      point.revenue += Number(row.quantity ?? 0) * Number(row.unit_price ?? 0)
      byDate.set(date, point)
    }

    const lastSyncAt = (connections ?? []).reduce<string | null>((latest, connection) => {
      const freshness = connection.orders_last_sync_at ?? connection.last_sync_at
      if (!freshness) return latest
      return !latest || freshness > latest ? freshness : latest
    }, null)
    res.status(200).json({ ok: true, source: 'real', points: [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)), lastSyncAt } satisfies ProductSalesResponse)
  } catch (err) {
    console.error('[api/dashboard/product-sales]', err)
    res.status(200).json({ ok: false, source: 'error', points: [], lastSyncAt: null, message: 'Erro controlado ao consultar vendas do produto.' } satisfies ProductSalesResponse)
  }
}
