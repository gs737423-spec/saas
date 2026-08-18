import type { SupabaseClient } from '@supabase/supabase-js'
import type { VtexChannelMappings, VtexNormalizedOrder } from './types.js'
import {
  CANONICAL_CHANNELS,
  UNRESOLVED_CHANNEL_DISPLAY_NAME,
  UNRESOLVED_CHANNEL_KEY,
  findCanonicalChannel,
  normalizeForComparison,
  parseVtexExternalKey,
} from './channelResolution.js'

export async function loadVtexChannelMappings(
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
  configured: VtexChannelMappings,
): Promise<VtexChannelMappings> {
  const merged: VtexChannelMappings = {}
  // Colapsa variações de escrita da MESMA chave canônica vindas da config
  // ("Amazon"/"amazon"/"AMAZON") antes de qualquer comparação — sem isso,
  // duas grafias viravam dois canais distintos no resultado da resolução.
  for (const [rawChannel, values] of Object.entries(configured)) {
    const canonical = findCanonicalChannel(rawChannel)?.key ?? normalizeForComparison(rawChannel)
    if (!canonical) continue
    merged[canonical] = [...new Set([...(merged[canonical] ?? []), ...values.map((value) => normalizeForComparison(value)).filter(Boolean)])]
  }

  const { data, error } = await supabase.from('vtex_channel_mappings')
    // Só colunas que existem desde a migration 019 — o caminho de LEITURA
    // não pode depender da 021; `identifier_type`/`identifier_value` são
    // derivados da `external_key`, que já carrega essa informação.
    .select('canonical_channel, external_key, affiliate_id, resolution_status')
    .eq('company_id', companyId)
    .eq('connection_id', connectionId)
    .eq('source_provider', 'vtex')
    .eq('resolution_status', 'resolved')
  if (error) throw new Error(`Failed to load VTEX channel mappings: ${error.message}`)
  for (const row of data ?? []) {
    const canonical = findCanonicalChannel(row.canonical_channel)?.key ?? normalizeForComparison(row.canonical_channel)
    if (!canonical || canonical === UNRESOLVED_CHANNEL_KEY) continue
    const values = merged[canonical] ?? []
    const identities = [parseVtexExternalKey(String(row.external_key)).value, row.affiliate_id, row.external_key]
      .map((value) => normalizeForComparison(value))
      .filter(Boolean)
    for (const identity of identities) {
      if (!values.includes(identity)) values.push(identity)
    }
    merged[canonical] = values
  }
  return merged
}

/** Chave de cache = (external_key, canonical_channel, resolution_status) — se
 *  qualquer um desses mudar entre pedidos, refaz o round-trip normalmente.
 *  Isso evita reescrever `sales_channels`/`vtex_channel_mappings` a cada
 *  pedido quando (o caso comum) muitos pedidos seguidos são do mesmo canal
 *  dentro da mesma run: sem cache eram 3 round-trips extras por pedido só
 *  pra reconfirmar um estado que já foi persistido segundos atrás. É também
 *  o que garante que o MESMO identificador repetido 10.000x resulte em UMA
 *  linha de mapping, não em 10.000 escritas. Escopo é por-run (Map criado
 *  em `processVtexSyncRun`), nunca cross-tenant. */
export type VtexChannelResolutionCache = Map<string, { discovered: boolean; resolved: boolean }>

/** Persiste a resolução de canal de UM pedido.
 *
 *  Invariante nova (causa raiz da explosão de canais): só existem linhas em
 *  `sales_channels` para canais canônicos de verdade — os do registry, os
 *  criados explicitamente pelo usuário, e o balde único
 *  `external:vtex:unmapped`. Um identificador bruto novo NUNCA vira canal:
 *  ele só produz/atualiza uma linha em `vtex_channel_mappings`.
 *
 *  `ignoreDuplicates: true` no upsert de `sales_channels` é deliberado —
 *  um canal já existente (inclusive renomeado pelo usuário) nunca tem seu
 *  display name sobrescrito pela sincronização. */
export async function persistVtexChannelResolution(
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
  order: VtexNormalizedOrder,
  cache?: VtexChannelResolutionCache,
): Promise<{ discovered: boolean; resolved: boolean }> {
  const cacheKey = `${order.externalChannelKey}::${order.channel}::${order.channelResolutionStatus}`
  const cached = cache?.get(cacheKey)
  if (cached) return cached

  const { error: channelError } = await supabase.from('sales_channels').upsert({
    company_id: companyId,
    canonical_key: order.channel,
    display_name: order.channelDisplayName,
    channel_type: order.channelType,
    status: 'active',
  }, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
  if (channelError) throw new Error(`Failed to persist sales channel: ${channelError.message}`)

  const { data: existing, error: existingError } = await supabase.from('vtex_channel_mappings')
    .select('id')
    .eq('company_id', companyId)
    .eq('connection_id', connectionId)
    .eq('source_provider', 'vtex')
    .eq('external_key', order.externalChannelKey)
    .maybeSingle()
  if (existingError) throw new Error(`Failed to resolve VTEX channel identity: ${existingError.message}`)

  // Fallback defensivo: se não achou pela `external_key` exata, procura pela
  // IDENTIDADE normalizada (identifier_type + identifier_value, já sempre
  // lowercase/trim aqui — ver `resolveVtexChannelIdentity`). Isso cobre uma
  // linha legada cujo `external_key` foi gravado com case/whitespace
  // diferente (dado sujo anterior a esta normalização, ou escrita fora do
  // caminho da aplicação): sem esse fallback, o upsert abaixo tentaria
  // INSERIR uma segunda linha física com a MESMA identidade normalizada —
  // que colidiria com o índice `vtex_channel_mappings_identifier_uidx` da
  // migration 021 e explodiria o item em erro em vez de simplesmente
  // atualizar a linha correta. `identifier_value` só existe como coluna
  // depois da 021; antes disso a coluna não existe e este select falha —
  // por isso a 021 tem que ser aplicada ANTES do deploy deste código
  // (ordem de rollout já documentada), nunca depois.
  let targetId = existing?.id ?? null
  if (!targetId) {
    const { data: normalizedMatch, error: normalizedError } = await supabase.from('vtex_channel_mappings')
      .select('id')
      .eq('company_id', companyId)
      .eq('connection_id', connectionId)
      .eq('source_provider', 'vtex')
      .eq('identifier_type', order.identifierType)
      .eq('identifier_value', order.identifierValue)
      .maybeSingle()
    if (normalizedError) throw new Error(`Failed to resolve VTEX channel identity: ${normalizedError.message}`)
    targetId = normalizedMatch?.id ?? null
  }

  const payload = {
    company_id: companyId,
    connection_id: connectionId,
    source_provider: 'vtex',
    external_key: order.externalChannelKey,
    identifier_type: order.identifierType,
    identifier_value: order.identifierValue,
    resolution_source: order.resolutionSource,
    affiliate_id: order.affiliateId,
    external_marketplace_id: null,
    external_marketplace_name: order.externalMarketplaceName,
    external_sales_channel: order.externalSalesChannel,
    canonical_channel: order.channel,
    resolution_status: order.channelResolutionStatus,
    last_seen_at: new Date().toISOString(),
  }

  if (targetId) {
    // Atualiza a linha existente (achada por external_key OU por identidade
    // normalizada) em vez de inserir uma nova — nunca duas linhas físicas
    // para a mesma identidade. Isso também "autocura" o external_key de uma
    // linha legada suja, escrevendo a forma normalizada por cima dele.
    const { error: updateError } = await supabase.from('vtex_channel_mappings').update(payload).eq('id', targetId)
    if (updateError) throw new Error(`Failed to persist VTEX channel mapping: ${updateError.message}`)
  } else {
    const { error: mappingError } = await supabase.from('vtex_channel_mappings').upsert(
      payload,
      { onConflict: 'company_id,connection_id,source_provider,external_key' },
    )
    if (mappingError) throw new Error(`Failed to persist VTEX channel mapping: ${mappingError.message}`)
  }

  const result = { discovered: !existing && !targetId, resolved: order.channelResolutionStatus === 'resolved' }
  // O cache guarda `discovered: false`: a descoberta é um evento ÚNICO por
  // identificador. Antes o cache devolvia o mesmo objeto (com
  // `discovered: true`) para todos os pedidos seguintes do mesmo canal, o
  // que inflava `counts.channelsDiscovered` e emitia um log
  // `channel_discovered` por pedido — numa conta real, milhares de eventos
  // idênticos para um único identificador.
  cache?.set(cacheKey, { discovered: false, resolved: result.resolved })
  return result
}

/** Garante que os canais canônicos base e o balde de não identificados
 *  existam para a empresa. Chamado uma vez por run, não por pedido —
 *  idempotente e barato. É o que permite ao usuário escolher "Amazon" na
 *  UI mesmo antes de qualquer pedido de Amazon ter chegado, sem que a
 *  sincronização precise inventar canais. */
export async function ensureBaseSalesChannels(
  supabase: SupabaseClient,
  companyId: string,
): Promise<void> {
  const rows = [
    ...CANONICAL_CHANNELS.map((channel) => ({
      company_id: companyId, canonical_key: channel.key, display_name: channel.displayName,
      channel_type: channel.channelType, status: 'active',
    })),
    {
      company_id: companyId, canonical_key: UNRESOLVED_CHANNEL_KEY,
      display_name: UNRESOLVED_CHANNEL_DISPLAY_NAME, channel_type: 'external', status: 'active',
    },
  ]
  const { error } = await supabase.from('sales_channels').upsert(rows, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
  if (error) throw new Error(`Failed to ensure base sales channels: ${error.message}`)
}

/** Reexport utilitário — quem lê uma linha de mapping legada (sem as
 *  colunas identifier_*) consegue derivar tipo/valor a partir da
 *  `external_key`, que sempre existiu. */
export { parseVtexExternalKey }
