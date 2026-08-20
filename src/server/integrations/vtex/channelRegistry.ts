import type { SupabaseClient } from '@supabase/supabase-js'
import type { VtexClient } from './client.js'
import type { VtexChannelMappings, VtexNormalizedOrder } from './types.js'
import {
  UNRESOLVED_CHANNEL_DISPLAY_NAME,
  UNRESOLVED_CHANNEL_KEY,
  buildVtexExternalKey,
  canonicalKeyFromTrustedName,
  findCanonicalChannel,
  findCanonicalChannelByNameContains,
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
export interface PersistedVtexChannelResolution {
  discovered: boolean
  resolved: boolean
  canonicalChannel: string
  resolutionStatus: 'resolved' | 'unresolved' | 'ignored'
}

export type VtexChannelResolutionCache = Map<string, PersistedVtexChannelResolution>

/** Reclassifica SOMENTE dados locais depois que uma fonte confiável resolveu
 * um identifier. Não rechama nem altera pedido na VTEX e não recria itens.
 * Processa em blocos tenant-scoped e preserva os pedidos/valores existentes. */
export async function reclassifyVtexOrdersForIdentifier(
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
  identifierType: 'affiliate_id' | 'sales_channel',
  identifierValue: string,
  canonicalKey: string,
): Promise<number> {
  let updated = 0
  const column = identifierType === 'affiliate_id' ? 'affiliate_id' : 'external_sales_channel'
  while (true) {
    let refsQuery = supabase.from('order_source_refs')
      .select('id, order_id')
      .eq('company_id', companyId).eq('connection_id', connectionId).eq('provider', 'vtex')
      .eq(column, identifierValue).neq('channel_key', canonicalKey)
    // O affiliate é a identidade prioritária do pedido VTEX. Um mapping de
    // salesChannel só pode reclassificar pedidos que realmente não possuem
    // affiliate; do contrário, uma policy comercial compartilhada poderia
    // sobrescrever Amazon/ML/etc. já identificados pelo affiliate.
    if (identifierType === 'sales_channel') refsQuery = refsQuery.is('affiliate_id', null)
    const { data: refs, error } = await refsQuery.limit(500)
    if (error) throw new Error(`Failed to load VTEX orders for channel reclassification: ${error.message}`)
    if (!refs || refs.length === 0) break
    const refIds = refs.map((row) => row.id)
    const orderIds = [...new Set(refs.map((row) => row.order_id))]
    // Pedido primeiro, provenance depois: se a segunda escrita falhar, a
    // ref continua selecionável e o retry repete a primeira idempotentemente.
    // A ordem inversa poderia esconder para sempre um pedido não atualizado.
    const { error: ordersError } = await supabase.from('orders').update({
      sales_channel: canonicalKey, channel_resolution_status: 'resolved', unavailable_reason: null,
    }).eq('company_id', companyId).eq('connection_id', connectionId).in('id', orderIds)
    if (ordersError) throw new Error(`Failed to update VTEX order analytics channel: ${ordersError.message}`)
    const { error: refsError } = await supabase.from('order_source_refs').update({
      channel_key: canonicalKey, channel_resolution_status: 'resolved',
    }).eq('company_id', companyId).eq('connection_id', connectionId).in('id', refIds)
    if (refsError) throw new Error(`Failed to update VTEX order provenance channel: ${refsError.message}`)
    updated += orderIds.length
    if (refs.length < 500) break
  }
  return updated
}

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
): Promise<PersistedVtexChannelResolution> {
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
    .select('id, canonical_channel, resolution_status, resolution_source')
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
  let matchedMapping = existing
  let targetId = matchedMapping?.id ?? null
  if (!targetId) {
    const { data: normalizedMatch, error: normalizedError } = await supabase.from('vtex_channel_mappings')
      .select('id, canonical_channel, resolution_status, resolution_source')
      .eq('company_id', companyId)
      .eq('connection_id', connectionId)
      .eq('source_provider', 'vtex')
      .eq('identifier_type', order.identifierType)
      .eq('identifier_value', order.identifierValue)
      .maybeSingle()
    if (normalizedError) throw new Error(`Failed to resolve VTEX channel identity: ${normalizedError.message}`)
    matchedMapping = normalizedMatch ?? null
    targetId = matchedMapping?.id ?? null
  }

  const authoritative = matchedMapping && matchedMapping.resolution_source === 'mapping' && matchedMapping.resolution_status === 'resolved'
    ? matchedMapping
    : null
  if (authoritative) {
    const result = {
      discovered: false,
      resolved: true,
      canonicalChannel: String(authoritative.canonical_channel),
      resolutionStatus: 'resolved' as const,
    }
    cache?.set(cacheKey, result)
    return result
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

  const result = {
    discovered: !existing && !targetId,
    resolved: order.channelResolutionStatus === 'resolved',
    canonicalChannel: order.channel,
    resolutionStatus: order.channelResolutionStatus,
  }
  // O cache guarda `discovered: false`: a descoberta é um evento ÚNICO por
  // identificador. Antes o cache devolvia o mesmo objeto (com
  // `discovered: true`) para todos os pedidos seguintes do mesmo canal, o
  // que inflava `counts.channelsDiscovered` e emitia um log
  // `channel_discovered` por pedido — numa conta real, milhares de eventos
  // idênticos para um único identificador.
  cache?.set(cacheKey, { ...result, discovered: false })
  return result
}

/** Garante apenas o balde técnico de não identificados. As opções conhecidas
 * ficam no registry de código e só são persistidas quando observadas. */
export async function ensureBaseSalesChannels(
  supabase: SupabaseClient,
  companyId: string,
): Promise<void> {
  // Só o balde técnico é obrigatório. Canais conhecidos passam a ser
  // criados quando forem realmente observados/resolvidos; sem isso toda
  // empresa parecia usar Amazon/ML/Shopee/Magalu mesmo sem um pedido deles.
  const rows = [{
      company_id: companyId, canonical_key: UNRESOLVED_CHANNEL_KEY,
      display_name: UNRESOLVED_CHANNEL_DISPLAY_NAME, channel_type: 'external', status: 'active',
    }]
  const { error } = await supabase.from('sales_channels').upsert(rows, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
  if (error) throw new Error(`Failed to ensure base sales channels: ${error.message}`)
}

/** Resolve automaticamente identificadores `affiliateId` usando o NOME real
 *  que a própria VTEX guarda pra cada affiliate (Marketplace API) — nunca
 *  chuta a partir da sigla.
 *
 *  Dois casos, ambos baseados no nome REAL, nunca inventado:
 *  1. Nome bate com um canal canônico já conhecido (Mercado Livre, Amazon,
 *     Shopee, Magalu) — usa esse canônico.
 *  2. Nome não bate com nenhum conhecido, mas é um nome real de verdade
 *     (não a sigla) — cria um canônico NOVO a partir desse nome (dedupe por
 *     nome normalizado, igual ao fluxo "Criar canal..." que o usuário já
 *     tinha manualmente). Diferente da heurística proibida em
 *     channelResolution.ts (que tentava adivinhar o MARKETPLACE a partir da
 *     SIGLA arbitrária): aqui a fonte é o nome que o próprio vendedor
 *     digitou no painel da VTEX pra identificar aquele affiliate — dado
 *     real, não suposição sobre 3 letras.
 *
 *  Sempre grava também a linha em `sales_channels` (upsert com
 *  `ignoreDuplicates`, igual `ensureBaseSalesChannels`) pra o nome real
 *  acentuado aparecer certinho na UI mesmo antes de qualquer pedido chegar
 *  — sem isso, `humanizeCanonicalKey` reconstituiria o nome a partir da
 *  chave normalizada (sem acento) só quando o primeiro pedido processasse.
 *
 *  Nunca sobrescreve uma linha já resolvida por `'mapping'` (escolha
 *  explícita do usuário) — essa sempre vence. Se o endpoint não existir pra
 *  essa conta/plano (API nova, pode não estar habilitada) ou devolver algo
 *  inesperado, devolve `{ resolved: 0, checked: 0 }` em vez de derrubar a
 *  run — é um enriquecimento best-effort, nunca um requisito pra sincronizar. */
export async function autoResolveVtexAffiliatesFromRegistry(
  client: VtexClient,
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
): Promise<{ resolved: number; checked: number }> {
  const { data: observed, error: observedError } = await supabase.from('vtex_channel_mappings')
    .select('identifier_value')
    .eq('company_id', companyId).eq('connection_id', connectionId).eq('source_provider', 'vtex')
    .eq('identifier_type', 'affiliate_id')
  if (observedError) return { resolved: 0, checked: 0 }
  const observedIds = new Set((observed ?? []).map((row) => normalizeForComparison(row.identifier_value)).filter(Boolean))
  let affiliates: Array<{ affiliateId?: unknown; id?: unknown; name?: unknown; Name?: unknown }> = []
  try {
    const raw = await client.getAffiliates()
    if (Array.isArray(raw)) affiliates = raw
    else if (raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)) {
      affiliates = (raw as { items: typeof affiliates }).items
    }
  } catch {
    return { resolved: 0, checked: 0 }
  }

  let resolved = 0
  let checked = 0
  for (const affiliate of affiliates) {
    const code = affiliate.affiliateId ?? affiliate.id
    const name = affiliate.name ?? affiliate.Name
    if (typeof code !== 'string' && typeof code !== 'number') continue
    if (typeof name !== 'string' || !name.trim()) continue
    if (!observedIds.has(normalizeForComparison(String(code)))) continue
    checked += 1
    const realName = name.trim()
    const canonical = findCanonicalChannelByNameContains(realName)
    // Sem canônico conhecido: cria um novo a partir do nome REAL (nunca da
    // sigla). `normalizeForComparison` vira a chave (ASCII, dedupe); o nome
    // com acento/caixa original vira o display name, gravado abaixo.
    const canonicalKey = canonical?.key ?? canonicalKeyFromTrustedName(realName)
    if (!canonicalKey) continue
    const displayName = canonical?.displayName ?? realName
    const channelType = canonical?.channelType ?? 'marketplace'

    const identifierValue = normalizeForComparison(String(code))
    if (!identifierValue) continue
    const externalKey = buildVtexExternalKey('affiliate_id', identifierValue)

    try {
      const { data: existing, error: existingError } = await supabase.from('vtex_channel_mappings')
        .select('id, resolution_source, canonical_channel')
        .eq('company_id', companyId).eq('connection_id', connectionId).eq('source_provider', 'vtex')
        .eq('external_key', externalKey).maybeSingle()
      if (existingError) throw new Error(existingError.message)
      if (existing && existing.resolution_source === 'mapping') {
        await reclassifyVtexOrdersForIdentifier(supabase, companyId, connectionId, 'affiliate_id', String(code), existing.canonical_channel)
        continue
      }

      const { error: channelError } = await supabase.from('sales_channels').upsert({
        company_id: companyId, canonical_key: canonicalKey, display_name: displayName,
        channel_type: channelType, status: 'active',
      }, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
      if (channelError) throw new Error(channelError.message)

      const payload = {
        company_id: companyId, connection_id: connectionId, source_provider: 'vtex',
        external_key: externalKey, identifier_type: 'affiliate_id', identifier_value: identifierValue,
        resolution_source: 'vtex_affiliate_registry', affiliate_id: String(code),
        external_marketplace_id: null, external_marketplace_name: realName,
        external_sales_channel: null, canonical_channel: canonicalKey,
        resolution_status: 'resolved', last_seen_at: new Date().toISOString(),
      }
      if (existing) {
        const { error } = await supabase.from('vtex_channel_mappings').update(payload).eq('id', existing.id)
        if (error) throw new Error(error.message)
      } else {
        const { error } = await supabase.from('vtex_channel_mappings').upsert(payload, { onConflict: 'company_id,connection_id,source_provider,external_key' })
        if (error) throw new Error(error.message)
      }
      await reclassifyVtexOrdersForIdentifier(supabase, companyId, connectionId, 'affiliate_id', String(code), canonicalKey)
      resolved += 1
    } catch (error) {
      // Falha isolada num affiliate (rede, conflito) não derruba os demais —
      // mesmo padrão de isolamento usado em discoverVtexSkuIdsBySalesChannel.
      await logRegistryFailure(supabase, companyId, connectionId, 'affiliate_id', String(code), error)
    }
  }
  return { resolved, checked }
}

async function logRegistryFailure(
  _supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
  identifierType: 'affiliate_id' | 'sales_channel',
  identifierValue: string,
  error: unknown,
): Promise<void> {
  // Usa o logger comum sem expor payload/credencial da VTEX. Import local
  // evita acoplar o caminho quente de resolução ao logger quando não há erro.
  const { logSyncEvent } = await import('../syncLog.js')
  await logSyncEvent({
    companyId, connectionId, provider: 'vtex', eventType: 'sync_stage', status: 'error',
    message: 'VTEX trusted channel registry entry could not be persisted',
    payload: { code: 'CHANNEL_REGISTRY_PERSIST_FAILED', identifierType, identifierValue: normalizeForComparison(identifierValue), error: error instanceof Error ? error.message.slice(0, 200) : 'unknown' },
  })
}

/** Resolve salesChannel pelo NOME real retornado por
 * `/saleschannel/list`. Só toca identifiers já observados; uma policy
 * comercial existente na conta, mas nunca usada em pedido, não vira canal
 * visual da MKTONLINE. */
export async function autoResolveVtexSalesChannelsFromRegistry(
  client: VtexClient,
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
): Promise<{ resolved: number; checked: number }> {
  const { data: observed, error: observedError } = await supabase.from('vtex_channel_mappings')
    .select('id, identifier_value, resolution_source, canonical_channel')
    .eq('company_id', companyId).eq('connection_id', connectionId).eq('source_provider', 'vtex')
    .eq('identifier_type', 'sales_channel')
  if (observedError) return { resolved: 0, checked: 0 }
  const byId = new Map((observed ?? []).map((row) => [normalizeForComparison(row.identifier_value), row]))
  let channels: Array<{ Id: number | string; Name?: string; IsActive?: boolean }> = []
  try {
    const raw = await client.getSalesChannels()
    channels = Array.isArray(raw) ? raw : []
  } catch {
    return { resolved: 0, checked: byId.size }
  }
  let resolved = 0
  for (const channel of channels) {
    const identifierValue = normalizeForComparison(String(channel.Id))
    const existing = byId.get(identifierValue)
    const realName = typeof channel.Name === 'string' ? channel.Name.trim() : ''
    if (!existing || !realName) continue
    if (existing.resolution_source === 'mapping') {
      await reclassifyVtexOrdersForIdentifier(supabase, companyId, connectionId, 'sales_channel', String(channel.Id), existing.canonical_channel)
      continue
    }
    const known = findCanonicalChannelByNameContains(realName)
    const canonicalKey = known?.key ?? canonicalKeyFromTrustedName(realName)
    if (!canonicalKey) continue
    try {
      const { error: channelError } = await supabase.from('sales_channels').upsert({
        company_id: companyId, canonical_key: canonicalKey, display_name: known?.displayName ?? realName,
        channel_type: known?.channelType ?? 'external', status: 'active',
      }, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
      if (channelError) throw new Error(channelError.message)
      const { error: mappingError } = await supabase.from('vtex_channel_mappings').update({
        canonical_channel: canonicalKey, resolution_status: 'resolved', resolution_source: 'vtex_affiliate_registry',
        external_marketplace_name: realName, external_sales_channel: String(channel.Id), last_seen_at: new Date().toISOString(),
      }).eq('id', existing.id)
      if (mappingError) throw new Error(mappingError.message)
      await reclassifyVtexOrdersForIdentifier(supabase, companyId, connectionId, 'sales_channel', String(channel.Id), canonicalKey)
      resolved += 1
    } catch (error) {
      await logRegistryFailure(supabase, companyId, connectionId, 'sales_channel', String(channel.Id), error)
    }
  }
  return { resolved, checked: byId.size }
}

/** Reexport utilitário — quem lê uma linha de mapping legada (sem as
 *  colunas identifier_*) consegue derivar tipo/valor a partir da
 *  `external_key`, que sempre existiu. */
export { parseVtexExternalKey }
