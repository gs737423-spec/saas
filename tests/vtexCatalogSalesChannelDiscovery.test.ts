import { describe, expect, it, vi } from 'vitest'
import { VtexClient } from '../src/server/integrations/vtex/client'
import { discoverVtexSkuIdsBySalesChannel } from '../src/server/integrations/vtex/sync'

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))

const credentials = { accountName: 'climario', appKey: 'k', appToken: 't' }

// ---------------------------------------------------------------------------
// Causa raiz real de produção: `GET stockkeepingunitids` (descoberta global)
// respondeu 200 com `[]` genuíno mesmo com ~10 mil pedidos reais já
// importados — a conta modela o catálogo só por sales channel. Esse fallback
// nunca hardcoda um sales channel (ex. "1"): descobre os canais reais da
// conta via `getSalesChannels` e busca SKUs em cada um.
// ---------------------------------------------------------------------------
describe('discoverVtexSkuIdsBySalesChannel (fallback quando a descoberta global vem vazia)', () => {
  it('descobre e deduplica SKUs de múltiplos sales channels reais da conta — nunca um channel hardcoded', async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      const path = String(url)
      if (path.includes('/saleschannel/list')) {
        return new Response(JSON.stringify([{ Id: 1, Name: 'Loja padrão', IsActive: true }, { Id: 7, Name: 'Marketplace X', IsActive: true }]), { status: 200 })
      }
      if (path.includes('/stockkeepingunitidsbysaleschannel/1')) return new Response(JSON.stringify([100, 200]), { status: 200 })
      if (path.includes('/stockkeepingunitidsbysaleschannel/7')) return new Response(JSON.stringify([200, 300]), { status: 200 }) // 200 repetido — precisa dedupe
      throw new Error(`unexpected request: ${path}`)
    })
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch })

    const skuIds = await discoverVtexSkuIdsBySalesChannel(client, 'company-1', 'conn-1')

    expect(new Set(skuIds)).toEqual(new Set([100, 200, 300])) // deduplicado
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining('/saleschannel/list'), expect.anything())
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining('/stockkeepingunitidsbysaleschannel/1'), expect.anything())
    expect(fetchImpl).toHaveBeenCalledWith(expect.stringContaining('/stockkeepingunitidsbysaleschannel/7'), expect.anything())
  })

  it('ignora sales channels inativos (IsActive=false) sem consultá-los', async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      const path = String(url)
      if (path.includes('/saleschannel/list')) {
        return new Response(JSON.stringify([{ Id: 1, IsActive: true }, { Id: 9, IsActive: false }]), { status: 200 })
      }
      if (path.includes('/stockkeepingunitidsbysaleschannel/1')) return new Response(JSON.stringify([42]), { status: 200 })
      throw new Error(`unexpected request: ${path}`)
    })
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch })

    const skuIds = await discoverVtexSkuIdsBySalesChannel(client, 'company-1', 'conn-1')

    expect(skuIds).toEqual([42])
    expect(fetchImpl).not.toHaveBeenCalledWith(expect.stringContaining('/stockkeepingunitidsbysaleschannel/9'), expect.anything())
  })

  it('um sales channel com erro não derruba a descoberta dos demais', async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      const path = String(url)
      if (path.includes('/saleschannel/list')) return new Response(JSON.stringify([{ Id: 1 }, { Id: 2 }]), { status: 200 })
      if (path.includes('/stockkeepingunitidsbysaleschannel/1')) return new Response('{}', { status: 500 })
      if (path.includes('/stockkeepingunitidsbysaleschannel/2')) return new Response(JSON.stringify([55]), { status: 200 })
      throw new Error(`unexpected request: ${path}`)
    })
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: vi.fn(async () => undefined) })

    const skuIds = await discoverVtexSkuIdsBySalesChannel(client, 'company-1', 'conn-1')

    expect(skuIds).toEqual([55]) // canal 1 falhou, canal 2 continuou
  })

  it('nenhum sales channel ativo -> retorna vazio sem inventar dado', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify([]), { status: 200 }))
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch })

    const skuIds = await discoverVtexSkuIdsBySalesChannel(client, 'company-1', 'conn-1')

    expect(skuIds).toEqual([])
  })

  it('getSalesChannels falhando não lança — degrada pra vazio, chamador decide se é catálogo vazio', async () => {
    const fetchImpl = vi.fn(async () => new Response('{}', { status: 500 }))
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: vi.fn(async () => undefined) })

    const skuIds = await discoverVtexSkuIdsBySalesChannel(client, 'company-1', 'conn-1')

    expect(skuIds).toEqual([])
  })
})
