import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchAllRows, getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { FinanceOverview, MarketplaceFinance, MarketplaceGrowth, FinanceTransaction } from '../../src/data/financeShapes.js'
import { loadTrustedAnalyticsChannels, providerDefaultChannel, resolveEffectiveAnalyticsChannel, type StoredSalesChannel } from '../../src/server/analytics/channels.js'
import { resolveAnalyticsDateRange, saoPauloDateKey, saoPauloDayBounds, saoPauloDaysAgoKey } from '../../src/server/analytics/dateRange.js'
import { summarizeFeeCoverage } from '../../src/server/analytics/feeQuality.js'
import { summarizeRefundCoverage } from '../../src/server/analytics/refundQuality.js'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
  transactions: FinanceTransaction[]
  lastSyncAt: string | null
  message?: string
}

interface AggregateChannelRow {
  salesChannel: string
  ordersCount: number | string
  grossRevenue: number | string
  fees: number | string
  feeKnownOrders: number | string
  feePartialOrders: number | string
  refunds: number | string
  refundKnownOrders: number | string
  refundPartialOrders: number | string
  refundedOrders: number | string
}

interface FinanceAggregateResult {
  channels?: AggregateChannelRow[]
  previous?: { ordersCount?: number | string; grossRevenue?: number | string }
}

const EMPTY_OVERVIEW: FinanceOverview = { grossRevenue: 0, fees: 0, feeDataStatus: 'unknown', refunds: 0, refundDataStatus: 'unknown', netValue: 0, source: 'demo' }

// Rótulo de exibição por provider — mesmo texto usado em toda a UI (cards de
// conexão, cores etc). Amazon/Loja Própria ainda não têm sync real; ficam de
// fora até terem OAuth implementado (não têm connection_id pra filtrar).
function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

/** D-1/D-7/D-30/D-365 compara o último dia fechado contra os respectivos
 * dias fechados de referência. Nunca usa o dia corrente, ainda parcial, para
 * não transformar atraso de sincronização ou vendas intradiárias em -100%.
 * Buscar um ano inteiro de pedidos para responder quatro comparativos tornava
 * cada troca de filtro proporcional ao histórico completo da empresa. */
async function computeGrowthByChannel(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  connectionIds: string[],
  providerByConnectionId: Map<string, string>,
  trustedChannels: ReadonlySet<string>,
): Promise<Map<StoredSalesChannel, MarketplaceGrowth>> {
  const dayKeys = [1, 2, 8, 31, 366].map((days) => saoPauloDaysAgoKey(days))
  const snapshots = await Promise.all(dayKeys.map(async (day) => {
    const bounds = saoPauloDayBounds(day)
    const { data, error } = await fetchAllRows((from, to) =>
      supabase
        .from('orders')
        .select('connection_id, sales_channel, total_amount, ordered_at')
        .in('connection_id', connectionIds)
        .eq('company_id', companyId)
        .eq('status', 'paid')
        .eq('analytics_included', true)
        .gte('ordered_at', bounds.from)
        .lt('ordered_at', bounds.until)
        .range(from, to)
    )
    if (error) throw new Error(error.message)
    return data ?? []
  }))

  // provider -> dateKey -> revenue naquele dia
  const revenueByChannelDay = new Map<StoredSalesChannel, Map<string, number>>()
  for (const o of snapshots.flat()) {
    const provider = providerByConnectionId.get(o.connection_id)
    const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
    if (!storedChannel) continue
    const channel = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels).effectiveChannel
    const byDay = revenueByChannelDay.get(channel) ?? new Map<string, number>()
    const key = saoPauloDateKey(o.ordered_at)
    byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total_amount ?? 0))
    revenueByChannelDay.set(channel, byDay)
  }

  const latestClosedDayKey = saoPauloDaysAgoKey(1)
  const result = new Map<StoredSalesChannel, MarketplaceGrowth>()
  for (const [channel, byDay] of revenueByChannelDay.entries()) {
    const latestClosedDay = byDay.get(latestClosedDayKey) ?? 0
    result.set(channel, {
      d1: pctChange(latestClosedDay, byDay.get(saoPauloDaysAgoKey(2)) ?? 0),
      d7: pctChange(latestClosedDay, byDay.get(saoPauloDaysAgoKey(8)) ?? 0),
      d30: pctChange(latestClosedDay, byDay.get(saoPauloDaysAgoKey(31)) ?? 0),
      d365: pctChange(latestClosedDay, byDay.get(saoPauloDaysAgoKey(366)) ?? 0),
    })
  }
  return result
}

// Mesma agregação real de api/dashboard/summary.ts, só que também devolve o
// extrato (1 linha por pedido pago — não temos comissão/tarifa
// decompostas por transação, só o fee_amount agregado do pedido inteiro) e o
// breakdown por marketplace real (não hardcoded pra um provider só).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      res.status(200).json({ ok: false, overview: { ...EMPTY_OVERVIEW }, byMarketplace: [], transactions: [], lastSyncAt: null, message: 'Configuração do Supabase pendente.' } satisfies FinanceApiResponse)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const range = resolveAnalyticsDateRange(req.query, 365)
    const since = range.from.toISOString()
    const until = range.to.toISOString()
    const includeTransactions = req.query.include_transactions !== 'false'
    // A Visão Geral usa este contrato para montar KPIs e GMV a partir do
    // mesmo snapshot. Outras telas não pagam pela comparação adicional.
    const includeDashboardSummary = req.query.include_dashboard_summary === 'true'

    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, provider, status, last_sync_at, orders_last_sync_at')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])
    if (connError) throw new Error(connError.message)

    if (!connections || connections.length === 0) {
      res.status(200).json({ ok: true, overview: { ...EMPTY_OVERVIEW }, byMarketplace: [], transactions: [], lastSyncAt: null } satisfies FinanceApiResponse)
      return
    }

    const providerByConnectionId = new Map(connections.map((c) => [c.id, String(c.provider)]))
    const connectionIds = connections.map((c) => c.id)
    const lastSyncAt = connections.reduce<string | null>((latest, connection) => {
      const freshness = connection.orders_last_sync_at ?? connection.last_sync_at
      if (!freshness) return latest
      return !latest || freshness > latest ? freshness : latest
    }, null)

    const [{ data: registeredChannels, error: channelError }, trustedChannels] = await Promise.all([
      supabase.from('sales_channels').select('canonical_key, display_name').eq('company_id', auth.companyId).eq('status', 'active'),
      loadTrustedAnalyticsChannels(supabase, auth.companyId),
    ])
    if (channelError) throw new Error(channelError.message)
    const channelNameByKey = new Map((registeredChannels ?? []).map((channel) => [String(channel.canonical_key), String(channel.display_name)]))

    // Dashboard e Marketplaces não renderizam extrato. Para esses caminhos,
    // o Postgres devolve poucas linhas agregadas por canal em vez de enviar
    // dezenas de milhares de pedidos ao runtime a cada troca de filtro.
    if (!includeTransactions) {
      const previousFrom = includeDashboardSummary
        ? new Date(range.from.getTime() - (range.to.getTime() - range.from.getTime())).toISOString()
        : null
      const { data: aggregateData, error: aggregateError } = await supabase.rpc('dashboard_finance_aggregate', {
        p_company_id: auth.companyId,
        p_connection_ids: connectionIds,
        p_since: since,
        p_until: until,
        p_previous_since: previousFrom,
      })
      if (aggregateError) throw new Error(aggregateError.message)
      const aggregate = (aggregateData ?? {}) as FinanceAggregateResult
      const rows = aggregate.channels ?? []
      const growthByChannel = await computeGrowthByChannel(supabase, auth.companyId, connectionIds, providerByConnectionId, trustedChannels)
      const grouped = new Map<StoredSalesChannel, { grossRevenue: number; fees: number; refunds: number; ordersCount: number; feeKnownOrders: number; feePartialOrders: number; refundKnownOrders: number; refundPartialOrders: number; refundedOrders: number; displayName: string }>()

      for (const row of rows) {
        const storedChannel = row.salesChannel || 'external:vtex:unmapped'
        const { effectiveChannel, displayName } = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel))
        const acc = grouped.get(effectiveChannel) ?? { grossRevenue: 0, fees: 0, refunds: 0, ordersCount: 0, feeKnownOrders: 0, feePartialOrders: 0, refundKnownOrders: 0, refundPartialOrders: 0, refundedOrders: 0, displayName }
        acc.grossRevenue += Number(row.grossRevenue ?? 0)
        acc.fees += Number(row.fees ?? 0)
        acc.refunds += Number(row.refunds ?? 0)
        acc.ordersCount += Number(row.ordersCount ?? 0)
        acc.feeKnownOrders += Number(row.feeKnownOrders ?? 0)
        acc.feePartialOrders += Number(row.feePartialOrders ?? 0)
        acc.refundKnownOrders += Number(row.refundKnownOrders ?? 0)
        acc.refundPartialOrders += Number(row.refundPartialOrders ?? 0)
        acc.refundedOrders += Number(row.refundedOrders ?? 0)
        grouped.set(effectiveChannel, acc)
      }

      const totals = Array.from(grouped.values()).reduce((acc, row) => ({
        grossRevenue: acc.grossRevenue + row.grossRevenue, fees: acc.fees + row.fees, refunds: acc.refunds + row.refunds,
        ordersCount: acc.ordersCount + row.ordersCount, feeKnownOrders: acc.feeKnownOrders + row.feeKnownOrders,
        feePartialOrders: acc.feePartialOrders + row.feePartialOrders, refundKnownOrders: acc.refundKnownOrders + row.refundKnownOrders,
        refundPartialOrders: acc.refundPartialOrders + row.refundPartialOrders, refundedOrders: acc.refundedOrders + row.refundedOrders,
      }), { grossRevenue: 0, fees: 0, refunds: 0, ordersCount: 0, feeKnownOrders: 0, feePartialOrders: 0, refundKnownOrders: 0, refundPartialOrders: 0, refundedOrders: 0 })
      const feeDataStatus = totals.ordersCount > 0 && totals.feeKnownOrders === totals.ordersCount ? 'known' as const : totals.feeKnownOrders > 0 || totals.feePartialOrders > 0 ? 'partial' as const : 'unknown' as const
      const refundDataStatus = totals.ordersCount > 0 && totals.refundKnownOrders === totals.ordersCount ? 'known' as const : totals.refundKnownOrders > 0 || totals.refundPartialOrders > 0 ? 'partial' as const : 'unknown' as const
      const previousGrossRevenue = Number(aggregate.previous?.grossRevenue ?? 0)
      const previousOrdersCount = Number(aggregate.previous?.ordersCount ?? 0)
      const overview: FinanceOverview = {
        grossRevenue: totals.grossRevenue, fees: totals.fees, feeDataStatus, refunds: totals.refunds, refundDataStatus,
        netValue: totals.grossRevenue - totals.fees - totals.refunds, source: 'real',
        ordersCount: includeDashboardSummary ? totals.ordersCount : undefined,
        averageTicket: includeDashboardSummary ? (totals.ordersCount > 0 ? totals.grossRevenue / totals.ordersCount : 0) : undefined,
        grossRevenueChangePct: includeDashboardSummary ? pctChange(totals.grossRevenue, previousGrossRevenue) : undefined,
        ordersCountChangePct: includeDashboardSummary ? pctChange(totals.ordersCount, previousOrdersCount) : undefined,
        returnsCount: includeDashboardSummary ? totals.refundedOrders : undefined,
      }
      const EMPTY_GROWTH: MarketplaceGrowth = { d1: null, d7: null, d30: null, d365: null }
      const byMarketplace: MarketplaceFinance[] = Array.from(grouped.entries()).map(([channel, row]) => ({
        marketplace: row.displayName, grossRevenue: row.grossRevenue, fees: row.fees,
        feeDataStatus: row.ordersCount > 0 && row.feeKnownOrders === row.ordersCount ? 'known' : row.feeKnownOrders > 0 || row.feePartialOrders > 0 ? 'partial' : 'unknown',
        refunds: row.refunds,
        refundDataStatus: row.ordersCount > 0 && row.refundKnownOrders === row.ordersCount ? 'known' : row.refundKnownOrders > 0 || row.refundPartialOrders > 0 ? 'partial' : 'unknown',
        netValue: row.grossRevenue - row.fees - row.refunds, ordersCount: row.ordersCount,
        averageTicket: row.ordersCount > 0 ? row.grossRevenue / row.ordersCount : 0,
        growth: growthByChannel.get(channel) ?? EMPTY_GROWTH, source: 'real',
      }))
      res.status(200).json({ ok: true, overview, byMarketplace, transactions: [], lastSyncAt } satisfies FinanceApiResponse)
      return
    }

    const { data: orders, error: ordersError } = await fetchAllRows((from, to) =>
      supabase
        .from('orders')
        .select('connection_id, external_order_id, status, sales_channel, total_amount, fee_amount, fee_status, refund_amount, refund_status, refund_updated_at, ordered_at')
        .in('connection_id', connectionIds)
        .eq('company_id', auth.companyId)
        .eq('analytics_included', true)
        .gte('ordered_at', since)
        .lt('ordered_at', until)
        .order('ordered_at', { ascending: false })
        .range(from, to)
    )
    if (ordersError) throw new Error(ordersError.message)

    if (!orders || orders.length === 0) {
      res.status(200).json({ ok: true, overview: { ...EMPTY_OVERVIEW, source: 'real' }, byMarketplace: [], transactions: [], lastSyncAt } satisfies FinanceApiResponse)
      return
    }

    const paid = orders.filter((o) => o.status === 'paid')

    const grossRevenue = paid.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
    const feeCoverage = summarizeFeeCoverage(paid)
    const fees = feeCoverage.total
    const refundCoverage = summarizeRefundCoverage(paid)
    const refunds = refundCoverage.total
    const refundDataStatus = refundCoverage.status
    const netValue = grossRevenue - fees - refunds

    const ordersCount = paid.length
    const averageTicket = ordersCount > 0 ? grossRevenue / ordersCount : 0
    let grossRevenueChangePct: number | null = null
    let ordersCountChangePct: number | null = null

    if (includeDashboardSummary) {
      const previousFrom = new Date(range.from.getTime() - (range.to.getTime() - range.from.getTime())).toISOString()
      const { data: previousOrders, error: previousOrdersError } = await fetchAllRows((from, to) =>
        supabase
          .from('orders')
          .select('total_amount')
          .in('connection_id', connectionIds)
          .eq('company_id', auth.companyId)
          .eq('status', 'paid')
          .eq('analytics_included', true)
          .gte('ordered_at', previousFrom)
          .lt('ordered_at', since)
          .range(from, to)
      )
      if (previousOrdersError) throw new Error(previousOrdersError.message)
      const previousGrossRevenue = (previousOrders ?? []).reduce((sum, order) => sum + Number(order.total_amount ?? 0), 0)
      grossRevenueChangePct = pctChange(grossRevenue, previousGrossRevenue)
      ordersCountChangePct = pctChange(ordersCount, (previousOrders ?? []).length)
    }

    const overview: FinanceOverview = {
      grossRevenue,
      ordersCount: includeDashboardSummary ? ordersCount : undefined,
      averageTicket: includeDashboardSummary ? averageTicket : undefined,
      grossRevenueChangePct: includeDashboardSummary ? grossRevenueChangePct : undefined,
      ordersCountChangePct: includeDashboardSummary ? ordersCountChangePct : undefined,
      returnsCount: includeDashboardSummary ? refundCoverage.affectedOrders : undefined,
      fees,
      feeDataStatus: feeCoverage.status,
      refunds,
      refundDataStatus,
      netValue,
      source: 'real',
    }

    // Agrupa por provider real (não mais 1 linha fixa "Mercado Livre") —
    // cada marketplace conectado com pedido no período vira uma linha.
    // Agregação por canal EFETIVO: pedidos antigos presos em canônicos VTEX
    // legados fabricados (external:vtex:mzn-..., mlb-..., ...) caem juntos
    // no mesmo "Canal não identificado" em vez de virarem uma linha cada.
    // `orders`/`sales_channels` não são alterados — só a leitura agrega
    // diferente. `resolveEffectiveAnalyticsChannel` nunca usa prefixo:
    // decide por `trustedChannels` (registry + mappings resolvidos).
    const byChannel = new Map<StoredSalesChannel, { grossRevenue: number; fees: number; refunds: number; ordersCount: number; feeKnownOrders: number; feePartialOrders: number; refundKnownOrders: number; refundPartialOrders: number; displayName: string }>()
    for (const o of paid) {
      const provider = providerByConnectionId.get(o.connection_id)
      const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
      if (!storedChannel) continue
      const { effectiveChannel, displayName } = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel))
      const acc = byChannel.get(effectiveChannel) ?? { grossRevenue: 0, fees: 0, refunds: 0, ordersCount: 0, feeKnownOrders: 0, feePartialOrders: 0, refundKnownOrders: 0, refundPartialOrders: 0, displayName }
      acc.grossRevenue += Number(o.total_amount ?? 0)
      if (o.fee_status === 'known' && o.fee_amount !== null) {
        acc.fees += Number(o.fee_amount)
        acc.feeKnownOrders += 1
      } else if (o.fee_status === 'partial') {
        acc.fees += Number(o.fee_amount ?? 0)
        acc.feePartialOrders += 1
      }
      if (o.refund_status === 'known' && o.refund_amount !== null) {
        acc.refunds += Number(o.refund_amount)
        acc.refundKnownOrders += 1
      } else if (o.refund_status === 'partial') {
        acc.refunds += Number(o.refund_amount ?? 0)
        acc.refundPartialOrders += 1
      }
      acc.ordersCount += 1
      byChannel.set(effectiveChannel, acc)
    }
    const growthByChannel = await computeGrowthByChannel(supabase, auth.companyId, connectionIds, providerByConnectionId, trustedChannels)
    const EMPTY_GROWTH: MarketplaceGrowth = { d1: null, d7: null, d30: null, d365: null }

    const byMarketplace: MarketplaceFinance[] = Array.from(byChannel.entries())
      .map(([channel, acc]): MarketplaceFinance | null => {
        const marketplace = acc.displayName
        const feeDataStatus = acc.ordersCount > 0 && acc.feeKnownOrders === acc.ordersCount
          ? 'known' as const
          : acc.feeKnownOrders > 0 || acc.feePartialOrders > 0
            ? 'partial' as const
            : 'unknown' as const
        const refundDataStatus = acc.ordersCount > 0 && acc.refundKnownOrders === acc.ordersCount
          ? 'known' as const
          : acc.refundKnownOrders > 0 || acc.refundPartialOrders > 0
            ? 'partial' as const
            : 'unknown' as const
        return {
          marketplace,
          grossRevenue: acc.grossRevenue,
          fees: acc.fees,
          feeDataStatus,
          refunds: acc.refunds,
          refundDataStatus,
          netValue: acc.grossRevenue - acc.fees - acc.refunds,
          ordersCount: acc.ordersCount,
          averageTicket: acc.ordersCount > 0 ? acc.grossRevenue / acc.ordersCount : 0,
          growth: growthByChannel.get(channel) ?? EMPTY_GROWTH,
          source: 'real',
        }
      })
      .filter((row): row is MarketplaceFinance => row !== null)

    // provider desconhecido/não mapeado nunca vira "Mercado Livre" por
    // fallback — transação de origem indeterminada fica de fora do extrato,
    // não infla o canal errado (mesma regra dos outros endpoints).
    const transactions: FinanceTransaction[] = includeTransactions ? [
      ...paid.flatMap((o) => {
        const provider = providerByConnectionId.get(o.connection_id)
        const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
        const marketplace = storedChannel ? resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel)).displayName : undefined
        if (!marketplace) return []
        return [{
          date: saoPauloDateKey(o.ordered_at),
          marketplace,
          type: 'Venda' as const,
          identifier: o.external_order_id,
          gross: Number(o.total_amount ?? 0),
          discount: Number(o.fee_amount ?? 0),
          net: Number(o.total_amount ?? 0) - Number(o.fee_amount ?? 0),
          feeDataStatus: o.fee_status === 'known' && o.fee_amount !== null ? 'known' as const : o.fee_status === 'partial' ? 'partial' as const : 'unknown' as const,
        }]
      }),
      ...paid.flatMap((o) => {
        const refundAmount = Number(o.refund_amount ?? 0)
        if (o.refund_status !== 'known' || refundAmount <= 0) return []
        const provider = providerByConnectionId.get(o.connection_id)
        const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
        const marketplace = storedChannel ? resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel)).displayName : undefined
        if (!marketplace) return []
        return [{
          date: saoPauloDateKey(o.refund_updated_at ?? o.ordered_at),
          marketplace,
          type: 'Estorno' as const,
          identifier: o.external_order_id,
          gross: -refundAmount,
          discount: refundAmount,
          net: -refundAmount,
          feeDataStatus: 'known' as const,
        }]
      }),
    ].sort((a, b) => (a.date < b.date ? 1 : -1)) : []

    res.status(200).json({ ok: true, overview, byMarketplace, transactions, lastSyncAt } satisfies FinanceApiResponse)
  } catch (err) {
    console.error('[api/dashboard/finance]', err)
    res.status(200).json({ ok: false, overview: { ...EMPTY_OVERVIEW, source: 'demo' }, byMarketplace: [], transactions: [], lastSyncAt: null, message: 'Erro controlado ao consultar financeiro.' } satisfies FinanceApiResponse)
  }
}
