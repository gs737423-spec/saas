import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import { loadTrustedAnalyticsChannels, resolveEffectiveAnalyticsChannel, type StoredSalesChannel } from '../../src/server/analytics/channels.js'
import { resolveAnalyticsDateRange, saoPauloDateKey, saoPauloDateLabel, shiftSaoPauloDate } from '../../src/server/analytics/dateRange.js'

export interface DailyRevenuePoint {
  date: string
  label: string
  mercadolivre: number
  shopee: number
  amazon: number
  lojapropria: number
  channels: Record<string, number>
  total: number
}

interface DailyApiResponse {
  ok: boolean
  source: 'real' | 'demo' | 'config_missing' | 'error'
  days: DailyRevenuePoint[]
  channels: Array<{ key: string; label: string }>
  message?: string
}

interface DailyAggregateRow {
  order_day: string
  sales_channel: string
  gross_revenue: number | string
}

function emptyDays(totalDays: number, endExclusive = new Date()): DailyRevenuePoint[] {
  const out: DailyRevenuePoint[] = []
  const lastDay = saoPauloDateKey(new Date(endExclusive.getTime() - 1))
  for (let i = totalDays - 1; i >= 0; i--) {
    const date = shiftSaoPauloDate(lastDay, -i)
    out.push({
      date,
      label: saoPauloDateLabel(date),
      mercadolivre: 0,
      shopee: 0,
      amazon: 0,
      lojapropria: 0,
      channels: {},
      total: 0,
    })
  }
  return out
}

// Receita real dia-a-dia por marketplace — base do gráfico "Receita por
// Marketplace" em Marketplaces.tsx. Busca 2x o período pedido pra sempre ter
// a "janela anterior" completa pra comparação (ontem/semana passada/mês
// passado), igual o resto do dashboard financeiro.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      res.status(200).json({ ok: false, source: 'config_missing', days: [], channels: [], message: 'Configuração do Supabase pendente.' } satisfies DailyApiResponse)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const range = resolveAnalyticsDateRange(req.query, 180)
    const periodDays = range.days
    // +30 sempre, não só *2 — "Mês passado" desloca 30 dias pra trás, e um
    // período curto (ex. 13 dias) buscando só o dobro (26) fica sem janela
    // suficiente pra achar o par de comparação (linha tracejada some).
    const totalDays = periodDays + Math.max(periodDays, 30)
    const until = range.to.toISOString()
    const since = new Date(range.from.getTime() - Math.max(periodDays, 30) * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, provider')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])
    if (connError) throw new Error(connError.message)

    if (!connections || connections.length === 0) {
      res.status(200).json({ ok: true, source: 'demo', days: emptyDays(totalDays, range.to), channels: [] } satisfies DailyApiResponse)
      return
    }

    const connectionIds = connections.map((c) => c.id)

    const [{ data: registeredChannels, error: channelError }, trustedChannels] = await Promise.all([
      supabase.from('sales_channels').select('canonical_key, display_name').eq('company_id', auth.companyId).eq('status', 'active'),
      loadTrustedAnalyticsChannels(supabase, auth.companyId),
    ])
    if (channelError) throw new Error(channelError.message)
    const channelNameByKey = new Map((registeredChannels ?? []).map((channel) => [String(channel.canonical_key), String(channel.display_name)]))

    const { data: rows, error: aggregateError } = await supabase.rpc('dashboard_finance_daily_aggregate', {
      p_company_id: auth.companyId,
      p_connection_ids: connectionIds,
      p_since: since,
      p_until: until,
    })
    if (aggregateError) throw new Error(aggregateError.message)

    const byDay = new Map<string, DailyRevenuePoint>()
    const template = emptyDays(totalDays, range.to)
    for (const t of template) byDay.set(t.date, t)

    const displayNameByEffectiveKey = new Map<string, string>()
    for (const row of (rows ?? []) as DailyAggregateRow[]) {
      const storedChannel = (row.sales_channel as StoredSalesChannel | null) || 'external:vtex:unmapped'
      if (!storedChannel) continue
      // Agregação usa o canal EFETIVO, não o bruto — pedidos antigos presos
      // em canônicos legados fabricados (external:vtex:mzn-...) caem todos
      // no mesmo balde `external:vtex:unmapped`, nunca viram grupos
      // separados. `orders`/`sales_channels` não são alterados.
      const { effectiveChannel, displayName } = resolveEffectiveAnalyticsChannel(storedChannel, trustedChannels, channelNameByKey.get(storedChannel))
      displayNameByEffectiveKey.set(effectiveChannel, displayName)
      const key = String(row.order_day)
      const point = byDay.get(key)
      if (!point) continue
      const amount = Number(row.gross_revenue ?? 0)
      point.channels[effectiveChannel] = (point.channels[effectiveChannel] ?? 0) + amount
      const field: 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria' | null = effectiveChannel === 'loja_propria'
        ? 'lojapropria'
        : effectiveChannel === 'mercadolivre' || effectiveChannel === 'shopee' || effectiveChannel === 'amazon'
          ? effectiveChannel
          : null
      if (field) point[field] += amount
      point.total += amount
    }

    const observedKeys = new Set(Array.from(byDay.values()).flatMap((point) => Object.keys(point.channels)))
    const channels = Array.from(observedKeys).map((key) => ({ key, label: displayNameByEffectiveKey.get(key) ?? key }))
    res.status(200).json({ ok: true, source: 'real', days: Array.from(byDay.values()), channels } satisfies DailyApiResponse)
  } catch (err) {
    console.error('[api/dashboard/finance-daily]', err)
    res.status(200).json({ ok: false, source: 'error', days: [], channels: [], message: 'Erro controlado ao consultar receita diária.' } satisfies DailyApiResponse)
  }
}
