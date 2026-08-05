import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import type { DashboardSummary } from '../../src/server/integrations/types.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'

type SummaryApiResponse = DashboardSummary & { ok: boolean; message?: string }

const EMPTY: Omit<DashboardSummary, 'source' | 'lastSyncAt'> = {
  grossRevenue: 0,
  ordersCount: 0,
  averageTicket: 0,
  feesTotal: 0,
  returnsCount: 0,
  returnsAmount: 0,
  grossRevenueChangePct: null,
  ordersCountChangePct: null,
}

function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

// Agrega orders/order_items reais (já sincronizados do Mercado Livre) pro
// período pedido. Nunca fabrica número — sem conexão/sem pedido sincronizado
// ainda, devolve zerado com source:'demo' (mesmo padrão de
// api/dashboard/inventory.ts), pro frontend decidir como avisar o usuário.
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

    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
    const now = Date.now()
    const since = new Date(now - days * 24 * 60 * 60 * 1000).toISOString()
    const prevSince = new Date(now - 2 * days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connection, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, status, last_sync_at')
      .eq('provider', 'mercadolivre')
      .eq('company_id', auth.companyId)
      .maybeSingle()

    if (connError) throw new Error(connError.message)

    if (!connection || connection.status !== 'connected') {
      const response: SummaryApiResponse = { ok: true, source: 'demo', ...EMPTY, lastSyncAt: null }
      res.status(200).json(response)
      return
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('status, total_amount, fee_amount')
      .eq('connection_id', connection.id)
      .eq('company_id', auth.companyId)
      .gte('ordered_at', since)

    if (ordersError) throw new Error(ordersError.message)

    if (!orders || orders.length === 0) {
      // Conectado mas sem pedido sincronizado ainda nesse período — segue
      // demo, nunca finge que teve venda.
      const response: SummaryApiResponse = { ok: true, source: 'demo', ...EMPTY, lastSyncAt: connection.last_sync_at }
      res.status(200).json(response)
      return
    }

    // searchOrders() não filtra por status na origem — traz confirmed,
    // payment_required, payment_in_process, paid, cancelled, invalid, tudo.
    // Só "paid" é venda de fato; "cancelled" é devolução; o resto (pedido
    // criado mas ainda não pago) não é nem uma coisa nem outra — não entra
    // em faturamento nem em devolução, senão infla o bruto com dinheiro que
    // ainda não caiu.
    const paid = orders.filter((o) => o.status === 'paid')
    const cancelled = orders.filter((o) => o.status === 'cancelled')

    const grossRevenue = paid.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
    const feesTotal = paid.reduce((sum, o) => sum + Number(o.fee_amount ?? 0), 0)
    const returnsAmount = cancelled.reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
    const ordersCount = paid.length
    const averageTicket = ordersCount > 0 ? grossRevenue / ordersCount : 0

    const { data: previousOrders } = await supabase
      .from('orders')
      .select('status, total_amount')
      .eq('connection_id', connection.id)
      .eq('company_id', auth.companyId)
      .eq('status', 'paid')
      .gte('ordered_at', prevSince)
      .lt('ordered_at', since)
    const previousGross = (previousOrders ?? []).reduce((sum, o) => sum + Number(o.total_amount ?? 0), 0)
    const previousOrdersCount = (previousOrders ?? []).length

    const response: SummaryApiResponse = {
      ok: true,
      source: 'real',
      grossRevenue,
      ordersCount,
      averageTicket,
      feesTotal,
      returnsCount: cancelled.length,
      returnsAmount,
      lastSyncAt: connection.last_sync_at,
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
