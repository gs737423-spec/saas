import { describe, expect, it, vi } from 'vitest'
import { VtexClient } from '../src/server/integrations/vtex/client'
import { discoverVtexSkuIdsByPagination } from '../src/server/integrations/vtex/sync'

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))

const credentials = { accountName: 'climario', appKey: 'k', appToken: 't' }

// ---------------------------------------------------------------------------
// Causa raiz real de produção (confirmada no admin da VTEX: 18.006 produtos
// ativos): tanto a descoberta global (`stockkeepingunitids`) quanto o
// fallback por sales channel devolveram `[]` pra essa conta — não porque o
// catálogo está vazio, mas porque esses dois endpoints não são confiáveis
// pra catálogos grandes. `GetProductAndSkuIds` (paginado por índice) é o
// terceiro nível de fallback, só tentado depois que os outros dois vieram
// vazios.
// ---------------------------------------------------------------------------
function makeClient(handler: (from: number, to: number) => Response) {
  const fetchImpl = vi.fn(async (url: string | URL) => {
    const match = String(url).match(/_from=(\d+)&_to=(\d+)/)
    if (!match) throw new Error(`unexpected request: ${url}`)
    return handler(Number(match[1]), Number(match[2]))
  })
  return new VtexClient(credentials, { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: vi.fn(async () => undefined) })
}

describe('discoverVtexSkuIdsByPagination (terceiro fallback — catálogos grandes)', () => {
  it('pagina até range.total, deduplicando SKUs entre productId->[skuIds] de páginas diferentes', async () => {
    const client = makeClient((from) => {
      if (from === 0) {
        return new Response(JSON.stringify({
          data: { p1: [100, 101], p2: [102] },
          range: { total: 3, from: 0, to: 49 },
        }), { status: 200 })
      }
      // range.total=3 (índice de produtos, não de SKU) — só 1 página necessária
      throw new Error(`unexpected extra page at from=${from}`)
    })

    const result = await discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 0, Date.now() + 60_000)

    expect(result.done).toBe(true)
    expect(new Set(result.skuIds)).toEqual(new Set([100, 101, 102]))
  })

  it('percorre múltiplas páginas reais (range.total maior que 1 página) sem perder nem duplicar SKU', async () => {
    const pageOf = (from: number) => {
      if (from === 0) return { data: { p1: [1, 2] }, range: { total: 120, from: 0, to: 49 } }
      if (from === 50) return { data: { p2: [3, 4] }, range: { total: 120, from: 50, to: 99 } }
      if (from === 100) return { data: { p3: [5] }, range: { total: 120, from: 100, to: 120 } }
      throw new Error(`unexpected page at from=${from}`)
    }
    const client = makeClient((from) => new Response(JSON.stringify(pageOf(from)), { status: 200 }))

    const result = await discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 0, Date.now() + 60_000)

    expect(result.done).toBe(true)
    expect(new Set(result.skuIds)).toEqual(new Set([1, 2, 3, 4, 5]))
  })

  it('range.total ausente/zero na primeira página é aceito como catálogo vazio de verdade por essa via — não fica em loop', async () => {
    const client = makeClient(() => new Response(JSON.stringify({ data: {}, range: { total: 0, from: 0, to: 0 } }), { status: 200 }))

    const result = await discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 0, Date.now() + 60_000)

    expect(result.done).toBe(true)
    expect(result.skuIds).toEqual([])
  })

  it('estourar o orçamento de tempo no meio da paginação devolve done:false com nextFrom exato para resumir depois — nunca reinicia do zero', async () => {
    let calls = 0
    const client = makeClient((from) => {
      calls += 1
      return new Response(JSON.stringify({ data: { [`p${from}`]: [from] }, range: { total: 100_000, from, to: from + 49 } }), { status: 200 })
    })
    // Deadline já vencido depois da primeira página — força yield.
    let firstCallDeadline = 0
    const result = await discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 0, Date.now() + 5)
    void firstCallDeadline

    expect(result.done).toBe(false)
    expect(result.nextFrom).toBeGreaterThan(0)
    expect(calls).toBeGreaterThan(0)
    expect(calls).toBeLessThan(100) // não varreu o catálogo inteiro, parou no orçamento
  })

  it('resume exatamente do nextFrom persistido — não repete páginas já buscadas', async () => {
    const requestedFroms: number[] = []
    const client = makeClient((from) => {
      requestedFroms.push(from)
      return new Response(JSON.stringify({ data: { [`p${from}`]: [from] }, range: { total: 55, from, to: from + 49 } }), { status: 200 })
    })

    const result = await discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 50, Date.now() + 60_000)

    expect(requestedFroms).toEqual([50]) // nunca pediu from=0 de novo, e 100 > total=55 encerra em 1 página
    expect(result.skuIds).toEqual([50])
    expect(result.done).toBe(true)
  })

  it('the run checkpoint accumulates yielded pages before promoting the final SKU list', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')

    expect(source).toContain('...(checkpoint.catalogPaginationSkuIds ?? [])')
    expect(source).toContain('checkpoint.catalogPaginationSkuIds = accumulatedPaginationSkuIds')
    expect(source).toContain('skuIds = accumulatedPaginationSkuIds')
  })

  it('persists the frozen order target as watermark instead of completion time', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')

    expect(source).toContain("last_success_at: checkpoint.orderTargetEnd ?? completedAt")
  })

  it('erro transitório no meio da paginação para no offset atual (não avança, não derruba a run) — resume no próximo tick', async () => {
    const client = makeClient(() => new Response('{}', { status: 500 }))

    const result = await discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 0, Date.now() + 60_000)

    expect(result.done).toBe(false)
    expect(result.nextFrom).toBe(0) // não avançou — vai tentar de novo do mesmo lugar
  })

  it.each([401, 403])('propaga HTTP %s em vez de devolver done:false e enfileirar para sempre', async (status) => {
    const client = makeClient(() => new Response(null, { status }))

    await expect(discoverVtexSkuIdsByPagination(client, 'company-1', 'conn-1', 0, Date.now() + 60_000))
      .rejects.toMatchObject({ status })
  })
})
