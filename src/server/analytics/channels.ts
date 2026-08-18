import type { SupabaseClient } from '@supabase/supabase-js'

export type StoredSalesChannel = string

export const SALES_CHANNEL_LABEL: Record<string, string> = {
  mercadolivre: 'Mercado Livre',
  shopee: 'Shopee',
  amazon: 'Amazon',
  magalu: 'Magalu',
  loja_propria: 'Loja Própria',
  'external:vtex:unmapped': 'Canal não identificado',
}

/** Canônicos SEMPRE confiáveis independente de qualquer dado de tenant —
 *  registry global + o balde único de "ainda não identificado". Nunca
 *  cresce por descoberta automática. */
const ALWAYS_TRUSTED_CHANNELS = new Set(Object.keys(SALES_CHANNEL_LABEL))
export const UNMAPPED_ANALYTICS_CHANNEL = 'external:vtex:unmapped'

export function salesChannelDisplayName(channel: string, registeredName?: string | null): string {
  if (registeredName?.trim()) return registeredName.trim()
  if (SALES_CHANNEL_LABEL[channel]) return SALES_CHANNEL_LABEL[channel]
  return channel.split(/[:_.-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || 'Outros canais'
}

export function providerDefaultChannel(provider: string): StoredSalesChannel | null {
  if (provider === 'mercadolivre' || provider === 'shopee' || provider === 'amazon' || provider === 'magalu' || provider === 'loja_propria') return provider
  return null
}

/** Conjunto de `canonical_key` em que o tenant confia de verdade, pra uso em
 *  agregação de analytics. Carregado 1x por request (nunca por pedido) — ver
 *  `loadTrustedAnalyticsChannels`.
 *
 *  REGRA (sem heurística de prefixo): um `canonical_key` só é confiável se:
 *  (a) está no registry global (`ALWAYS_TRUSTED_CHANNELS`, inclui o balde
 *      `external:vtex:unmapped`), OU
 *  (b) existe pelo menos UM `vtex_channel_mappings` com esse
 *      `canonical_channel` e `resolution_status = 'resolved'` — ou seja,
 *      uma fonte confiável (mapeamento explícito do usuário, ou venda
 *      própria detectada estruturalmente) realmente apontou pra ele.
 *
 *  Um canal fabricado pelo sync antigo (`external:vtex:mzn-...`) nunca tem
 *  mapping `resolved` apontando pra ele — foi criado exatamente pela ausência
 *  de resolução confiável — então nunca entra nesse conjunto, mesmo
 *  existindo fisicamente em `sales_channels` para não quebrar a FK dos
 *  pedidos antigos. Um canal customizado criado pelo usuário via
 *  `PUT /api/integrations/vtex/channel-mappings` SEMPRE tem, porque o
 *  próprio endpoint marca o mapping como `resolved` no mesmo fluxo que cria
 *  o canal — nunca é engolido por esta regra. */
export async function loadTrustedAnalyticsChannels(
  supabase: Pick<SupabaseClient, 'from'>,
  companyId: string,
): Promise<Set<string>> {
  const trusted = new Set(ALWAYS_TRUSTED_CHANNELS)
  const { data, error } = await supabase.from('vtex_channel_mappings')
    .select('canonical_channel')
    .eq('company_id', companyId)
    .eq('resolution_status', 'resolved')
  if (error) throw new Error(`Failed to load trusted VTEX channels: ${error.message}`)
  for (const row of data ?? []) {
    const key = (row as { canonical_channel: unknown }).canonical_channel
    if (typeof key === 'string' && key) trusted.add(key)
  }
  return trusted
}

/** `orders.sales_channel` bruto -> canal EFETIVO para agregação/exibição em
 *  analytics. Não confunda com a UI de mapeamento (`VtexChannelMappingCard`),
 *  que já resolve isso na origem por outro caminho — esta função é só para
 *  quem lê `orders`/`sales_channels` diretamente. Nunca usa prefixo como
 *  heurística: só consulta `trustedChannels` (ver `loadTrustedAnalyticsChannels`). */
export function resolveEffectiveAnalyticsChannel(
  storedChannel: string,
  trustedChannels: ReadonlySet<string>,
  registeredName?: string | null,
): { storedChannel: string; effectiveChannel: string; displayName: string } {
  if (trustedChannels.has(storedChannel)) {
    return { storedChannel, effectiveChannel: storedChannel, displayName: salesChannelDisplayName(storedChannel, registeredName) }
  }
  // Canal não confiável (artefato legado, ou qualquer chave desconhecida
  // fora do registry e sem mapping resolvido): degrada pro balde único —
  // preserva o valor bruto em `storedChannel` para quem precisar do dado
  // técnico, mas nunca agrega/exibe como canal próprio.
  return { storedChannel, effectiveChannel: UNMAPPED_ANALYTICS_CHANNEL, displayName: SALES_CHANNEL_LABEL[UNMAPPED_ANALYTICS_CHANNEL] }
}
