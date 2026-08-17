import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../../src/server/auth/requireCompany.js'
import type { Provider } from '../../src/server/integrations/types.js'
import { providerDefaultChannel, salesChannelDisplayName, type StoredSalesChannel } from '../../src/server/analytics/channels.js'

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

function dateKey(iso: string): string {
  return iso.slice(0, 10)
}

function emptyDays(totalDays: number): DailyRevenuePoint[] {
  const out: DailyRevenuePoint[] = []
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
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

    const periodDays = Math.min(180, Math.max(1, Number(req.query.days) || 30))
    // +30 sempre, não só *2 — "Mês passado" desloca 30 dias pra trás, e um
    // período curto (ex. 13 dias) buscando só o dobro (26) fica sem janela
    // suficiente pra achar o par de comparação (linha tracejada some).
    const totalDays = periodDays + Math.max(periodDays, 30)
    const since = new Date(Date.now() - totalDays * 24 * 60 * 60 * 1000).toISOString()

    const supabase = await getSupabaseAdmin()

    const { data: connections, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, provider')
      .eq('company_id', auth.companyId)
      .in('status', ['connected', 'syncing', 'requires_attention', 'error', 'expired'])
    if (connError) throw new Error(connError.message)

    if (!connections || connections.length === 0) {
      res.status(200).json({ ok: true, source: 'demo', days: emptyDays(totalDays), channels: [] } satisfies DailyApiResponse)
      return
    }

    const providerByConnectionId = new Map(connections.map((c) => [c.id, c.provider as Provider]))
    const connectionIds = connections.map((c) => c.id)

    const { data: registeredChannels, error: channelError } = await supabase.from('sales_channels')
      .select('canonical_key, display_name').eq('company_id', auth.companyId).eq('status', 'active')
    if (channelError) throw new Error(channelError.message)
    const channelNameByKey = new Map((registeredChannels ?? []).map((channel) => [String(channel.canonical_key), String(channel.display_name)]))

    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('connection_id, sales_channel, total_amount, ordered_at')
      .in('connection_id', connectionIds)
      .eq('company_id', auth.companyId)
      .eq('status', 'paid')
      .eq('analytics_included', true)
      .gte('ordered_at', since)
    if (ordersError) throw new Error(ordersError.message)

    const byDay = new Map<string, DailyRevenuePoint>()
    const template = emptyDays(totalDays)
    for (const t of template) byDay.set(t.date, t)

    for (const o of orders ?? []) {
      const provider = providerByConnectionId.get(o.connection_id)
      const channel = (o.sales_channel as StoredSalesChannel | null) ?? (provider ? providerDefaultChannel(provider) : null)
      if (!channel) continue
      const key = dateKey(o.ordered_at)
      const point = byDay.get(key)
      if (!point) continue
      const amount = Number(o.total_amount ?? 0)
      point.channels[channel] = (point.channels[channel] ?? 0) + amount
      const field: 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria' | null = channel === 'loja_propria'
        ? 'lojapropria'
        : channel === 'mercadolivre' || channel === 'shopee' || channel === 'amazon'
          ? channel
          : null
      if (field) point[field] += amount
      point.total += amount
    }

    const observedKeys = new Set(Array.from(byDay.values()).flatMap((point) => Object.keys(point.channels)))
    const channels = Array.from(observedKeys).map((key) => ({ key, label: salesChannelDisplayName(key, channelNameByKey.get(key)) }))
    res.status(200).json({ ok: true, source: 'real', days: Array.from(byDay.values()), channels } satisfies DailyApiResponse)
  } catch (err) {
    console.error('[api/dashboard/finance-daily]', err)
    res.status(200).json({ ok: false, source: 'error', days: [], channels: [], message: 'Erro controlado ao consultar receita diária.' } satisfies DailyApiResponse)
  }
}
