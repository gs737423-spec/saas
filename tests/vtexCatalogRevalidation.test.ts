import { describe, expect, it } from 'vitest'
import { buildVtexRunConfig, normalizeVtexCheckpoint, vtexCatalogNeedsRevalidation } from '../src/server/integrations/vtex/checkpoint'
import { VtexClient } from '../src/server/integrations/vtex/client'
import { VtexApiError } from '../src/server/integrations/vtex/errors'
import type { VtexSyncCheckpoint } from '../src/server/integrations/vtex/types'

const fallback = buildVtexRunConfig(3, 'full')

// -----------------------------------------------------------------------
// Teste A — evidência real de produção: um checkpoint sem `catalogStatus`
// (todo checkpoint legado, incluindo a run real com stage='orders',
// skuTotal=NULL e zero produtos) NUNCA pode ser normalizado como
// 'completed' — só 'unknown'. É essa distinção que prova (ou não) que o
// bloco `catalog` já rodou de verdade nesta run.
// -----------------------------------------------------------------------
describe('Teste A — checkpoint legado de produção nunca vira catalogStatus completed', () => {
  it('a run real de produção (stage=orders, sem catalogStatus, skuTotal ausente) normaliza para unknown', () => {
    // Reprodução do checkpoint real observado via query read-only:
    // run 5f2eb860-23dd-44a3-8d7c-b37fc1d9797d, stage='orders',
    // checkpoint_version=2, sku_offset=0, sku_total=NULL, order_page=1.
    const productionCheckpoint: VtexSyncCheckpoint = {
      version: 2,
      runConfig: { historyMonths: 3, windowMs: 7 * 24 * 60 * 60 * 1000, syncMode: 'full', checkpointVersion: 2 },
      skuOffset: 0,
      orderPage: 1,
    }
    const result = normalizeVtexCheckpoint(productionCheckpoint, fallback)
    expect(result.checkpoint.catalogStatus).toBe('unknown')
    expect(result.checkpoint.catalogStatus).not.toBe('completed')
    expect(result.normalized).toBe(true)
    expect(result.reasons).toContain('missing_catalog_status')
  })

  it('a bare undefined/null checkpoint also normalizes catalogStatus to unknown, never completed', () => {
    expect(normalizeVtexCheckpoint(undefined, fallback).checkpoint.catalogStatus).toBe('unknown')
    expect(normalizeVtexCheckpoint(null, fallback).checkpoint.catalogStatus).toBe('unknown')
    expect(normalizeVtexCheckpoint({}, fallback).checkpoint.catalogStatus).toBe('unknown')
  })

  it('an invalid/garbage catalogStatus value is also coerced to unknown, not trusted as-is', () => {
    const result = normalizeVtexCheckpoint({ catalogStatus: 'bogus' } as unknown as VtexSyncCheckpoint, fallback)
    expect(result.checkpoint.catalogStatus).toBe('unknown')
    expect(result.reasons).toContain('invalid_catalog_status')
  })
})

// -----------------------------------------------------------------------
// Teste B — a normalização de catalogStatus é ADITIVA: nunca toca nos
// campos de checkpoint de pedidos já válidos (historyStart/windowStart/
// windowEnd/targetEnd/orderPage ficam exatamente como estavam).
// -----------------------------------------------------------------------
describe('Teste B — normalização de catálogo preserva o checkpoint de pedidos intocado', () => {
  it('order window fields that are already internally consistent are untouched by catalogStatus normalization', () => {
    const historyStart = '2026-05-19T00:00:00.000Z'
    const windowStart = '2026-08-11T00:00:00.000Z'
    const windowEnd = '2026-08-18T00:00:00.000Z'
    const targetEnd = '2026-08-18T12:00:00.000Z'
    const checkpoint: VtexSyncCheckpoint = {
      version: 2,
      runConfig: { historyMonths: 3, windowMs: 7 * 24 * 60 * 60 * 1000, syncMode: 'full', checkpointVersion: 2 },
      orderHistoryStart: historyStart,
      orderWindowStart: windowStart,
      orderWindowEnd: windowEnd,
      orderTargetEnd: targetEnd,
      orderPage: 4,
      // sem catalogStatus — vai ganhar 'unknown', mas isso não deve
      // recalcular NADA dos campos de pedido acima.
    }
    const result = normalizeVtexCheckpoint(checkpoint, fallback, new Date('2026-08-18T12:00:00.000Z'))
    expect(result.checkpoint.orderHistoryStart).toBe(historyStart)
    expect(result.checkpoint.orderWindowStart).toBe(windowStart)
    expect(result.checkpoint.orderWindowEnd).toBe(windowEnd)
    expect(result.checkpoint.orderTargetEnd).toBe(targetEnd)
    expect(result.checkpoint.orderPage).toBe(4)
    expect(result.checkpoint.catalogStatus).toBe('unknown')
  })
})

// -----------------------------------------------------------------------
// Teste F — o gate de revalidação (`vtexCatalogNeedsRevalidation`) só
// dispara para 'unknown'/ausente; uma vez terminal (completed/empty/
// blocked) ou em andamento (partial/validating), nunca reentra de novo.
// -----------------------------------------------------------------------
describe('Teste F — catálogo já validado nunca reentra (gate de reentrada única)', () => {
  it('needs revalidation when catalogStatus is unknown or missing', () => {
    expect(vtexCatalogNeedsRevalidation(undefined)).toBe(true)
    expect(vtexCatalogNeedsRevalidation({})).toBe(true)
    expect(vtexCatalogNeedsRevalidation({ catalogStatus: 'unknown' })).toBe(true)
  })

  it('never re-enters once catalogStatus reached a terminal or in-progress state', () => {
    expect(vtexCatalogNeedsRevalidation({ catalogStatus: 'completed' })).toBe(false)
    expect(vtexCatalogNeedsRevalidation({ catalogStatus: 'empty' })).toBe(false)
    expect(vtexCatalogNeedsRevalidation({ catalogStatus: 'blocked' })).toBe(false)
    expect(vtexCatalogNeedsRevalidation({ catalogStatus: 'partial' })).toBe(false)
    expect(vtexCatalogNeedsRevalidation({ catalogStatus: 'validating' })).toBe(false)
  })
})

// -----------------------------------------------------------------------
// Teste D — 401/403 no endpoint de SKU ids são erros estruturados
// (VtexApiError), nunca coagidos para "catálogo vazio" (skuTotal=0).
// -----------------------------------------------------------------------
describe('Teste D — getSkuIds() 401/403 lança VtexApiError, nunca array vazio silencioso', () => {
  it('401 throws VtexApiError with status 401, not an empty array', async () => {
    const fetchImpl = (async () => new Response(null, { status: 401 })) as unknown as typeof fetch
    const client = new VtexClient({ accountName: 'acme', appKey: 'k', appToken: 't' }, { fetchImpl })
    await expect(client.getSkuIds()).rejects.toMatchObject({ status: 401, code: 'VTEX_INVALID_CREDENTIALS' })
  })

  it('403 throws VtexApiError with status 403, not an empty array', async () => {
    const fetchImpl = (async () => new Response(null, { status: 403 })) as unknown as typeof fetch
    const client = new VtexClient({ accountName: 'acme', appKey: 'k', appToken: 't' }, { fetchImpl })
    await expect(client.getSkuIds()).rejects.toMatchObject({ status: 403, code: 'VTEX_PERMISSION_REQUIRED' })
    await expect(client.getSkuIds()).rejects.toBeInstanceOf(VtexApiError)
  })
})

// -----------------------------------------------------------------------
// Teste E — um payload 200 OK mas não-array nunca deve ser tratado como
// catálogo vazio silenciosamente; sync.ts precisa validar Array.isArray
// explicitamente antes de aceitar o resultado.
// -----------------------------------------------------------------------
describe('Teste E — payload malformado (200 OK, não-array) não é coagido a catálogo vazio', () => {
  it('getSkuIds() itself does not validate shape (documents the gap client.ts leaves to the caller)', async () => {
    const fetchImpl = (async () => new Response(JSON.stringify({ notAnArray: true }), { status: 200, headers: { 'content-type': 'application/json' } })) as unknown as typeof fetch
    const client = new VtexClient({ accountName: 'acme', appKey: 'k', appToken: 't' }, { fetchImpl })
    const result = await client.getSkuIds()
    // O client em si não valida o schema — é sync.ts que precisa (e agora
    // faz) checar Array.isArray antes de aceitar o resultado como lista de
    // SKU ids. Este teste documenta esse contrato explicitamente.
    expect(Array.isArray(result)).toBe(false)
  })

  it('sync.ts source guards getSkuIds() with an explicit Array.isArray check before treating it as a SKU list', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')
    expect(source).toMatch(/Array\.isArray\(rawSkuIds\)/)
    expect(source).toMatch(/VTEX_CATALOG_PAYLOAD_INVALID/)
  })
})

// -----------------------------------------------------------------------
// Teste H — uma vez catalogStatus='completed'/'empty'/'blocked', o gate de
// revalidação usado por sync.ts (via stage-based reentry) nunca deveria
// reentrar — verificado tanto pelo gate isolado (Teste F) quanto por uma
// checagem estática de que sync.ts consulta o gate antes de forçar
// stage='catalog'.
// -----------------------------------------------------------------------
describe('Teste H — sync.ts usa catalogStatus (não stage) para decidir reentrada', () => {
  it('processVtexSyncRun consults vtexCatalogNeedsRevalidation before forcing a return to the catalog stage', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')
    expect(source).toMatch(/vtexCatalogNeedsRevalidation\(checkpoint\)/)
    // A reentrada nunca deve resetar campos de pedido — greps garantindo que
    // o bloco do gate não contém nenhuma atribuição a orderWindowStart/End,
    // orderTargetEnd, orderHistoryStart ou reset de orderPage para 1.
    const gateBlockMatch = source.match(/GATE DE REVALIDAÇÃO DE CATÁLOGO[\s\S]*?\n\s*\}\n\n\s*if \(run\.stage === 'validate'\)/)
    expect(gateBlockMatch).not.toBeNull()
    const gateBlock = gateBlockMatch![0]
    expect(gateBlock).not.toMatch(/orderWindowStart\s*=/)
    expect(gateBlock).not.toMatch(/orderWindowEnd\s*=/)
    expect(gateBlock).not.toMatch(/orderTargetEnd\s*=/)
    expect(gateBlock).not.toMatch(/orderHistoryStart\s*=/)
    expect(gateBlock).not.toMatch(/orderPage\s*=\s*1/)
  })
})
