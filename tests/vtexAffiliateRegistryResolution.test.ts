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
// (dado de origem VTEX, não suposição) pra casar com um canal canônico já
// conhecido -- só quando bate de verdade, nunca um "parece que é".
// ---------------------------------------------------------------------------
function makeFakeSupabase(existingRows: Record<string, { id: string; resolution_source: string } | null> = {}) {
  const upserts: Array<Record<string, unknown>> = []
  const updates: Array<{ id: string; payload: Record<string, unknown> }> = []
  const supabase = {
    from(table: string) {
      expect(table).toBe('vtex_channel_mappings')
      return {
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
          return {
            eq: async (_column: string, id: string) => {
              updates.push({ id, payload })
              return { error: null }
            },
          }
        },
        async upsert(payload: Record<string, unknown>) {
          upserts.push(payload)
          return { error: null }
        },
      }
    },
  }
  void existingRows
  return { supabase, upserts, updates }
}

function makeClient(handler: () => Response) {
  const fetchImpl = vi.fn(async () => handler())
  return new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch })
}

describe('autoResolveVtexAffiliatesFromRegistry (resolução automática por nome real da VTEX)', () => {
  it('casa affiliateId com canal canônico usando o nome real devolvido pela VTEX', async () => {
    const client = makeClient(() => new Response(JSON.stringify([
      { affiliateId: 'MLB', name: 'Mercado Livre' },
      { affiliateId: 'XYZ', name: 'Sigla sem marketplace conhecido' },
    ]), { status: 200 }))
    const { supabase, upserts } = makeFakeSupabase()

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result.checked).toBe(2)
    expect(result.resolved).toBe(1) // só MLB bateu com um canônico conhecido — XYZ fica unresolved, nunca chuta
    expect(upserts).toHaveLength(1)
    expect(upserts[0]).toMatchObject({ canonical_channel: 'mercadolivre', resolution_source: 'vtex_affiliate_registry', resolution_status: 'resolved' })
  })

  it('casa nome real de texto livre da VTEX por substring, não só igualdade exata', async () => {
    const client = makeClient(() => new Response(JSON.stringify([
      { affiliateId: 'MLB', name: 'Mercado Livre - Loja Oficial' },
      { affiliateId: 'AMZ', name: 'AmazonBRFulfillment' },
    ]), { status: 200 }))
    const { supabase, upserts } = makeFakeSupabase()

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result).toEqual({ resolved: 2, checked: 2 })
    expect(upserts.map((row) => row.canonical_channel).sort()).toEqual(['amazon', 'mercadolivre'])
  })

  it('endpoint indisponível (conta sem essa API habilitada) não derruba a run — devolve zero', async () => {
    const client = makeClient(() => new Response('{}', { status: 404 }))
    const { supabase, upserts } = makeFakeSupabase()

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result).toEqual({ resolved: 0, checked: 0 })
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
        async maybeSingle() { return { data: { id: 'row-1', resolution_source: 'mapping' }, error: null } },
        update() { throw new Error('não deveria atualizar linha mapeada manualmente') },
        async upsert() { throw new Error('não deveria inserir sobre linha mapeada manualmente') },
      } as never
    }

    const result = await autoResolveVtexAffiliatesFromRegistry(client, supabase as never, 'company-1', 'conn-1')

    expect(result).toEqual({ resolved: 0, checked: 1 })
    expect(upserts).toHaveLength(0)
    expect(updates).toHaveLength(0)
  })
})
