import { describe, expect, it, vi } from 'vitest'
import {
  CANONICAL_CHANNELS,
  UNRESOLVED_CHANNEL_KEY,
  buildVtexExternalKey,
  describeVtexIdentifier,
  findCanonicalChannel,
  normalizeForComparison,
  parseVtexExternalKey,
  resolveVtexChannel,
  channelLogoKey,
} from '../src/server/integrations/vtex/channelResolution'
import { normalizeVtexOrder } from '../src/server/integrations/vtex/normalize'
import { persistVtexChannelResolution, loadVtexChannelMappings, type VtexChannelResolutionCache } from '../src/server/integrations/vtex/channelRegistry'
import {
  VTEX_CHECKPOINT_VERSION,
  buildVtexRunConfig,
  deriveVtexRunState,
  normalizeVtexCheckpoint,
} from '../src/server/integrations/vtex/checkpoint'
import type { VtexOrder } from '../src/server/integrations/vtex/types'

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))

function order(partial: Partial<VtexOrder>): VtexOrder {
  return {
    orderId: 'v-1', marketplaceOrderId: null, affiliateId: null, salesChannel: null,
    status: 'invoiced', value: 10_000, creationDate: '2026-08-01T00:00:00.000Z', items: [],
    ...partial,
  }
}

// ---------------------------------------------------------------------------
// Fake Supabase mínimo: guarda linhas em memória e respeita as chaves únicas
// reais (sales_channels: company+canonical_key; vtex_channel_mappings:
// company+connection+provider+external_key). É o que permite testar dedupe
// de verdade em vez de confiar em mock de chamada.
// ---------------------------------------------------------------------------
function fakeSupabase() {
  const tables: Record<string, Record<string, unknown>[]> = { sales_channels: [], vtex_channel_mappings: [] }
  let nextId = 1
  const keyOf = (table: string, row: Record<string, unknown>) => table === 'sales_channels'
    ? `${row.company_id}::${row.canonical_key}`
    : `${row.company_id}::${row.connection_id}::${row.source_provider}::${row.external_key}`

  function from(table: string) {
    const filters: Array<[string, unknown]> = []
    const api = {
      upsert(payload: Record<string, unknown> | Record<string, unknown>[], options?: { ignoreDuplicates?: boolean }) {
        for (const row of Array.isArray(payload) ? payload : [payload]) {
          const existing = tables[table].find((candidate) => keyOf(table, candidate) === keyOf(table, row))
          if (existing) {
            if (!options?.ignoreDuplicates) Object.assign(existing, row)
          } else {
            tables[table].push({ id: `fake-${nextId++}`, ...row })
          }
        }
        return Promise.resolve({ error: null })
      },
      update(patch: Record<string, unknown>) {
        return {
          eq(column: string, value: unknown) {
            for (const row of tables[table]) {
              if (row[column] === value) Object.assign(row, patch)
            }
            return Promise.resolve({ error: null })
          },
        }
      },
      select() { return api },
      eq(column: string, value: unknown) { filters.push([column, value]); return api },
      order() { return api },
      maybeSingle() {
        const found = tables[table].find((row) => filters.every(([column, value]) => row[column] === value))
        return Promise.resolve({ data: found ?? null, error: null })
      },
      then(resolve: (value: { data: Record<string, unknown>[]; error: null }) => unknown) {
        return Promise.resolve({ data: tables[table].filter((row) => filters.every(([column, value]) => row[column] === value)), error: null }).then(resolve)
      },
    }
    return api
  }
  return { client: { from } as never, tables }
}

async function persist(client: never, cache: VtexChannelResolutionCache | undefined, raw: VtexOrder, mappings = {}) {
  return persistVtexChannelResolution(client, 'company-1', 'conn-1', normalizeVtexOrder(raw, mappings), cache)
}

// ---------------------------------------------------------------------------
// Modelo canônico x identificador bruto
// ---------------------------------------------------------------------------
describe('canonical channel model', () => {
  it('nunca cria canal canônico a partir de identificador desconhecido — cai no balde único', () => {
    const resolution = resolveVtexChannel({ affiliateId: 'MZN', marketplaceOrderId: 'mp-1' })
    expect(resolution.status).toBe('unresolved')
    expect(resolution.canonicalKey).toBe(UNRESOLVED_CHANNEL_KEY)
    expect(resolution.source).toBe('unresolved')
    // A regra que não pode voltar: sigla não vira marketplace por parecer.
    expect(CANONICAL_CHANNELS.some((channel) => channel.key === resolution.canonicalKey)).toBe(false)
  })

  it('siglas diferentes e desconhecidas compartilham o MESMO canal canônico, mas mantêm identificadores distintos', () => {
    const keys = ['MLP', 'MZN', 'KBM', 'CMR', 'LVL'].map((affiliateId) => resolveVtexChannel({ affiliateId, marketplaceOrderId: 'mp' }))
    expect(new Set(keys.map((item) => item.canonicalKey)).size).toBe(1)
    expect(new Set(keys.map((item) => item.externalKey)).size).toBe(5)
  })

  it('affiliateId e salesChannel do mesmo pedido nunca viram dois canais — affiliate tem precedência', () => {
    const resolution = resolveVtexChannel({ affiliateId: 'MLB', salesChannel: '1', marketplaceOrderId: 'mp-9' })
    expect(resolution.identifierType).toBe('affiliate_id')
    expect(resolution.identifierValue).toBe('mlb')
    expect(resolution.rawIdentifiers).toEqual({ affiliateId: 'MLB', salesChannel: '1' })
  })

  it('pedido sem identificador de marketplace é loja própria — fato estrutural, não heurística', () => {
    const resolution = resolveVtexChannel({ affiliateId: null, salesChannel: null, marketplaceOrderId: null })
    expect(resolution.status).toBe('resolved')
    expect(resolution.canonicalKey).toBe('loja_propria')
    expect(resolution.source).toBe('native_store')
  })

  it('mapeamento explícito resolve para o canônico do registry', () => {
    const resolution = resolveVtexChannel({ affiliateId: 'AMZ', marketplaceOrderId: 'mp' }, { amazon: ['amz'] })
    expect(resolution).toMatchObject({ status: 'resolved', canonicalKey: 'amazon', displayName: 'Amazon', source: 'mapping' })
  })

  it('"Amazon" e "amazon" configurados com caixa diferente colapsam no mesmo canônico', () => {
    const a = resolveVtexChannel({ affiliateId: 'AMZ', marketplaceOrderId: 'mp' }, { Amazon: ['AMZ'] })
    const b = resolveVtexChannel({ affiliateId: 'amz', marketplaceOrderId: 'mp' }, { amazon: ['amz'] })
    const c = resolveVtexChannel({ affiliateId: 'Amz', marketplaceOrderId: 'mp' }, { AMAZON: ['aMz'] })
    expect([a.canonicalKey, b.canonicalKey, c.canonicalKey]).toEqual(['amazon', 'amazon', 'amazon'])
  })

  it('normalização de comparação ignora caixa, acento e espaço extra, sem estragar o display name', () => {
    expect(normalizeForComparison('  Loja  Própria ')).toBe('loja propria')
    expect(findCanonicalChannel('MERCADO LIVRE')?.key).toBe('mercadolivre')
    expect(findCanonicalChannel('Magazine Luiza')?.displayName).toBe('Magalu')
    expect(findCanonicalChannel('MZN')).toBeNull()
  })

  it('MZN / mzn / " mzn " produzem a MESMA identidade de identificador — é essa garantia que o índice defensivo da migration 021 (lower(btrim(identifier_value))) reforça no banco', () => {
    const raw = buildVtexExternalKey('affiliate_id', 'MZN')
    const lower = buildVtexExternalKey('affiliate_id', 'mzn')
    const padded = buildVtexExternalKey('affiliate_id', ' mzn ')
    expect(raw).toBe(lower)
    expect(lower).toBe(padded)
    expect(parseVtexExternalKey(raw).value).toBe('mzn')
  })

  it('chave externa é reversível em (tipo, valor) — a UI não precisa parsear string', () => {
    expect(parseVtexExternalKey(buildVtexExternalKey('affiliate_id', 'MLB'))).toEqual({ type: 'affiliate_id', value: 'mlb' })
    expect(parseVtexExternalKey(buildVtexExternalKey('sales_channel', '1'))).toEqual({ type: 'sales_channel', value: '1' })
    expect(parseVtexExternalKey('native-store').type).toBe('native_store')
  })

  it('rótulo do identificador não chama sigla de marketplace', () => {
    expect(describeVtexIdentifier('affiliate_id', 'mzn')).toBe('affiliateId mzn')
    expect(describeVtexIdentifier('affiliate_id', 'mzn').toLowerCase()).not.toContain('marketplace')
  })
})

// ---------------------------------------------------------------------------
// Persistência: dedupe real contra chaves únicas
// ---------------------------------------------------------------------------
describe('channel persistence and dedupe', () => {
  it('mesma Amazon descoberta por 2 identificadores = 1 canônico + 2 mappings', async () => {
    const { client, tables } = fakeSupabase()
    const cache: VtexChannelResolutionCache = new Map()
    const mappings = { amazon: ['amz', 'amazon-br'] }
    await persist(client, cache, order({ orderId: 'a1', affiliateId: 'AMZ', marketplaceOrderId: 'm1' }), mappings)
    await persist(client, cache, order({ orderId: 'a2', affiliateId: 'amazon-br', marketplaceOrderId: 'm2' }), mappings)
    expect(tables.sales_channels.filter((row) => row.canonical_key === 'amazon')).toHaveLength(1)
    expect(tables.vtex_channel_mappings).toHaveLength(2)
    expect(new Set(tables.vtex_channel_mappings.map((row) => row.canonical_channel))).toEqual(new Set(['amazon']))
  })

  it('Amazon já existente não ganha uma segunda representação na descoberta', async () => {
    const { client, tables } = fakeSupabase()
    tables.sales_channels.push({ company_id: 'company-1', canonical_key: 'amazon', display_name: 'Amazon (renomeada pelo usuário)', channel_type: 'marketplace', status: 'active' })
    await persist(client, new Map(), order({ affiliateId: 'AMZ', marketplaceOrderId: 'm1' }), { amazon: ['amz'] })
    expect(tables.sales_channels).toHaveLength(1)
    // Nome escolhido pelo usuário nunca é sobrescrito pela sincronização.
    expect(tables.sales_channels[0].display_name).toBe('Amazon (renomeada pelo usuário)')
  })

  it('mesmo identificador repetido 10.000 vezes gera 1 mapping e 1 escrita (sem spam)', async () => {
    const { client, tables } = fakeSupabase()
    const cache: VtexChannelResolutionCache = new Map()
    let discoveredCount = 0
    for (let index = 0; index < 10_000; index += 1) {
      const result = await persist(client, cache, order({ orderId: `o-${index}`, affiliateId: 'MZN', marketplaceOrderId: `m-${index}` }))
      if (result.discovered) discoveredCount += 1
    }
    expect(tables.vtex_channel_mappings).toHaveLength(1)
    expect(discoveredCount).toBe(1)
    expect(tables.sales_channels).toHaveLength(1)
    expect(tables.sales_channels[0].canonical_key).toBe(UNRESOLVED_CHANNEL_KEY)
  })

  it('dezenas de identificadores desconhecidos NÃO criam dezenas de canais', async () => {
    const { client, tables } = fakeSupabase()
    const cache: VtexChannelResolutionCache = new Map()
    for (const affiliateId of ['MLP', 'MZN', 'MLB', 'KBM', 'CMR', 'LVL', 'MCR', 'CVD', 'CRF', 'LRM', '1']) {
      await persist(client, cache, order({ orderId: `o-${affiliateId}`, affiliateId, marketplaceOrderId: 'mp' }))
    }
    expect(tables.vtex_channel_mappings).toHaveLength(11)
    expect(tables.sales_channels).toHaveLength(1)
  })

  it('identificador desconhecido continua importando o pedido e contando nos totais', () => {
    const normalized = normalizeVtexOrder(order({ affiliateId: 'MZN', marketplaceOrderId: 'mp-1', value: 25_000 }))
    expect(normalized.analyticsIncluded).toBe(true)
    expect(normalized.totalAmount).toBe(250)
    expect(normalized.channelResolutionStatus).toBe('unresolved')
    expect(normalized.unavailableReason).toBe('VTEX_CHANNEL_MAPPING_REQUIRED')
  })

  it('mapping corrigido manualmente reclassifica o pedido sem mudar a chave canônica de dedupe', () => {
    const raw = order({ orderId: 'v-77', affiliateId: 'MZN', marketplaceOrderId: 'mp-77' })
    const before = normalizeVtexOrder(raw)
    const after = normalizeVtexOrder(raw, { amazon: ['mzn'] })
    expect(before.channel).toBe(UNRESOLVED_CHANNEL_KEY)
    expect(after.channel).toBe('amazon')
    expect(after.externalChannelKey).toBe(before.externalChannelKey)
    // Idempotência de pedido: reclassificar não pode criar um segundo pedido.
    expect(before.canonicalOrderKey).toBe('vtex:v-77')
    expect(after.canonicalOrderKey).toBe('amazon:mp-77')
    expect(before.externalOrderId).toBe(after.externalOrderId)
  })

  it('mapeamentos salvos no banco voltam colapsados por canônico, sem duplicar grafias', async () => {
    const { client, tables } = fakeSupabase()
    tables.vtex_channel_mappings.push(
      { company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex', external_key: 'affiliate:amz', affiliate_id: 'AMZ', canonical_channel: 'Amazon', resolution_status: 'resolved' },
      { company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex', external_key: 'affiliate:amazon-br', affiliate_id: 'amazon-br', canonical_channel: 'amazon', resolution_status: 'resolved' },
    )
    const merged = await loadVtexChannelMappings(client, 'company-1', 'conn-1', { AMAZON: ['AMZ'] })
    expect(Object.keys(merged)).toEqual(['amazon'])
    expect(merged.amazon).toEqual(expect.arrayContaining(['amz', 'amazon-br']))
  })

  it('mapping legado unresolved com canonical_channel fabricado (produção real: 13 canais external:vtex:<sigla>-<hash> criados pelo sync antigo) NUNCA é reaproveitado como verdade — só resolution_status=resolved constitui mapping confiável', async () => {
    const { client, tables } = fakeSupabase()
    // Reproduz exatamente a linha real de produção: o resolvedor antigo
    // fabricava canonical_channel = `external:vtex:mzn-<hash>` e marcava
    // resolution_status: 'unresolved' (nunca 'resolved') — ver normalize.ts
    // no commit 3861ec2. Essa linha continua existindo após deploy/migration
    // 021 porque não fazemos nenhum UPDATE/DELETE nela.
    tables.vtex_channel_mappings.push({
      company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex',
      external_key: 'affiliate:mzn', affiliate_id: 'MZN',
      canonical_channel: 'external:vtex:mzn-legacy', resolution_status: 'unresolved',
    })

    const merged = await loadVtexChannelMappings(client, 'company-1', 'conn-1', {})
    // loadVtexChannelMappings filtra `.eq('resolution_status', 'resolved')` —
    // a linha unresolved acima nunca entra no objeto de mappings.
    expect(merged).toEqual({})

    const cache: VtexChannelResolutionCache = new Map()
    const result = await persist(client, cache, order({ orderId: 'novo-1', affiliateId: 'MZN', marketplaceOrderId: 'mp-novo' }), merged)
    const normalized = normalizeVtexOrder(order({ affiliateId: 'MZN', marketplaceOrderId: 'mp-novo' }), merged)

    expect(normalized.channel).toBe(UNRESOLVED_CHANNEL_KEY) // nunca 'external:vtex:mzn-legacy'
    expect(normalized.channelResolutionStatus).toBe('unresolved')
    expect(normalized.analyticsIncluded).toBe(true) // pedido continua importando
    expect(result.resolved).toBe(false)
    // Nenhum canonical novo criado além do balde único.
    expect(tables.sales_channels.map((row) => row.canonical_key)).toEqual([UNRESOLVED_CHANNEL_KEY])
  })

  it('mapping resolvido explicitamente para amazon continua retornando amazon (contraste com o caso legado acima)', async () => {
    const { client, tables } = fakeSupabase()
    tables.vtex_channel_mappings.push({
      company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex',
      external_key: 'affiliate:mzn', affiliate_id: 'MZN',
      canonical_channel: 'amazon', resolution_status: 'resolved',
    })
    const merged = await loadVtexChannelMappings(client, 'company-1', 'conn-1', {})
    expect(merged.amazon).toEqual(expect.arrayContaining(['mzn']))
    const normalized = normalizeVtexOrder(order({ affiliateId: 'MZN', marketplaceOrderId: 'mp-2' }), merged)
    expect(normalized.channel).toBe('amazon')
    expect(normalized.channelResolutionStatus).toBe('resolved')
  })

  // -------------------------------------------------------------------------
  // Colisão do UNIQUE normalizado (021) com o upsert por external_key: uma
  // linha legada com case/whitespace diferente do que o código sempre grava
  // (buildVtexExternalKey já normaliza) não pode virar uma SEGUNDA linha
  // física — isso violaria vtex_channel_mappings_identifier_uidx assim que
  // a 021 estiver aplicada. persistVtexChannelResolution precisa achar essa
  // linha pela identidade normalizada (identifier_type/identifier_value, já
  // preenchidos pelo backfill da 021 mesmo em linha suja) e ATUALIZAR em vez
  // de inserir.
  // -------------------------------------------------------------------------
  it('CASO A — external_key legado com case diferente (affiliate:MZN) + pedido novo (produz affiliate:mzn): permanece 1 mapping só, sem violação de unique, canonical efetivo = unmapped', async () => {
    const { client, tables } = fakeSupabase()
    // Simula dado sujo pós-021: external_key gravado com case diferente do
    // que o código atual (sempre lowercase) produziria, mas o backfill da
    // migration já normalizou identifier_type/identifier_value para essa
    // linha — é exatamente o estado em que o banco fica logo após aplicar a
    // 021 sobre uma linha legada.
    tables.vtex_channel_mappings.push({
      id: 'legacy-row-1', company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex',
      external_key: 'affiliate:MZN', affiliate_id: 'MZN',
      identifier_type: 'affiliate_id', identifier_value: 'mzn',
      canonical_channel: 'external:vtex:mzn-legacy', resolution_status: 'unresolved',
    })

    const cache: VtexChannelResolutionCache = new Map()
    const result = await persist(client, cache, order({ orderId: 'novo-a', affiliateId: 'MZN', marketplaceOrderId: 'mp-a' }))

    expect(tables.vtex_channel_mappings).toHaveLength(1) // nenhuma segunda linha criada
    expect(tables.vtex_channel_mappings[0].id).toBe('legacy-row-1') // a MESMA linha foi atualizada, não substituída
    expect(tables.vtex_channel_mappings[0].external_key).toBe('affiliate:mzn') // autocurado para a forma normalizada
    expect(tables.vtex_channel_mappings[0].canonical_channel).toBe(UNRESOLVED_CHANNEL_KEY) // efetivo, não o legado fabricado
    expect(result.discovered).toBe(false) // já existia, não é descoberta nova
    expect(tables.sales_channels.map((row) => row.canonical_key)).toEqual([UNRESOLVED_CHANNEL_KEY])
  })

  it('CASO B — external_key legado com whitespace (" affiliate: MZN " gravado sujo, backfill normaliza identifier_value) + pedido novo: 1 identidade normalizada, sem duplicação', async () => {
    const { client, tables } = fakeSupabase()
    tables.vtex_channel_mappings.push({
      id: 'legacy-row-2', company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex',
      external_key: 'affiliate: MZN ', affiliate_id: ' MZN ',
      identifier_type: 'affiliate_id', identifier_value: 'mzn', // já normalizado pelo backfill lower(btrim(...))
      canonical_channel: 'external:vtex:mzn-legacy', resolution_status: 'unresolved',
    })

    await persist(client, new Map(), order({ orderId: 'novo-b', affiliateId: 'MZN', marketplaceOrderId: 'mp-b' }))

    expect(tables.vtex_channel_mappings).toHaveLength(1)
    expect(tables.vtex_channel_mappings[0].id).toBe('legacy-row-2')
    expect(tables.vtex_channel_mappings[0].identifier_value).toBe('mzn')
  })

  it('mapping legado unresolved (MZN) não impede um SEGUNDO identificador diferente (MLB) de virar sua própria linha — o fallback normalizado não funde identidades diferentes', async () => {
    const { client, tables } = fakeSupabase()
    tables.vtex_channel_mappings.push({
      id: 'legacy-row-3', company_id: 'company-1', connection_id: 'conn-1', source_provider: 'vtex',
      external_key: 'affiliate:MZN', identifier_type: 'affiliate_id', identifier_value: 'mzn',
      canonical_channel: 'external:vtex:mzn-legacy', resolution_status: 'unresolved',
    })
    await persist(client, new Map(), order({ orderId: 'novo-c', affiliateId: 'MLB', marketplaceOrderId: 'mp-c' }))
    expect(tables.vtex_channel_mappings).toHaveLength(2)
    expect(new Set(tables.vtex_channel_mappings.map((row) => row.identifier_value))).toEqual(new Set(['mzn', 'mlb']))
  })
})

// ---------------------------------------------------------------------------
// Checkpoint versionado e normalização
// ---------------------------------------------------------------------------
describe('checkpoint versioning and normalization', () => {
  const config = buildVtexRunConfig(3, 'full')

  it('checkpoint sem versão é migrado e recebe snapshot de config', () => {
    const result = normalizeVtexCheckpoint({ orderPage: 3 }, config)
    expect(result.normalized).toBe(true)
    expect(result.reasons).toContain('missing_version')
    expect(result.checkpoint.version).toBe(VTEX_CHECKPOINT_VERSION)
    expect(result.checkpoint.runConfig).toMatchObject({ historyMonths: 3, syncMode: 'full' })
    expect(result.checkpoint.orderPage).toBe(3)
  })

  it('checkpoint já na versão atual e coerente não é reescrito', () => {
    const now = new Date('2026-08-18T00:00:00.000Z')
    const good = normalizeVtexCheckpoint({
      version: VTEX_CHECKPOINT_VERSION,
      runConfig: { historyMonths: 3, windowMs: 7 * 24 * 3600_000, syncMode: 'full', checkpointVersion: VTEX_CHECKPOINT_VERSION },
      orderHistoryStart: '2026-05-20T00:00:00.000Z',
      orderWindowStart: '2026-06-01T00:00:00.000Z',
      orderWindowEnd: '2026-06-08T00:00:00.000Z',
      orderTargetEnd: '2026-08-18T00:00:00.000Z',
      orderPage: 2,
      catalogStatus: 'completed',
    }, config, now)
    expect(good.normalized).toBe(false)
    expect(good.checkpoint.orderWindowStart).toBe('2026-06-01T00:00:00.000Z')
    expect(good.checkpoint.orderPage).toBe(2)
  })

  it('o caso real de produção: historyStart depois da janela varrida é normalizado, não explode', () => {
    const now = new Date('2026-08-18T00:00:00.000Z')
    const result = normalizeVtexCheckpoint({
      // Campos da regra antiga (bootstrap de 12 meses)...
      orderWindowStart: '2025-08-01T00:00:00.000Z',
      orderWindowEnd: '2025-08-08T00:00:00.000Z',
      orderTargetEnd: '2026-08-18T00:00:00.000Z',
      // ...misturados com o campo calculado pela regra nova de 3 meses.
      orderHistoryStart: '2026-05-20T00:00:00.000Z',
      orderPage: 4,
    }, config, now)
    expect(result.normalized).toBe(true)
    expect(result.reasons).toContain('impossible_order_window')
    const historyStart = Date.parse(result.checkpoint.orderHistoryStart!)
    const windowStart = Date.parse(result.checkpoint.orderWindowStart!)
    const windowEnd = Date.parse(result.checkpoint.orderWindowEnd!)
    const targetEnd = Date.parse(result.checkpoint.orderTargetEnd!)
    expect(historyStart).toBeLessThanOrEqual(windowStart)
    expect(windowStart).toBeLessThan(windowEnd)
    expect(windowEnd).toBeLessThanOrEqual(targetEnd)
    expect(result.checkpoint.orderPage).toBe(1)
    // Janela recalculada respeita os 3 meses da run, não os 12 antigos.
    expect(Math.round((targetEnd - historyStart) / (24 * 3600_000))).toBe(90)
  })

  it('bootstrap 12 -> 3 meses não mistura regras: o snapshot da run manda', () => {
    const legacyRun = normalizeVtexCheckpoint(
      { version: VTEX_CHECKPOINT_VERSION, runConfig: { historyMonths: 12, windowMs: 7 * 24 * 3600_000, syncMode: 'full', checkpointVersion: VTEX_CHECKPOINT_VERSION } },
      buildVtexRunConfig(3, 'full'),
    )
    expect(legacyRun.config.historyMonths).toBe(12)
    const newRun = normalizeVtexCheckpoint({}, buildVtexRunConfig(3, 'full'))
    expect(newRun.config.historyMonths).toBe(3)
  })

  it('ponteiros impossíveis (orderPage < 1, offset negativo) são corrigidos', () => {
    const result = normalizeVtexCheckpoint({ version: VTEX_CHECKPOINT_VERSION, runConfig: config, orderPage: 0, skuOffset: -10 }, config)
    expect(result.checkpoint.orderPage).toBe(1)
    expect(result.checkpoint.skuOffset).toBe(0)
    expect(result.reasons).toEqual(expect.arrayContaining(['order_page_out_of_range', 'sku_offset_out_of_range']))
  })

  it('normalizar checkpoint nunca toca em contadores ou pedidos já persistidos', () => {
    const result = normalizeVtexCheckpoint({ orderWindowStart: 'lixo', skuTotal: 4321, skuOffset: 1200, staleRecoveries: 2 }, config)
    expect(result.checkpoint.skuTotal).toBe(4321)
    expect(result.checkpoint.skuOffset).toBe(1200)
    expect(result.checkpoint.staleRecoveries).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Estado único da run exposto no status
// ---------------------------------------------------------------------------
describe('derived run state (nunca dois badges conflitantes)', () => {
  const staleAfterMs = 5 * 60 * 1000
  const now = Date.parse('2026-08-18T12:00:00.000Z')

  it('queued pós-yield é sincronização normal, nunca alerta', () => {
    expect(deriveVtexRunState({ status: 'queued', stage: 'orders', startedAt: '2026-08-18T11:00:00.000Z', staleAfterMs, now })).toBe('yielded_queued')
  })

  it('queued sem nada iniciado é fila', () => {
    expect(deriveVtexRunState({ status: 'queued', stage: 'validate', staleAfterMs, now })).toBe('queued')
  })

  it('running com heartbeat fresco é running', () => {
    expect(deriveVtexRunState({ status: 'running', stage: 'orders', lastHeartbeatAt: '2026-08-18T11:59:00.000Z', staleAfterMs, now })).toBe('running')
  })

  it('running sem heartbeat vira requires_attention — e só ele', () => {
    expect(deriveVtexRunState({ status: 'running', stage: 'orders', lastHeartbeatAt: '2026-08-18T11:00:00.000Z', staleAfterMs, now })).toBe('requires_attention')
  })

  it('estados terminais são únicos e coerentes', () => {
    expect(deriveVtexRunState({ status: 'success', staleAfterMs, now })).toBe('completed')
    expect(deriveVtexRunState({ status: 'partial', staleAfterMs, now })).toBe('partial')
    expect(deriveVtexRunState({ status: 'failed', staleAfterMs, now })).toBe('failed_recoverable')
  })
})

// ---------------------------------------------------------------------------
// Branding: logo por chave canônica, nunca por nome
// ---------------------------------------------------------------------------
const channelLogoKeyPresent = (key: string | null) => channelLogoKey(key) !== null

describe('logo resolution by canonical key', () => {
  it('canônicos conhecidos têm logo; não identificado e canal custom usam ícone neutro', () => {
    for (const key of ['mercadolivre', 'amazon', 'shopee', 'magalu', 'loja_propria']) {
      expect(channelLogoKeyPresent(key)).toBe(true)
    }
    expect(channelLogoKeyPresent(UNRESOLVED_CHANNEL_KEY)).toBe(false)
    expect(channelLogoKeyPresent('canal-criado-pelo-usuario')).toBe(false)
    // Nome não resolve marca — só a chave canônica resolve.
    expect(channelLogoKeyPresent('Amazon')).toBe(false)
    expect(channelLogoKeyPresent(null)).toBe(false)
  })

  it('toda chave do registry tem logoKey igual à chave — nada resolve por display name', () => {
    for (const channel of CANONICAL_CHANNELS) expect(channel.logoKey).toBe(channel.key)
  })
})
