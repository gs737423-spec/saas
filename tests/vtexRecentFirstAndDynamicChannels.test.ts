import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'
import { buildVtexRunConfig, normalizeVtexCheckpoint, VTEX_CHECKPOINT_VERSION } from '../src/server/integrations/vtex/checkpoint'
import { canonicalKeyFromTrustedName } from '../src/server/integrations/vtex/channelResolution'
import { autoResolveVtexSalesChannelsFromRegistry, reclassifyVtexOrdersForIdentifier } from '../src/server/integrations/vtex/channelRegistry'
import { computeVtexSyncProgress } from '../src/server/integrations/vtex/progress'
import { nextVtexStageAfterCatalog, nextVtexStageAfterCategories, nextVtexStageAfterOrders, vtexOrderQueryMode, vtexOrderResumePage } from '../src/server/integrations/vtex/sync'

describe('VTEX recent-first bootstrap', () => {
  it('migra run v2 em andamento para a janela mais recente sem perder o piso ainda pendente', () => {
    const result = normalizeVtexCheckpoint({
      version: 2,
      runConfig: { historyMonths: 3, windowMs: 7 * 86_400_000, syncMode: 'full', checkpointVersion: 2 },
      orderHistoryStart: '2026-05-20T00:00:00.000Z',
      orderWindowStart: '2026-05-28T00:00:00.000Z',
      orderWindowEnd: '2026-05-29T00:00:00.000Z',
      orderTargetEnd: '2026-08-18T00:00:00.000Z',
      orderPage: 17,
      catalogStatus: 'completed',
      catalogDiscoveryVersion: 6,
    }, buildVtexRunConfig(3, 'full'))

    expect(result.checkpoint.version).toBe(VTEX_CHECKPOINT_VERSION)
    expect(result.checkpoint.orderTraversal).toBe('recent_first')
    expect(result.checkpoint.orderBackfillFloor).toBe('2026-05-28T00:00:00.000Z')
    expect(result.checkpoint.orderWindowEnd).toBe('2026-08-18T00:00:00.000Z')
    expect(result.checkpoint.orderWindowStart).toBe('2026-08-11T00:00:00.000Z')
    expect(result.checkpoint.orderPage).toBe(1)
  })

  it('progresso recent-first mede janelas recentes concluídas, sem fake progress', () => {
    const progress = computeVtexSyncProgress('orders', {
      orderTraversal: 'recent_first',
      orderBackfillFloor: '2026-05-20T00:00:00.000Z',
      orderHistoryStart: '2026-05-20T00:00:00.000Z',
      orderWindowStart: '2026-08-04T00:00:00.000Z',
      orderWindowEnd: '2026-08-11T00:00:00.000Z',
      orderTargetEnd: '2026-08-18T00:00:00.000Z',
    }, { ordersFetched: 500 })
    expect(progress.basis).toBe('time_window')
    expect(progress.percent).toBe(8)
    expect(progress.processed).toBe(500)
  })

  it('reduz janelas congestionadas até o limite OMS e recupera overflow incremental em full', async () => {
    const source = await readFile(new URL('../src/server/integrations/vtex/sync.ts', import.meta.url), 'utf8')
    expect(source).toMatch(/ORDER_WINDOW_SHRUNK[\s\S]{0,700}continue/)
    expect(source).toMatch(/const nextEnd = windowStart[\s\S]{0,300}Math\.max\(backfillFloor/)
    expect(source).toMatch(/if \(ranOutOfTime\) \{[\s\S]{0,500}checkpoint\.orderPage = run\.mode === 'full' \? page : 1/)
    expect(source).toContain('const MAX_VTEX_OMS_ORDER_PAGES = 30')
    expect(source).toContain("if (run.mode === 'incremental') throw new Error('VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT')")
    expect(source).toContain('const MIN_ORDER_WINDOW_MS = 1_000')
    expect(source).toContain("code: 'ORDER_WINDOW_CLAMPED'")
    expect(source).toContain('const nextWindowMs = Math.max(MIN_ORDER_WINDOW_MS, Math.ceil(currentWindowMs / 2))')
    expect(source).not.toContain('windowEnd.getTime() - Math.floor((windowEnd.getTime() - windowStart.getTime()) / 2)')
    expect(source).toContain('const initialPage = vtexOrderResumePage(run.mode, checkpoint.orderPage)')
    expect(source).toContain('checkpoint.orderPage = page')
    expect(source).toContain('if (page === initialPage) totalPages = sourceTotalPages')
    expect(source).not.toMatch(/listOrders\([\s\S]{0,150}page=2/)
  })

  it('retoma página somente na carga full, cujo creationDate é imutável', () => {
    expect(vtexOrderResumePage('full', 21)).toBe(21)
    expect(vtexOrderResumePage('full', 0)).toBe(1)
    expect(vtexOrderResumePage('incremental', 21)).toBe(1)
  })

  it('incremental usa lastChange no filtro e na ordenação', () => {
    expect(vtexOrderQueryMode('incremental')).toEqual({ filterName: 'f_lastChange', filterField: 'lastChange', orderBy: 'lastChange,asc' })
    expect(vtexOrderQueryMode('full')).toEqual({ filterName: 'f_creationDate', filterField: 'creationDate', orderBy: 'creationDate,asc' })
  })

  it('prioriza pedidos somente no incremental e não cria ciclo após o catálogo', () => {
    expect(nextVtexStageAfterCategories('incremental')).toBe('orders')
    expect(nextVtexStageAfterOrders('incremental')).toBe('catalog')
    expect(nextVtexStageAfterCatalog({ ordersCompleted: true })).toBe('finalize')
    expect(nextVtexStageAfterCategories('full')).toBe('catalog')
    expect(nextVtexStageAfterOrders('full')).toBe('finalize')
    expect(nextVtexStageAfterCatalog({ ordersCompleted: false })).toBe('orders')
  })

  it('falha de preço ou estoque não sobrescreve valor real anterior com null', async () => {
    const source = await readFile(new URL('../src/server/integrations/vtex/sync.ts', import.meta.url), 'utf8')
    expect(source).toContain('let priceRequestFailed = priceResult.status === \'rejected\'')
    expect(source).toContain('if (priceRequestFailed) delete productPayload.price')
    expect(source).toContain('client.getComputedPrices(skuId)')
    expect(source).toMatch(/inventoryResult\.status === 'rejected'\) delete productPayload\.available_quantity/)
    expect(source).toMatch(/if \(inventoryResult\.status === 'fulfilled'\) \{[\s\S]{0,500}marketplace_inventory/)
  })
})

describe('canais reais e marketplace dinâmico', () => {
  it('executa resolução de canais antes do catálogo, sem depender do estágio orders', async () => {
    const source = await readFile(new URL('../src/server/integrations/vtex/sync.ts', import.meta.url), 'utf8')
    const registryGate = source.indexOf('CHANNEL_REGISTRIES_CHECKED')
    const catalogStage = source.indexOf("if (run.stage === 'catalog')")
    const ordersStage = source.indexOf("if (run.stage === 'orders')")
    expect(registryGate).toBeGreaterThan(-1)
    expect(registryGate).toBeLessThan(catalogStage)
    expect(catalogStage).toBeLessThan(ordersStage)
  })
  it('nome confiável da VTEX gera canonical_key válida sem espaço', () => {
    expect(canonicalKeyFromTrustedName('  Käbum Marketplace  ')).toBe('kabum-marketplace')
    expect(canonicalKeyFromTrustedName('Canal / B2B')).toBe('canal-b2b')
  })

  it('nenhuma camada de analytics fabrica marketplace, inclusive em lista vazia', async () => {
    const [source, financeApi, summaryApi, productsApi, inventoryApi] = await Promise.all([
      readFile(new URL('../src/data/financeShapes.ts', import.meta.url), 'utf8'),
      readFile(new URL('../api/dashboard/finance.ts', import.meta.url), 'utf8'),
      readFile(new URL('../api/dashboard/summary.ts', import.meta.url), 'utf8'),
      readFile(new URL('../api/dashboard/products.ts', import.meta.url), 'utf8'),
      readFile(new URL('../api/dashboard/inventory.ts', import.meta.url), 'utf8'),
    ])
    expect(source).toMatch(/fillAllMarketplaces[\s\S]{0,150}return rows/)
    expect(source).not.toContain('ALL_MARKETPLACES')
    expect(financeApi).toMatch(/!orders \|\| orders\.length === 0[\s\S]{0,180}source: 'real'/)
    expect(summaryApi).toMatch(/!orders \|\| orders\.length === 0[\s\S]{0,220}source: 'real'/)
    expect(productsApi).toMatch(/!products \|\| products\.length === 0[\s\S]{0,150}source: 'real'/)
    expect(inventoryApi).toMatch(/!inventoryRows \|\| inventoryRows\.length === 0[\s\S]{0,250}source: 'real'/)
  })

  it('filtro financeiro recebe opções dinâmicas dos dados reais', async () => {
    const [page, header] = await Promise.all([
      readFile(new URL('../src/pages/Financeiro.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/financeiro/FinanceHeader.tsx', import.meta.url), 'utf8'),
    ])
    expect(page).toContain('real?.byMarketplace')
    expect(page).toContain('/api/dashboard/finance-transactions?')
    expect(page).toContain('marketplaceFilter !== \'all\'')
    expect(page).toMatch(/marketplaceOptions=\{marketplaceOptions\}/)
    expect(header).toMatch(/options\.map\(\(option\)/)
    expect(header).not.toMatch(/const marketplaces:/)
  })

  it('salesChannel observado usa o nome real da VTEX e não um código inventado', async () => {
    const updates: Array<Record<string, unknown>> = []
    const supabase = {
      from(table: string) {
        if (table === 'sales_channels') return { upsert: async () => ({ error: null }) }
        if (table === 'order_source_refs') return { select() { return this }, eq() { return this }, neq() { return this }, is() { return this }, limit: async () => ({ data: [], error: null }) }
        if (table === 'orders') return { update() { return { eq() { return this }, in: async () => ({ error: null }) } } }
        const builder = {
          select() { return this }, eq() { return this }, neq() { return this },
          then(resolve: (value: unknown) => void) { resolve({ data: [{ id: 'mapping-1', identifier_value: '1', resolution_source: 'unresolved' }], error: null }) },
          update(payload: Record<string, unknown>) {
            updates.push(payload)
            const chain = { eq() { return chain }, neq() { return chain }, async select() { return { data: [{ id: 'mapping-1' }], error: null } } }
            return chain
          },
        }
        return builder
      },
    }
    const client = { getSalesChannels: async () => [{ Id: 1, Name: 'Loja Clima Rio', IsActive: true }] }
    const result = await autoResolveVtexSalesChannelsFromRegistry(client as never, supabase as never, 'company-1', 'conn-1')
    expect(result).toEqual({ resolved: 1, checked: 1, completed: true })
    expect(updates[0]).toMatchObject({ canonical_channel: 'loja-clima-rio', resolution_status: 'resolved', external_marketplace_name: 'Loja Clima Rio' })
  })

  it('reclassifica pedidos locais em lote sem alterar conteúdo do pedido', async () => {
    const orderUpdates: Array<Record<string, unknown>> = []
    let refsRead = 0
    const supabase = {
      from(table: string) {
        if (table === 'order_source_refs') {
          return {
            select() { return this }, eq() { return this }, neq() { return this },
            async limit() { refsRead += 1; return { data: refsRead === 1 ? [{ id: 'ref-1', order_id: 'order-1' }] : [], error: null } },
            update(payload: Record<string, unknown>) { return { eq() { return this }, in: async () => ({ error: null, payload }) } },
          }
        }
        return { update(payload: Record<string, unknown>) { orderUpdates.push(payload); return { eq() { return this }, in: async () => ({ error: null }) } } }
      },
    }
    const updated = await reclassifyVtexOrdersForIdentifier(supabase as never, 'company-1', 'conn-1', 'affiliate_id', 'MZN', 'amazon')
    expect(updated).toEqual({ updated: 1, completed: true })
    expect(orderUpdates).toEqual([{ sales_channel: 'amazon', channel_resolution_status: 'resolved', unavailable_reason: null }])
  })

  it('mapping de salesChannel não reclassifica pedido que possui affiliate prioritário', async () => {
    let affiliateNullFilterApplied = false
    const supabase = {
      from(table: string) {
        if (table === 'order_source_refs') return {
          select() { return this }, eq() { return this }, neq() { return this },
          is(column: string, value: unknown) { affiliateNullFilterApplied = column === 'affiliate_id' && value === null; return this },
          async limit() { return { data: [], error: null } },
        }
        throw new Error(`unexpected table ${table}`)
      },
    }
    const updated = await reclassifyVtexOrdersForIdentifier(supabase as never, 'company-1', 'conn-1', 'sales_channel', '1', 'loja_propria')
    expect(updated).toEqual({ updated: 0, completed: true })
    expect(affiliateNullFilterApplied).toBe(true)
  })
})

describe('semântica de preço real', () => {
  it('não converte preço ausente em zero na API e na UI de estoque', async () => {
    const [productsApi, inventoryUi, dashboardType, client] = await Promise.all([
      readFile(new URL('../api/dashboard/products.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/estoque/RealInventoryTable.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/server/dashboardProducts.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/server/integrations/vtex/client.ts', import.meta.url), 'utf8'),
    ])
    expect(productsApi).toContain('price: productPrice')
    expect(productsApi).not.toContain('price: Number(p.price ?? 0)')
    expect(inventoryUi).toMatch(/item\.availableQuantity === null \|\| item\.price === null \? 'N\/D'/)
    expect(dashboardType).toContain('price: number | null')
    expect(client).not.toContain('commitFeed(')
    expect(client).not.toMatch(/method:\s*['"](?:POST|PUT|PATCH|DELETE)['"]/)
  })
})
