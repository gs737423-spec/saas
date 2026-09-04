import { describe, expect, it } from 'vitest'
import {
  UNMAPPED_ANALYTICS_CHANNEL,
  loadTrustedAnalyticsChannels,
  resolveEffectiveAnalyticsChannel,
  salesChannelDisplayName,
} from '../src/server/analytics/channels'

// ---------------------------------------------------------------------------
// Fake Supabase mínimo só pra `vtex_channel_mappings` — o suficiente pra
// exercitar `loadTrustedAnalyticsChannels` sem banco real.
// ---------------------------------------------------------------------------
function fakeSupabase(mappingRows: Array<{ company_id: string; canonical_channel: string; resolution_status: string }>) {
  return {
    from(table: string) {
      if (table !== 'vtex_channel_mappings') throw new Error(`unexpected table ${table}`)
      const filters: Array<[string, unknown]> = []
      const api = {
        select() { return api },
        eq(column: string, value: unknown) { filters.push([column, value]); return api },
        then(resolve: (value: { data: typeof mappingRows; error: null }) => unknown) {
          return Promise.resolve({ data: mappingRows.filter((row) => filters.every(([c, v]) => (row as Record<string, unknown>)[c] === v)), error: null }).then(resolve)
        },
      }
      return api
    },
  } as never
}

describe('effective analytics channel (canais VTEX legados unresolved nunca viram marketplace real em analytics)', () => {
  it('caso 1 — MZN, MLB e MLP legados unresolved resolvem pro MESMO canal efetivo', async () => {
    const trusted = await loadTrustedAnalyticsChannels(fakeSupabase([]), 'company-1')
    const results = ['external:vtex:mzn-legacy', 'external:vtex:mlb-legacy', 'external:vtex:mlp-legacy']
      .map((stored) => resolveEffectiveAnalyticsChannel(stored, trusted).effectiveChannel)
    expect(new Set(results)).toEqual(new Set([UNMAPPED_ANALYTICS_CHANNEL]))
  })

  it('caso 2 — receitas de MZN/MLB/MLP se somam sob "Canal não identificado", não três linhas', async () => {
    const trusted = await loadTrustedAnalyticsChannels(fakeSupabase([]), 'company-1')
    const orders = [
      { stored: 'external:vtex:mzn-legacy', amount: 100 },
      { stored: 'external:vtex:mlb-legacy', amount: 200 },
      { stored: 'external:vtex:mlp-legacy', amount: 300 },
    ]
    const byEffective = new Map<string, number>()
    for (const o of orders) {
      const { effectiveChannel } = resolveEffectiveAnalyticsChannel(o.stored, trusted)
      byEffective.set(effectiveChannel, (byEffective.get(effectiveChannel) ?? 0) + o.amount)
    }
    expect(byEffective.size).toBe(1)
    expect(byEffective.get(UNMAPPED_ANALYTICS_CHANNEL)).toBe(600)
  })

  it('caso 3 — amazon (confiável) e MZN legado (não confiável) ficam em grupos DIFERENTES', async () => {
    const trusted = await loadTrustedAnalyticsChannels(fakeSupabase([]), 'company-1')
    const amazon = resolveEffectiveAnalyticsChannel('amazon', trusted, 'Amazon')
    const mzn = resolveEffectiveAnalyticsChannel('external:vtex:mzn-legacy', trusted)
    expect(amazon.effectiveChannel).toBe('amazon')
    expect(amazon.displayName).toBe('Amazon')
    expect(mzn.effectiveChannel).toBe(UNMAPPED_ANALYTICS_CHANNEL)
    expect(mzn.displayName).toBe('Canal não identificado')
  })

  it('caso 4 — canal customizado legítimo (com mapping resolved apontando pra ele) permanece próprio, não vira unmapped', async () => {
    const trusted = await loadTrustedAnalyticsChannels(
      fakeSupabase([{ company_id: 'company-1', canonical_channel: 'minha_marca_propria', resolution_status: 'resolved' }]),
      'company-1',
    )
    const result = resolveEffectiveAnalyticsChannel('minha_marca_propria', trusted, 'Minha Marca Própria')
    expect(result.effectiveChannel).toBe('minha_marca_propria')
    expect(result.displayName).toBe('Minha Marca Própria')
  })

  it('caso 4b — canal com mapping ainda unresolved (não confirmado por fonte confiável) NÃO é tratado como próprio', async () => {
    const trusted = await loadTrustedAnalyticsChannels(
      fakeSupabase([{ company_id: 'company-1', canonical_channel: 'external:vtex:mzn-legacy', resolution_status: 'unresolved' }]),
      'company-1',
    )
    const result = resolveEffectiveAnalyticsChannel('external:vtex:mzn-legacy', trusted)
    expect(result.effectiveChannel).toBe(UNMAPPED_ANALYTICS_CHANNEL)
  })

  it('caso 5 — external:vtex:unmapped continua normalmente como "Canal não identificado", sem regressão', async () => {
    const trusted = await loadTrustedAnalyticsChannels(fakeSupabase([]), 'company-1')
    const result = resolveEffectiveAnalyticsChannel(UNMAPPED_ANALYTICS_CHANNEL, trusted)
    expect(result.effectiveChannel).toBe(UNMAPPED_ANALYTICS_CHANNEL)
    expect(result.displayName).toBe('Canal não identificado')
  })

  it('caso 6 — 13 canonical_key legados distintos não geram 13 categorias de analytics, só 1', async () => {
    const trusted = await loadTrustedAnalyticsChannels(fakeSupabase([]), 'company-1')
    const legacyKeys = ['mlb', 'nvp', 'mzn', 'mlz', 'mlp', 'lrm', '1', 'cmr', 'kbm', 'lvl', 'mcr', 'cvd', 'crf']
      .map((slug) => `external:vtex:${slug}-legacy`)
    const effectiveKeys = new Set(legacyKeys.map((key) => resolveEffectiveAnalyticsChannel(key, trusted).effectiveChannel))
    expect(effectiveKeys.size).toBe(1)
    expect(effectiveKeys.has(UNMAPPED_ANALYTICS_CHANNEL)).toBe(true)
  })

  it('caso 7 — quem precisa do valor bruto pra auditoria ainda acessa storedChannel mesmo quando degradado', async () => {
    const trusted = await loadTrustedAnalyticsChannels(fakeSupabase([]), 'company-1')
    const result = resolveEffectiveAnalyticsChannel('external:vtex:mzn-legacy', trusted)
    expect(result.storedChannel).toBe('external:vtex:mzn-legacy') // preservado, nunca escondido
    expect(result.effectiveChannel).toBe(UNMAPPED_ANALYTICS_CHANNEL) // mas não é o que agrega/exibe
  })

  it('tenant isolation — mapping resolved de outra empresa não torna um canal confiável aqui', async () => {
    const trusted = await loadTrustedAnalyticsChannels(
      fakeSupabase([{ company_id: 'company-OUTRA', canonical_channel: 'external:vtex:mzn-legacy', resolution_status: 'resolved' }]),
      'company-1',
    )
    const result = resolveEffectiveAnalyticsChannel('external:vtex:mzn-legacy', trusted)
    expect(result.effectiveChannel).toBe(UNMAPPED_ANALYTICS_CHANNEL)
  })

  it('salesChannelDisplayName sem registeredName não usa mais heurística de prefixo external:vtex:', () => {
    // A degradação de canal legado agora acontece em resolveEffectiveAnalyticsChannel,
    // não mais aqui — salesChannelDisplayName só formata o que já foi decidido.
    expect(salesChannelDisplayName('external:vtex:mzn-legacy')).not.toBe('Outros canais')
  })
})
