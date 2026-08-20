/** Resolução de canal VTEX — fonte única de verdade.
 *
 *  CAUSA RAIZ QUE ESTE ARQUIVO CORRIGE
 *  -----------------------------------
 *  Antes, `resolveVtexChannel()` (normalize.ts) fabricava um CANAL CANÔNICO
 *  novo (`external:vtex:<slug>-<hash>`) para CADA identificador bruto
 *  desconhecido vindo da VTEX (`affiliateId` ou `salesChannel`: MLP, MZN,
 *  KBM, CMR, "1", ...). Como `orders.sales_channel` tem FK para
 *  `sales_channels(company_id, canonical_key)`, o sync era obrigado a
 *  inserir uma linha em `sales_channels` por identificador — ou seja, cada
 *  sigla bruta virava um "marketplace" de verdade no modelo de dados e um
 *  card na UI. Numa conta real isso produziu dezenas/centenas de canais.
 *
 *  O modelo correto separa duas coisas que estavam fundidas:
 *
 *  1. CANAL CANÔNICO (`sales_channels`) — dimensão analítica estável e
 *     pequena: Mercado Livre, Amazon, Shopee, Magalu, Loja Própria, mais os
 *     que o usuário criar explicitamente, mais UM único balde para o que
 *     ainda não foi identificado (`external:vtex:unmapped`). NUNCA é criado
 *     automaticamente a partir de um identificador bruto.
 *
 *  2. IDENTIFICADOR BRUTO VTEX (`vtex_channel_mappings`) — por
 *     company/connection: (identifier_type, identifier_value) apontando
 *     para um canal canônico ou para nenhum (`unresolved`). Descobrir um
 *     identificador novo cria/atualiza UMA linha aqui e nada mais.
 *
 *  REGRA INEGOCIÁVEL: não existe heurística de sigla -> marketplace. "MZN"
 *  não vira Amazon por parecer. Só há duas fontes de resolução confiáveis:
 *  (a) mapeamento configurado/salvo pelo usuário (`source: 'mapping'`);
 *  (b) ausência de identificador de marketplace = venda própria
 *      (`source: 'native_store'`), que é fato estrutural da VTEX, não chute.
 *  Todo o resto é `unresolved` — o pedido continua importando e contando
 *  nos totais, sob o rótulo "Canal não identificado".
 */

import type { VtexChannelMappings, VtexChannelResolutionStatus } from './types.js'

export type VtexIdentifierType = 'affiliate_id' | 'sales_channel' | 'native_store' | 'unidentified'

export interface CanonicalChannelDefinition {
  /** Chave estável usada em `sales_channels.canonical_key`, em
   *  `orders.sales_channel` e — importante — na resolução de LOGO. Nunca
   *  resolvemos marca por display name (o usuário pode renomear e um
   *  identificador bruto pode ter nome parecido). */
  key: string
  displayName: string
  channelType: 'marketplace' | 'own_store' | 'external' | 'other'
  /** Chave de branding (logo/cor) — igual à `key` para os conhecidos; o
   *  frontend resolve por ela, nunca por string de nome. */
  logoKey: string
  /** Apelidos GLOBAIS seguros: apenas variações de escrita do PRÓPRIO nome
   *  canônico (caixa, acento, espaço, hífen). Jamais siglas de affiliate.
   *  Servem só para impedir que "Amazon"/"amazon"/"AMAZON" digitados na UI
   *  criem canônicos diferentes. */
  aliases: string[]
}

export const UNRESOLVED_CHANNEL_KEY = 'external:vtex:unmapped'
export const UNRESOLVED_CHANNEL_DISPLAY_NAME = 'Canal não identificado'

export const CANONICAL_CHANNELS: readonly CanonicalChannelDefinition[] = [
  { key: 'mercadolivre', displayName: 'Mercado Livre', channelType: 'marketplace', logoKey: 'mercadolivre', aliases: ['mercadolivre', 'mercado livre', 'mercado-livre', 'meli'] },
  { key: 'amazon', displayName: 'Amazon', channelType: 'marketplace', logoKey: 'amazon', aliases: ['amazon', 'amazon br', 'amazon brasil'] },
  { key: 'shopee', displayName: 'Shopee', channelType: 'marketplace', logoKey: 'shopee', aliases: ['shopee'] },
  { key: 'magalu', displayName: 'Magalu', channelType: 'marketplace', logoKey: 'magalu', aliases: ['magalu', 'magazine luiza', 'magazineluiza'] },
  { key: 'loja_propria', displayName: 'Loja Própria', channelType: 'own_store', logoKey: 'loja_propria', aliases: ['loja propria', 'loja própria', 'loja_propria', 'lojapropria'] },
] as const

const CANONICAL_BY_KEY = new Map(CANONICAL_CHANNELS.map((channel) => [channel.key, channel]))
const CANONICAL_BY_ALIAS = new Map<string, CanonicalChannelDefinition>()
for (const channel of CANONICAL_CHANNELS) {
  for (const alias of [channel.key, channel.displayName, ...channel.aliases]) {
    CANONICAL_BY_ALIAS.set(normalizeForComparison(alias), channel)
  }
}

/** Normalização SÓ para comparação/dedupe: trim, unicode NFKD sem
 *  diacríticos, minúsculas, espaços colapsados. O display name bonito
 *  (com acento e caixa) é preservado à parte — nunca guardamos o valor
 *  normalizado como se fosse o nome. */
export function normalizeForComparison(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.normalize('NFKD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

/** Busca EXATA por chave canônica — é o que a resolução de logo usa.
 *  Diferente de `findCanonicalChannel`, não aceita alias nem display name:
 *  "Amazon" (nome) não resolve marca; só a chave `amazon` resolve. */
export function canonicalChannelByKey(key: unknown): CanonicalChannelDefinition | null {
  return typeof key === 'string' ? CANONICAL_BY_KEY.get(key) ?? null : null
}

/** Chave de branding do canal, ou null quando não há marca conhecida
 *  (canal criado pelo usuário, ou identificador ainda não resolvido) —
 *  nesse caso a UI usa ícone neutro, nunca uma logo emprestada. */
export function channelLogoKey(canonicalKey: unknown): string | null {
  return canonicalChannelByKey(canonicalKey)?.logoKey ?? null
}

export function findCanonicalChannel(value: unknown): CanonicalChannelDefinition | null {
  const normalized = normalizeForComparison(value)
  if (!normalized) return null
  return CANONICAL_BY_KEY.get(normalized) ?? CANONICAL_BY_ALIAS.get(normalized) ?? null
}

/** Casamento por SUBSTRING contra os aliases conhecidos — só usado quando a
 *  fonte é um NOME real registrado pelo vendedor na própria VTEX (nunca a
 *  sigla do affiliateId). Esse nome é texto livre ("Mercado Livre - Loja
 *  Oficial", "MeliFull", "Amazon BR Fulfillment") e raramente bate igual ao
 *  alias canônico — `findCanonicalChannel` (comparação exata) quase nunca
 *  resolveria nada nesse caso, mesmo quando o marketplace é óbvio pro nome
 *  inteiro. Continua nunca "chutando" a partir do código: só resolve quando
 *  o NOME real de verdade contém um alias inteiro. */
export function findCanonicalChannelByNameContains(value: unknown): CanonicalChannelDefinition | null {
  const normalized = normalizeForComparison(value)
  if (!normalized) return null
  for (const channel of CANONICAL_CHANNELS) {
    for (const alias of [channel.key, channel.displayName, ...channel.aliases]) {
      const normalizedAlias = normalizeForComparison(alias)
      if (normalizedAlias && normalized.includes(normalizedAlias)) return channel
    }
  }
  return null
}

/** Chave externa estável do identificador bruto — é ela que garante o
 *  dedupe de mapping (unique em company/connection/source_provider/
 *  external_key, migration 019). `identifier_type` + `identifier_value`
 *  passam a ser persistidos separadamente (migration 021) porque a UI
 *  precisa deles para agrupar e filtrar sem parsear string. */
export function buildVtexExternalKey(type: VtexIdentifierType, value: string): string {
  if (type === 'native_store') return 'native-store'
  if (type === 'unidentified') return 'marketplace:unidentified'
  const prefix = type === 'affiliate_id' ? 'affiliate' : 'sales-channel'
  return `${prefix}:${normalizeForComparison(value)}`
}

export function parseVtexExternalKey(externalKey: string): { type: VtexIdentifierType; value: string } {
  if (externalKey === 'native-store') return { type: 'native_store', value: 'native-store' }
  if (externalKey === 'marketplace:unidentified') return { type: 'unidentified', value: 'marketplace:unidentified' }
  if (externalKey.startsWith('affiliate:')) return { type: 'affiliate_id', value: externalKey.slice('affiliate:'.length) }
  if (externalKey.startsWith('sales-channel:')) return { type: 'sales_channel', value: externalKey.slice('sales-channel:'.length) }
  return { type: 'unidentified', value: externalKey }
}

export interface VtexRawIdentifiers {
  affiliateId: string | null
  salesChannel: string | null
}

export interface VtexChannelResolutionResult {
  status: VtexChannelResolutionStatus
  canonicalKey: string
  displayName: string
  channelType: CanonicalChannelDefinition['channelType']
  /** De onde veio a resolução — auditável, nunca "achismo".
   *  `mapping`: mapeamento salvo pelo usuário / configurado na conexão.
   *  `native_store`: pedido sem qualquer identificador de marketplace.
   *  `unresolved`: nenhuma fonte confiável (o normal para sigla nova). */
  source: 'mapping' | 'native_store' | 'unresolved'
  identifierType: VtexIdentifierType
  identifierValue: string
  externalKey: string
  rawIdentifiers: VtexRawIdentifiers
}

/** Identidade do pedido: `affiliateId` tem precedência sobre `salesChannel`
 *  (na VTEX o affiliate é quem realmente identifica o parceiro/marketplace;
 *  o salesChannel é a política comercial, e "1" é o default da loja).
 *  Um pedido tem UM identificador — affiliate e salesChannel do mesmo
 *  pedido nunca viram dois canais. */
export function resolveVtexChannelIdentity(input: {
  affiliateId?: string | null
  salesChannel?: string | null
  marketplaceOrderId?: string | null
}): { type: VtexIdentifierType; value: string; externalKey: string; raw: VtexRawIdentifiers } {
  const affiliate = normalizeForComparison(input.affiliateId)
  const salesChannel = normalizeForComparison(input.salesChannel)
  const raw: VtexRawIdentifiers = {
    affiliateId: typeof input.affiliateId === 'string' && input.affiliateId.trim() ? input.affiliateId.trim() : null,
    salesChannel: typeof input.salesChannel === 'string' && input.salesChannel.trim() ? input.salesChannel.trim() : null,
  }
  if (affiliate) return { type: 'affiliate_id', value: affiliate, externalKey: buildVtexExternalKey('affiliate_id', affiliate), raw }
  if (salesChannel) return { type: 'sales_channel', value: salesChannel, externalKey: buildVtexExternalKey('sales_channel', salesChannel), raw }
  if (!input.marketplaceOrderId) return { type: 'native_store', value: 'native-store', externalKey: buildVtexExternalKey('native_store', ''), raw }
  return { type: 'unidentified', value: 'marketplace:unidentified', externalKey: buildVtexExternalKey('unidentified', ''), raw }
}

/** Resolução determinística e centralizada. Nunca cria canônico novo:
 *  devolve um canônico existente (registry ou mapeamento do usuário) ou
 *  o balde único `external:vtex:unmapped`. */
export function resolveVtexChannel(
  input: { affiliateId?: string | null; salesChannel?: string | null; marketplaceOrderId?: string | null },
  mappings: VtexChannelMappings = {},
): VtexChannelResolutionResult {
  const identity = resolveVtexChannelIdentity(input)
  const base = {
    identifierType: identity.type,
    identifierValue: identity.value,
    externalKey: identity.externalKey,
    rawIdentifiers: identity.raw,
  }

  for (const [rawCanonicalKey, values] of Object.entries(mappings)) {
    if (!Array.isArray(values) || values.length === 0) continue
    const matched = values.some((value) => {
      const normalized = normalizeForComparison(value)
      if (!normalized) return false
      return normalized === identity.value || normalized === normalizeForComparison(identity.externalKey)
    })
    if (!matched) continue
    // "Amazon" vs "amazon" vs "AMAZON" configurados pelo usuário colapsam
    // no MESMO canônico — é aqui que a duplicata de Amazon deixa de existir.
    const known = findCanonicalChannel(rawCanonicalKey)
    const canonicalKey = known?.key ?? normalizeForComparison(rawCanonicalKey)
    if (!canonicalKey) continue
    return {
      ...base,
      status: 'resolved',
      canonicalKey,
      displayName: known?.displayName ?? humanizeCanonicalKey(canonicalKey),
      channelType: known?.channelType ?? 'marketplace',
      source: 'mapping',
    }
  }

  if (identity.type === 'native_store') {
    const own = CANONICAL_BY_KEY.get('loja_propria')!
    return { ...base, status: 'resolved', canonicalKey: own.key, displayName: own.displayName, channelType: own.channelType, source: 'native_store' }
  }

  return {
    ...base,
    status: 'unresolved',
    canonicalKey: UNRESOLVED_CHANNEL_KEY,
    displayName: UNRESOLVED_CHANNEL_DISPLAY_NAME,
    channelType: 'external',
    source: 'unresolved',
  }
}

/** Nome legível para canônicos criados pelo usuário (fora do registry).
 *  Só formatação — nunca inventa marca. */
export function humanizeCanonicalKey(canonicalKey: string): string {
  const known = CANONICAL_BY_KEY.get(canonicalKey)
  if (known) return known.displayName
  if (canonicalKey === UNRESOLVED_CHANNEL_KEY) return UNRESOLVED_CHANNEL_DISPLAY_NAME
  return canonicalKey.split(/[:_.\-\s]+/).filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ') || canonicalKey
}

/** Rótulo do identificador bruto para a UI. Deliberadamente NÃO é chamado
 *  de "marketplace": enquanto não houver mapeamento, é só um identificador
 *  que a VTEX devolveu. */
export function describeVtexIdentifier(type: VtexIdentifierType, value: string): string {
  if (type === 'native_store') return 'Venda direta (sem marketplace)'
  if (type === 'unidentified') return 'Pedido de marketplace sem identificador'
  return type === 'affiliate_id' ? `affiliateId ${value}` : `salesChannel ${value}`
}
