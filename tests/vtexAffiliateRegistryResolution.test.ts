import { describe, expect, it, vi } from 'vitest'
import { VtexClient } from '../src/server/integrations/vtex/client'
import { autoResolveVtexAffiliatesFromRegistry } from '../src/server/integrations/vtex/channelRegistry'

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))

const credentials = { accountName: 'climario', appKey: 'k', appToken: 't' }

// ---------------------------------------------------------------------------
// Causa raiz real: a tela "Canais encontrados na VTEX" exigia o cliente
// mapear manualmente cada affiliateId (MLB, MZN, MLP, ...) pra um marketplace
// -- risco de atribuição financeira errada se resolvido por heurística sobre
// a sigla (`channelResolution.ts` proíbe isso explicitamente). A VTEX expõe o
// NOME real que o vendedor cadastrou pra cada affiliate; usamos ESSE nome
// (dado de origem VTEX, não suposição) pra resolver -- bate com um canônico
// já conhecido (Mercado Livre/Amazon/Shopee/Magalu) quando possível, e cria
// um canônico NOVO a partir do nome real quando não bate com nenhum -- nunca
// fica pendente esperando clique manual, e nunca chuta a partir da sigla.
// ---------------------------------------------------------------------------
function makeFakeSupabase(existingRows: Record<string, { id: string; resolution_source: string } | null> = {}) {
  const upserts: Array<Record<string, unknown>> = []
  const salesChannelUpserts: Array<Record<string, unknown>> = []
  const updates: Array<{ id: string; payload: Record<string, unknown> }> = []
  const supabase = {
    from(table: string) {
      expect(['vtex_channel_mappings', 'sales_channels', 'order_source_refs', 'orders']).toContain(table)
      if (table === 'order_source_refs') {
        return { select() { return this }, eq() { return this }, neq() { return this }, limit: async () => ({ data: [], error: null }) }
      }
      if (table === 'orders') return { update() { return { eq() { return this }, in: async () => ({ error: null }) } } }
      if (table === 'sales_channels') {
        return {
          async upsert(payload: Record<string, unknown>) {
            salesChannelUpserts.push(payload)
            return { error: null }
          },
        }
      }
      const builder = {
        select() {
          return this
        },
        eq(_column: string, _value: unknown) {
          return this
        },
        async maybeSingle() {
          return { data: null, error: null }
        },
        update(payload: Record<string, unknown>) {
          const chain = {
            eq(_column: string, id: string) { updates.push({ id, payload }); return chain },
            neq() { return chain },
            async select() { return { data: [{ id: 'row-new' }], error: null } },
          }
          return chain
        },
        upsert(payload: Record<string, unknown>) {
          upserts.push(payload)
          return { async select() { return { data: [{ id: 'row-new' }], error: null } } }
        },
        then(resolve: (value: unknown) => void) {
          resolve({ data: [
            { identifier_value: 'MLB' }, { identifier_value: 'XYZ' },
            { identifier_value: 'AMZ' },
          ], error: null })
        },
      }
      return builder
    },
  }
  void existingRows
  return { supabase, upserts, updates, salesChannelUpserts }
}

function makeClient(handler: () => Response) {
  const fetchImpl = vi.fn(async () => handler())
  return new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch })
}

describe('autoResolveVtexAffiliatesFromRegistry (resolução automática por nome real da VTEX)', () => {
  it('casa affiliateId com canal canônico usando o nome real devolvido pela VTEX', async () => {
    const client = makeClient(() => new Response(JSON.stringify([
      { affiliateId: 'MLB', name: 'Mercado Livre' },
      { affiliateId: 'XYZ', name: 'Kabum Marketplace' },
    ]), { status: 200 }))
    const { supabase, upserts, salesChannelUpserts } = makeFakeSupabase()

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result.checked).toBe(2)
    // MLB bate com canônico conhecido; XYZ não bate com nenhum dos 5, mas
    // ainda resolve -- cria um canal NOVO a partir do nome real "Kabum
    // Marketplace" (nunca da sigla XYZ, nunca fica pendente à toa).
    expect(result).toMatchObject({ resolved: 2, checked: 2, completed: true })
    expect(upserts).toHaveLength(2)
    expect(upserts.find((row) => row.affiliate_id === 'MLB')).toMatchObject({ canonical_channel: 'mercadolivre', resolution_source: 'vtex_affiliate_registry', resolution_status: 'resolved' })
    expect(upserts.find((row) => row.affiliate_id === 'XYZ')).toMatchObject({ canonical_channel: 'kabum-marketplace', external_marketplace_name: 'Kabum Marketplace', resolution_source: 'vtex_affiliate_registry' })
    expect(salesChannelUpserts).toContainEqual(expect.objectContaining({ canonical_key: 'kabum-marketplace', display_name: 'Kabum Marketplace' }))
  })

  it('casa nome real de texto livre da VTEX por substring, não só igualdade exata', async () => {
    const client = makeClient(() => new Response(JSON.stringify([
      { affiliateId: 'MLB', name: 'Mercado Livre - Loja Oficial' },
      { affiliateId: 'AMZ', name: 'AmazonBRFulfillment' },
    ]), { status: 200 }))
    const { supabase, upserts } = makeFakeSupabase()

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result).toEqual({ resolved: 2, checked: 2, completed: true })
    expect(upserts.map((row) => row.canonical_channel).sort()).toEqual(['amazon', 'mercadolivre'])
  })

  it('endpoint indisponível (conta sem essa API habilitada) não derruba a run — devolve zero', async () => {
    const client = makeClient(() => new Response('{}', { status: 404 }))
    const { supabase, upserts } = makeFakeSupabase()

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result).toEqual({ resolved: 0, checked: 0, completed: false })
    expect(upserts).toHaveLength(0)
  })

  it('nunca sobrescreve uma linha já resolvida manualmente pelo usuário (resolution_source=mapping)', async () => {
    const client = makeClient(() => new Response(JSON.stringify([{ affiliateId: 'MLB', name: 'Mercado Livre' }]), { status: 200 }))
    const { supabase, upserts, updates } = makeFakeSupabase()
    supabase.from = (table: string) => {
      expect(table).toBe('vtex_channel_mappings')
      return {
        select() { return this },
        eq() { return this },
        then(resolve: (value: unknown) => void) { resolve({ data: [{ identifier_value: 'MLB' }], error: null }) },
        async maybeSingle() { return { data: { id: 'row-1', resolution_source: 'mapping' }, error: null } },
        update() { throw new Error('não deveria atualizar linha mapeada manualmente') },
        async upsert() { throw new Error('não deveria inserir sobre linha mapeada manualmente') },
      } as never
    }

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result).toEqual({ resolved: 0, checked: 1, completed: true })
    expect(upserts).toHaveLength(0)
    expect(updates).toHaveLength(0)
  })
})
