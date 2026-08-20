import type { VercelRequest, VercelResponse } from '@vercel/node'
import { fetchAllRows, getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { FinanceOverview, MarketplaceFinance, MarketplaceGrowth, FinanceTransaction } from '../../src/data/financeShapes.js'
import { loadTrustedAnalyticsChannels, providerDefaultChannel, resolveEffectiveAnalyticsChannel, type StoredSalesChannel } from '../../src/server/analytics/channels.js'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
  transactions: FinanceTransaction[]
  lastSyncAt: string | null
  message?: string
}

const EMPTY_OVERVIEW: FinanceOverview = { grossRevenue: 0, fees: 0, refunds: 0, netValue: 0, source: 'demo' }

// Rótulo de exibição por provider — mesmo texto usado em toda a UI (cards de
// conexão, cores etc). Amazon/Loja Própria ainda não têm sync real; ficam de
// fora até terem OAuth implementado (não têm connection_id pra filtrar).
function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null
  return ((current - previous) / previous) * 100
}

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

function daysAgoKey(n: number): string {
  return dateKey(new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString())
}

/** D-1/D-7/D-30/D-365 = faturamento pago no dia de hoje vs faturamento pago
 *  exatamente N dias atrás (dia único, não soma de período) — pedido do
 *  usuário explicitamente: "D-7 é hoje comparado com 7 dias atrás". Busca
 *  366 dias pra trás independente do filtro de período da tela, senão D-365
 *  nunca teria dado quando o usuário está olhando os últimos 30 dias. */
async function computeGrowthByChannel(
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
  companyId: string,
  connectionIds: string[],
  providerByConnectionId: Map<string, string>,
  trustedChannels: ReadonlySet<string>,
): Promise<Map<StoredSalesChannel, MarketplaceGrowth>> {
  const since366 = new Date(Date.now() - 366 * 24 * 60 * 60 * 1000).toISOString()
  const { data: yearOrders } = await fetchAllRows((from, to) =>
    supabase
      .from('orders')
      .select('connection_id, sales_channel, total_amount, ordered_at')
      .in('connection_id', connectionIds)
      .eq('company_id', companyId)
      .eq('status', 'paid')
      .eq('analytics_included', true)
      .gte('ordered_at', since366)
      .range(from, to)
  )

  // provider -> dateKey -> revenue naquele dia
  const revenueByChannelDay = new Map<StoredSalesChannel, Map<string, number>>()
  for (const o of yearOrders ?? []) {
    const provider = providerByConnectionId.get(o.connection_id)
    const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
    if (!storedChannel) continue
    const channel = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels).effectiveChannel
    const byDay = revenueByChannelDay.get(channel) ?? new Map<string, number>()
    const key = dateKey(o.ordered_at)
    byDay.set(key, (byDay.get(key) ?? 0) + Number(o.total_amount ?? 0))
    revenueByChannelDay.set(channel, byDay)
  }

  const todayKey = daysAgoKey(0)
  const result = new Map<StoredSalesChannel, MarketplaceGrowth>()
  for (const [channel, byDay] of revenueByChannelDay.entries()) {
    const today = byDay.get(todayKey) ?? 0
    result.set(channel, {
      d1: pctChange(today, byDay.get(daysAgoKey(1)) ?? 0),
      d7: pctChange(today, byDay.get(daysAgoKey(7)) ?? 0),
      d30: pctChange(today, byDay.get(daysAgoKey(30)) ?? 0),
      d365: pctChange(today, byDay.get(daysAgoKey(365)) ?? 0),
    })
  }
  return result
}

// Mesma agregação real de api/dashboard/summary.ts, só que também devolve o
// extrato (1 linha por pedido pago/cancelado — não temos comissão/tarifa
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

    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30))
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, provider, status, last_sync_at')
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
      if (!connection.last_sync_at) return latest
      return !latest || connection.last_sync_at > latest ? connection.last_sync_at : latest
    }, null)

    const [{ data: registeredChannels, error: channelError }, trustedChannels] = await Promise.all([
      supabase.from('sales_channels').select('canonical_key, display_name').eq('company_id', auth.companyId).eq('status', 'active'),
      loadTrustedAnalyticsChannels(supabase, auth.companyId),
    ])
    if (channelError) throw new Error(channelError.message)
    const channelNameByKey = new Map((registeredChannels ?? []).map((channel) => [String(channel.canonical_key), String(channel.display_name)]))

    const { data: orders, error: ordersError } = await fetchAllRows((from, to) =>
      supabase
        .from('orders')
        .select('connection_id, external_order_id, status, sales_channel, total_amount, fee_amount, ordered_at')
        .in('connection_id', connectionIds)
        .eq('company_id', auth.companyId)
        .eq('analytics_included', true)
        .gte('ordered_at', since)
        .order('ordered_at', { ascending: false })
        .range(from, to)
    )
    if (ordersError) throw new Error(ordersError.message)

    if (!orders || orders.length === 0) {
      res.status(200).json({ ok: true, overview: { ...EMPTY_OVERVIEW, source: 'real' }, byMarketplace: [], transactions: [], lastSyncAt } satisfies FinanceApiResponse)
      return
    }

    const paid = orders.filter((o) => o.status === 'paid')
    const cancelled = orders.filter((o) => o.status === 'cancelled')

    const grossRevenue = paid.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
    const fees = paid.reduce((s, o) => s + Number(o.fee_amount ?? 0), 0)
    const refunds = cancelled.reduce((s, o) => s + Number(o.total_amount ?? 0), 0)
    const netValue = grossRevenue - fees - refunds

    const overview: FinanceOverview = { grossRevenue, fees, refunds, netValue, source: 'real' }

    // Agrupa por provider real (não mais 1 linha fixa "Mercado Livre") —
    // cada marketplace conectado com pedido no período vira uma linha.
    // Agregação por canal EFETIVO: pedidos antigos presos em canônicos VTEX
    // legados fabricados (external:vtex:mzn-..., mlb-..., ...) caem juntos
    // no mesmo "Canal não identificado" em vez de virarem uma linha cada.
    // `orders`/`sales_channels` não são alterados — só a leitura agrega
    // diferente. `resolveEffectiveAnalyticsChannel` nunca usa prefixo:
    // decide por `trustedChannels` (registry + mappings resolvidos).
    const byChannel = new Map<StoredSalesChannel, { grossRevenue: number; fees: number; refunds: number; ordersCount: number; displayName: string }>()
    for (const o of paid) {
      const provider = providerByConnectionId.get(o.connection_id)
      const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
      if (!storedChannel) continue
      const { effectiveChannel, displayName } = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel))
      const acc = byChannel.get(effectiveChannel) ?? { grossRevenue: 0, fees: 0, refunds: 0, ordersCount: 0, displayName }
      acc.grossRevenue += Number(o.total_amount ?? 0)
      acc.fees += Number(o.fee_amount ?? 0)
      acc.ordersCount += 1
      byChannel.set(effectiveChannel, acc)
    }
    for (const o of cancelled) {
      const provider = providerByConnectionId.get(o.connection_id)
      const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
      if (!storedChannel) continue
      const { effectiveChannel, displayName } = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel))
      const acc = byChannel.get(effectiveChannel) ?? { grossRevenue: 0, fees: 0, refunds: 0, ordersCount: 0, displayName }
      acc.refunds += Number(o.total_amount ?? 0)
      byChannel.set(effectiveChannel, acc)
    }

    const growthByChannel = await computeGrowthByChannel(supabase, auth.companyId, connectionIds, providerByConnectionId, trustedChannels)
    const EMPTY_GROWTH: MarketplaceGrowth = { d1: null, d7: null, d30: null, d365: null }

    const byMarketplace: MarketplaceFinance[] = Array.from(byChannel.entries())
      .map(([channel, acc]): MarketplaceFinance | null => {
        const marketplace = acc.displayName
        return {
          marketplace,
          grossRevenue: acc.grossRevenue,
          fees: acc.fees,
          refunds: acc.refunds,
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
    const transactions: FinanceTransaction[] = [
      ...paid.flatMap((o) => {
        const provider = providerByConnectionId.get(o.connection_id)
        const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
        const marketplace = storedChannel ? resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel)).displayName : undefined
        if (!marketplace) return []
        return [{
          date: new Date(o.ordered_at).toISOString().split('T')[0],
          marketplace,
          type: 'Venda' as const,
          identifier: o.external_order_id,
          gross: Number(o.total_amount ?? 0),
          discount: Number(o.fee_amount ?? 0),
          net: Number(o.total_amount ?? 0) - Number(o.fee_amount ?? 0),
        }]
      }),
      ...cancelled.flatMap((o) => {
        const provider = providerByConnectionId.get(o.connection_id)
        const storedChannel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
        const marketplace = storedChannel ? resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel)).displayName : undefined
        if (!marketplace) return []
        return [{
          date: new Date(o.ordered_at).toISOString().split('T')[0],
          marketplace,
          type: 'Estorno' as const,
          identifier: o.external_order_id,
          gross: -Number(o.total_amount ?? 0),
          discount: Number(o.total_amount ?? 0),
          net: -Number(o.total_amount ?? 0),
        }]
      }),
    ].sort((a, b) => (a.date < b.date ? 1 : -1))

    res.status(200).json({ ok: true, overview, byMarketplace, transactions, lastSyncAt } satisfies FinanceApiResponse)
  } catch (err) {
    console.error('[api/dashboard/finance]', err)
    res.status(200).json({ ok: false, overview: { ...EMPTY_OVERVIEW, source: 'demo' }, byMarketplace: [], transactions: [], lastSyncAt: null, message: 'Erro controlado ao consultar financeiro.' } satisfies FinanceApiResponse)
  }
}
