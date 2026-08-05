import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { FinanceOverview, MarketplaceFinance, FinanceTransaction } from '../../src/data/financeShapes.js'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
  transactions: FinanceTransaction[]
  message?: string
}

const EMPTY_OVERVIEW: FinanceOverview = { grossRevenue: 0, fees: 0, refunds: 0, netValue: 0, source: 'demo' }

// Mesma agregação real de api/dashboard/summary.ts, só que também devolve o
// extrato (1 linha por pedido pago/cancelado — não temos comissão/tarifa
// decompostas por transação, só o fee_amount agregado do pedido inteiro).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      res.status(200).json({ ok: false, overview: { ...EMPTY_OVERVIEW }, byMarketplace: [], transactions: [], message: 'Configuração do Supabase pendente.' } satisfies FinanceApiResponse)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connection, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, status')
      .eq('provider', 'mercadolivre')
      .eq('company_id', auth.companyId)
      .maybeSingle()
    if (connError) throw new Error(connError.message)

    if (!connection || connection.status !== 'connected') {
      res.status(200).json({ ok: true, overview: { ...EMPTY_OVERVIEW }, byMarketplace: [], transactions: [] } satisfies FinanceApiResponse)
      return
    }

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('external_order_id, status, total_amount, fee_amount, ordered_at')
      .eq('connection_id', connection.id)
      .eq('company_id', auth.companyId)
      .gte('ordered_at', since)
      .order('ordered_at', { ascending: false })
    if (ordersError) throw new Error(ordersError.message)

    if (!orders || orders.length === 0) {
      res.status(200).json({ ok: true, overview: { ...EMPTY_OVERVIEW }, byMarketplace: [], transactions: [] } satisfies FinanceApiResponse)
      return
    }

    const paid = orders.filter((o) => o.status === 'paid')
    const cancelled = orders.filter((o) => o.status === 'cancelled')

    const grossRevenue = paid.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
    const fees = paid.reduce((s, o) => s + Number(o.fee_amount ?? 0), 0)
    const refunds = cancelled.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
    const netValue = grossRevenue - fees - refunds

    const overview: FinanceOverview = { grossRevenue, fees, refunds, netValue, source: 'real' }
    const byMarketplace: MarketplaceFinance[] = [{ marketplace: 'Mercado Livre', grossRevenue, fees, refunds, netValue, source: 'real' }]

    const transactions: FinanceTransaction[] = [
      ...paid.map((o) => ({
        date: new Date(o.ordered_at).toISOString().split('T')[0],
        marketplace: 'Mercado Livre' as const,
        type: 'Venda' as const,
        identifier: o.external_order_id,
        gross: Number(o.total_amount ?? 0),
        discount: Number(o.fee_amount ?? 0),
        net: Number(o.total_amount ?? 0) - Number(o.fee_amount ?? 0),
      })),
      ...cancelled.map((o) => ({
        date: new Date(o.ordered_at).toISOString().split('T')[0],
        marketplace: 'Mercado Livre' as const,
        type: 'Estorno' as const,
        identifier: o.external_order_id,
        gross: -Number(o.total_amount ?? 0),
        discount: Number(o.total_amount ?? 0),
        net: -Number(o.total_amount ?? 0),
      })),
    ].sort((a, b) => (a.date < b.date ? 1 : -1))

    res.status(200).json({ ok: true, overview, byMarketplace, transactions } satisfies FinanceApiResponse)
  } catch (err) {
    console.error('[api/dashboard/finance]', err)
    res.status(200).json({ ok: false, overview: { ...EMPTY_OVERVIEW, source: 'demo' }, byMarketplace: [], transactions: [], message: 'Erro controlado ao consultar financeiro.' } satisfies FinanceApiResponse)
  }
}
