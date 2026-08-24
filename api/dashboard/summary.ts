import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchAllRows, getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import type { DashboardSummary } from '../../src/server/integrations/types.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import { resolveAnalyticsDateRange } from '../../src/server/analytics/dateRange.js'
import { summarizeFeeCoverage } from '../../src/server/analytics/feeQuality.js'
import { summarizeRefundCoverage } from '../../src/server/analytics/refundQuality.js'

type SummaryApiResponse = DashboardSummary & { ok: boolean; message?: string }

const EMPTY: Omit<DashboardSummary, 'source' | 'lastSyncAt'> = {
  grossRevenue: 0,
  ordersCount: 0,
  averageTicket: 0,
  feesTotal: 0,
  feeDataStatus: 'unknown',
  returnsCount: 0,
  returnsAmount: 0,
  refundDataStatus: 'unknown',
  grossRevenueChangePct: null,
  ordersCountChangePct: null,
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

// Agrega orders/order_items reais de TODOS os marketplaces conectados
// (Mercado Livre, Shopee, ...) pro período pedido — não filtra por um
// provider fixo, senão a empresa com 2+ marketplaces conectados nunca veria
// o segundo no resumo. Nunca fabrica número — sem conexão/sem pedido
// sincronizado ainda, devolve zerado preservando a origem real.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      const response: SummaryApiResponse = { ok: false, source: 'config_missing', ...EMPTY, lastSyncAt: null, message: 'Configuração do Supabase pendente.' }
      res.status(200).json(response)
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
      .select('id, status, last_sync_at, orders_last_sync_at')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])

    if (connError) throw new Error(connError.message)

    if (!connections || connections.length === 0) {
      const response: SummaryApiResponse = { ok: true, source: 'demo', ...EMPTY, lastSyncAt: null }
      res.status(200).json(response)
      return
    }

    const connectionIds = connections.map((c) => c.id)
    const lastSyncAt = connections.reduce<string | null>((latest, c) => {
      const freshness = c.orders_last_sync_at ?? c.last_sync_at
      if (!freshness) return latest
      if (!latest || freshness > latest) return freshness
      return latest
    }, null)

    const { data: orders, error: ordersError } = await fetchAllRows((from, to) =>
      supabase
        .from('orders')
        .select('status, total_amount, fee_amount, fee_status, refund_amount, refund_status')
        .in('connection_id', connectionIds)
        .eq('company_id', auth.companyId)
        .eq('analytics_included', true)
        .gte('ordered_at', since)
        .lt('ordered_at', until)
        .range(from, to)
    )

    if (ordersError) throw new Error(ordersError.message)

    if (!orders || orders.length === 0) {
      // Conectado mas sem pedido no período é um snapshot real vazio, não demo.
      const response: SummaryApiResponse = { ok: true, source: 'real', ...EMPTY, lastSyncAt }
      res.status(200).json(response)
      return
    }

    // Só "paid" é venda de fato. Cancelamento é estado operacional do pedido,
    // não evidência de que houve captura e posterior reembolso. Enquanto não
    // existir ingestão explícita de refunds, o agregado permanece indisponível.
    const paid = orders.filter((o) => o.status === 'paid')

    const grossRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
    const feeCoverage = summarizeFeeCoverage(paid)
    const refundCoverage = summarizeRefundCoverage(paid)
    const ordersCount = paid.length
    const averageTicket = ordersCount > 0 ? grossRevenue / ordersCount : 0

    const { data: previousOrders, error: previousOrdersError } = await fetchAllRows((from, to) =>
      supabase
        .from('orders')
        .select('status, total_amount')
        .in('connection_id', connectionIds)
        .eq('company_id', auth.companyId)
        .eq('status', 'paid')
        .eq('analytics_included', true)
        .gte('ordered_at', prevSince)
        .lt('ordered_at', since)
        .range(from, to)
    )
    if (previousOrdersError) throw new Error(previousOrdersError.message)
    const previousGross = (previousOrders ?? []).reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
    const previousOrdersCount = (previousOrders ?? []).length

    const response: SummaryApiResponse = {
      ok: true,
      source: 'real',
      grossRevenue,
      ordersCount,
      averageTicket,
      feesTotal: feeCoverage.total,
      feeDataStatus: feeCoverage.status,
      returnsCount: refundCoverage.affectedOrders,
      returnsAmount: refundCoverage.total,
      refundDataStatus: refundCoverage.status,
      lastSyncAt,
      grossRevenueChangePct: pctChange(grossRevenue, previousGross),
      ordersCountChangePct: pctChange(ordersCount, previousOrdersCount),
    }
    res.status(200).json(response)
  } catch (err) {
    console.error('[api/dashboard/summary]', err)
    const response: SummaryApiResponse = { ok: false, source: 'error', ...EMPTY, lastSyncAt: null, message: 'Erro controlado ao consultar resumo financeiro.' }
    res.status(200).json(response)
  }
}
