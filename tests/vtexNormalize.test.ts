import { describe, expect, it } from 'vitest'
import { canonicalOrderKey, classifyVtexChannel, flattenVtexCategories, normalizeVtexOrder, normalizeVtexOrderStatus, normalizeVtexSku, priceFromComputedVtexPolicies } from '../src/server/integrations/vtex/normalize'
import { directCanonicalOrderKey, planCanonicalReconciliation } from '../src/server/integrations/orderIdentity'
import { providerDefaultChannel } from '../src/server/analytics/channels'

const baseOrder = {
  orderId: 'VTEX-1', status: 'invoiced', value: 12345, creationDate: '2026-08-01T00:00:00Z', items: [],
}

describe('VTEX normalization', () => {
  it('classifies own store only when no marketplace provenance exists', () => {
    expect(classifyVtexChannel(baseOrder)).toBe('loja_propria')
    expect(classifyVtexChannel({ ...baseOrder, affiliateId: 'MLB', marketplaceOrderId: '200' }, { mercadolivre: ['mlb'] })).toBe('mercadolivre')
    expect(classifyVtexChannel({ ...baseOrder, affiliateId: 'SHP', marketplaceOrderId: '201' }, { shopee: ['shp'] })).toBe('shopee')
    expect(classifyVtexChannel({ ...baseOrder, affiliateId: 'AMZ', marketplaceOrderId: '202' }, { amazon: ['amz'] })).toBe('amazon')
    expect(classifyVtexChannel({ ...baseOrder, affiliateId: 'MGL', marketplaceOrderId: '203' }, { magalu: ['mgl'] })).toBe('magalu')
    // Identificador desconhecido NÃO vira canal próprio: cai no balde único
    // 'external:vtex:unmapped'. Antes, cada sigla nova gerava um canônico
    // 'external:vtex:<slug>-<hash>' — a causa raiz da explosão de canais.
    expect(classifyVtexChannel({ ...baseOrder, affiliateId: 'NEW', marketplaceOrderId: '201' })).toBe('external:vtex:unmapped')
  })

  it('preserves unresolved marketplace revenue without classifying it as own store', () => {
    const unresolved = normalizeVtexOrder({ ...baseOrder, affiliateId: 'NEW', marketplaceOrderId: '201' })
    expect(unresolved.analyticsIncluded).toBe(true)
    expect(unresolved.channelResolutionStatus).toBe('unresolved')
    expect(unresolved.channel).toBe('external:vtex:unmapped')
    expect(unresolved.channel).not.toBe('loja_propria')
    expect(unresolved.canonicalOrderKey).toBe('vtex:VTEX-1')
    expect(unresolved.unavailableReason).toBe('VTEX_CHANNEL_MAPPING_REQUIRED')
    expect(canonicalOrderKey({ ...baseOrder, marketplaceOrderId: '200' }, 'mercadolivre')).toBe('mercadolivre:200')
  })

  it('resolves a channel discovered by salesChannel even when affiliateId is absent', () => {
    const resolved = normalizeVtexOrder({ ...baseOrder, affiliateId: null, salesChannel: '42', marketplaceOrderId: '201' }, { marketplace_xyz: ['sales-channel:42'] })
    expect(resolved.channel).toBe('marketplace_xyz')
    expect(resolved.channelResolutionStatus).toBe('resolved')
    expect(resolved.analyticsIncluded).toBe(true)
  })

  it('accepts a new mapped marketplace without changing the channel model', () => {
    const mapped = normalizeVtexOrder(
      { ...baseOrder, affiliateId: 'XYZ', marketplaceOrderId: 'XYZ-100' },
      { marketplace_xyz: ['xyz'] },
    )
    expect(mapped.channel).toBe('marketplace_xyz')
    expect(mapped.channelResolutionStatus).toBe('resolved')
    expect(mapped.canonicalOrderKey).toBe('marketplace_xyz:XYZ-100')
  })

  it('can reclassify a source order later without inserting a duplicate', () => {
    expect(planCanonicalReconciliation(null, 'source-order-id')).toEqual({
      targetOrderId: 'source-order-id', supersededOrderId: null, shouldInsert: false,
    })
    expect(planCanonicalReconciliation('canonical-id', 'source-order-id')).toEqual({
      targetOrderId: 'canonical-id', supersededOrderId: 'source-order-id', shouldInsert: false,
    })
  })

  it('keeps direct providers first-class and never defaults VTEX to own store', () => {
    expect(providerDefaultChannel('mercadolivre')).toBe('mercadolivre')
    expect(providerDefaultChannel('shopee')).toBe('shopee')
    expect(providerDefaultChannel('amazon')).toBe('amazon')
    expect(providerDefaultChannel('magalu')).toBe('magalu')
    expect(providerDefaultChannel('loja_propria')).toBe('loja_propria')
    expect(providerDefaultChannel('vtex')).toBeNull()
    expect(providerDefaultChannel('future_provider')).toBeNull()
  })

  it('uses the same future Magalu identity for VTEX and a direct connector', () => {
    const vtexKey = canonicalOrderKey({ ...baseOrder, marketplaceOrderId: 'MAGALU-100' }, 'magalu')
    expect(vtexKey).toBe('magalu:MAGALU-100')
    expect(directCanonicalOrderKey('magalu', 'MAGALU-100')).toBe(vtexKey)
  })

  it('normalizes revenue statuses without counting cancellations as paid', () => {
    expect(normalizeVtexOrderStatus('invoiced')).toBe('paid')
    expect(normalizeVtexOrderStatus('canceled')).toBe('cancelled')
  })

  it('never turns a missing VTEX order total into a real zero-value sale', () => {
    const missingTotal = normalizeVtexOrder({ ...baseOrder, value: null })
    const explicitZero = normalizeVtexOrder({ ...baseOrder, value: 0 })

    expect(missingTotal).toMatchObject({ totalAmount: 0, analyticsIncluded: false, unavailableReason: 'VTEX_ORDER_TOTAL_UNAVAILABLE' })
    expect(explicitZero).toMatchObject({ totalAmount: 0, analyticsIncluded: true, unavailableReason: null })
  })

  it('preserves category hierarchy', () => {
    expect(flattenVtexCategories([{ id: 1, name: 'Casa', children: [{ id: 2, name: 'Cozinha' }] }])).toEqual([
      expect.objectContaining({ externalCategoryId: '1', parentExternalId: null, level: 1 }),
      expect.objectContaining({ externalCategoryId: '2', parentExternalId: '1', level: 2 }),
    ])
  })

  it('represents missing or unlimited inventory as N/D, never zero', () => {
    const sku = { Id: 1, ProductId: 10, ProductName: 'Produto' }
    expect(normalizeVtexSku(sku, null, null).inventory.available_quantity).toBeNull()
    expect(normalizeVtexSku(sku, null, { balance: [{ warehouseId: '1', hasUnlimitedQuantity: true }] }).inventory.available_quantity).toBeNull()
    expect(normalizeVtexSku(sku, null, { balance: [{ warehouseId: '1', totalQuantity: 8, reservedQuantity: 3 }] }).inventory.available_quantity).toBe(5)
  })

  it('does not convert a partial VTEX warehouse balance into zero stock', () => {
    const sku = { Id: 1, ProductId: 10, ProductName: 'Produto' }
    const normalized = normalizeVtexSku(sku, null, { balance: [{ warehouseId: '1', totalQuantity: null, reservedQuantity: 3 }] })

    expect(normalized.inventory.available_quantity).toBeNull()
    expect(normalized.product.source_metadata.inventoryAvailable).toBe(false)
    expect(normalized.warehouseRows[0]).toMatchObject({ total_quantity: null, reserved_quantity: 3, available_quantity: null })
  })

  it('prefers the default policy and recovers a deterministic catalog reference from other valid policies', () => {
    expect(priceFromComputedVtexPolicies([
      { tradePolicyId: 'marketplace-a', sellingPrice: 77 },
      { tradePolicyId: '1', sellingPrice: 59.9, listPrice: 69.9, costPrice: 20 },
    ])).toEqual({ basePrice: 59.9, listPrice: 69.9, costPrice: 20 })
    expect(priceFromComputedVtexPolicies([
      { tradePolicyId: 'marketplace-b', sellingPrice: 77 },
      { tradePolicyId: 'marketplace-a', sellingPrice: 59.9 },
    ])).toEqual({ basePrice: 59.9, listPrice: null, costPrice: null })
    expect(priceFromComputedVtexPolicies([{ tradePolicyId: 'marketplace-a', sellingPrice: null }])).toBeNull()
  })
})
