import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import { UNMAPPED_ANALYTICS_CHANNEL, loadTrustedAnalyticsChannels, providerDefaultChannel, resolveEffectiveAnalyticsChannel, type StoredSalesChannel } from '../../src/server/analytics/channels.js'
import { resolveAnalyticsDateRange, saoPauloDateKey } from '../../src/server/analytics/dateRange.js'
import type { FinanceTransaction } from '../../src/data/financeShapes.js'

const DEFAULT_PAGE_SIZE = 100
const MAX_PAGE_SIZE = 200

interface TransactionsPagination {
  page: number
  pageSize: number
  totalOrders: number
  totalPages: number
}

interface TransactionsApiResponse {
  ok: boolean
  transactions: FinanceTransaction[]
  pagination: TransactionsPagination
  message?: string
}

function firstQueryValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function positiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? Math.min(parsed, max) : fallback
}

function emptyResponse(message?: string): TransactionsApiResponse {
  return {
    ok: !message,
    transactions: [],
    pagination: { page: 1, pageSize: DEFAULT_PAGE_SIZE, totalOrders: 0, totalPages: 0 },
    ...(message ? { message } : {}),
  }
}

/** Extrato sob demanda: nunca baixa o histórico inteiro apenas para renderizar
 * a primeira tela. KPIs continuam no endpoint agregado `finance.ts`. */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      res.status(200).json(emptyResponse('Configuração do Supabase pendente.'))
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const pageSize = positiveInt(firstQueryValue(req.query.page_size), DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE)
    const requestedPage = positiveInt(firstQueryValue(req.query.page), 1, Number.MAX_SAFE_INTEGER)
    const selectedChannel = firstQueryValue(req.query.channel)
    const range = resolveAnalyticsDateRange(req.query, 365)
    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connectionError } = await supabase
      .from('marketplace_connections')
      .select('id, provider')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])
    if (connectionError) throw new Error(connectionError.message)
    if (!connections?.length) {
      res.status(200).json({ ...emptyResponse(), ok: true })
      return
    }

    const connectionIds = connections.map((connection) => connection.id)
    const providerByConnectionId = new Map(connections.map((connection) => [connection.id, String(connection.provider)]))
    const [{ data: registeredChannels, error: channelError }, trustedChannels] = await Promise.all([
      supabase.from('sales_channels').select('canonical_key, display_name').eq('company_id', auth.companyId),
      loadTrustedAnalyticsChannels(supabase, auth.companyId),
    ])
    if (channelError) throw new Error(channelError.message)
    const channelNameByKey = new Map((registeredChannels ?? []).map((channel) => [String(channel.canonical_key), String(channel.display_name)]))

    let query = supabase
      .from('orders')
      .select('connection_id, external_order_id, sales_channel, total_amount, fee_amount, fee_status, refund_amount, refund_status, refund_updated_at, ordered_at', { count: 'exact' })
      .eq('company_id', auth.companyId)
      .in('connection_id', connectionIds)
      .eq('status', 'paid')
      .eq('analytics_included', true)
      .gte('ordered_at', range.from.toISOString())
      .lt('ordered_at', range.to.toISOString())

    if (selectedChannel === UNMAPPED_ANALYTICS_CHANNEL) {
      // PostgREST recebe somente chaves canônicas já validadas no servidor;
      // pedidos legados não confiáveis continuam juntos neste único balde.
      const trustedList = Array.from(trustedChannels)
        .map((channel) => `"${channel.replace(/"/g, '\\"')}"`)
        .join(',')
      if (trustedList) query = query.not('sales_channel', 'in', `(${trustedList})`)
    } else if (selectedChannel) {
      query = query.eq('sales_channel', selectedChannel)
    }

    const offset = (requestedPage - 1) * pageSize
    const { data: orders, error: ordersError, count } = await query
      .order('ordered_at', { ascending: false })
      .range(offset, offset + pageSize - 1)
    if (ordersError) throw new Error(ordersError.message)

    const totalOrders = count ?? 0
    const totalPages = totalOrders === 0 ? 0 : Math.ceil(totalOrders / pageSize)
    const page = totalPages === 0 ? 1 : Math.min(requestedPage, totalPages)
    const transactions: FinanceTransaction[] = (orders ?? []).flatMap((order) => {
      const provider = providerByConnectionId.get(order.connection_id)
      const storedChannel = (order.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
      if (!storedChannel) return []
      const marketplace = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel)).displayName
      const total = Number(order.total_amount ?? 0)
      const feeKnown = order.fee_status === 'known' && order.fee_amount !== null
      const feePartial = order.fee_status === 'partial'
      const fee = Number(order.fee_amount ?? 0)
      const sale: FinanceTransaction = {
        date: saoPauloDateKey(order.ordered_at), marketplace, type: 'Venda', identifier: order.external_order_id,
        gross: total, discount: fee, net: total - fee,
        feeDataStatus: feeKnown ? 'known' : feePartial ? 'partial' : 'unknown',
      }
      const refundAmount = Number(order.refund_amount ?? 0)
      if (order.refund_status !== 'known' || refundAmount <= 0) return [sale]
      const refund: FinanceTransaction = {
        date: saoPauloDateKey(order.refund_updated_at ?? order.ordered_at), marketplace, type: 'Estorno', identifier: order.external_order_id,
        gross: -refundAmount, discount: refundAmount, net: -refundAmount, feeDataStatus: 'known',
      }
      return [sale, refund]
    }).sort((a, b) => (a.date < b.date ? 1 : -1))

    res.status(200).json({ ok: true, transactions, pagination: { page, pageSize, totalOrders, totalPages } } satisfies TransactionsApiResponse)
  } catch (error) {
    console.error('[api/dashboard/finance-transactions]', error)
    res.status(200).json(emptyResponse('Erro controlado ao consultar o extrato financeiro.'))
  }
}
