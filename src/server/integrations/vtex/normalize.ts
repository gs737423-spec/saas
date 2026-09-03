import type { VtexAnalyticChannel, VtexCategoryNode, VtexChannelMappings, VtexChannelResolution, VtexComputedPrice, VtexInventoryResponse, VtexNormalizedOrder, VtexOrder, VtexPrice, VtexSkuContext } from './types.js'
import { resolveVtexChannel as resolveCanonicalVtexChannel, resolveVtexChannelIdentity } from './channelResolution.js'

const PAID_STATUSES = new Set([
  'payment-approved', 'window-to-cancel', 'ready-for-handling', 'start-handling',
  'handling', 'invoice', 'invoiced', 'order-completed', 'waiting-ffmt-authorization',
  'authorize-fulfillment', 'release-to-fulfillment',
])
const CANCELLED_STATUSES = new Set(['canceled', 'cancelled', 'cancel', 'cancelation-request'])

export function normalizeVtexOrderStatus(status: string): string {
  const normalized = status.trim().toLowerCase()
  if (CANCELLED_STATUSES.has(normalized)) return 'cancelled'
  if (PAID_STATUSES.has(normalized)) return 'paid'
  return normalized || 'unknown'
}

/**
 * A VTEX pode não ter `basePrice` e ainda assim devolver preços calculados
 * válidos em tabelas/políticas comerciais. Preferimos a política padrão 1,
 * mas não descartamos o catálogo inteiro quando a conta só expõe outra
 * política. O fallback é determinístico: menor preço calculado válido.
 *
 * O campo interno é uma referência de catálogo, não uma promessa de preço
 * contextual ao comprador. Preço zero nunca é fabricado: só entra valor
 * finito retornado pela VTEX.
 */
export function priceFromComputedVtexPolicies(prices: VtexComputedPrice[]): VtexPrice | null {
  const valid = prices.filter((price) => price.sellingPrice != null && Number.isFinite(Number(price.sellingPrice)) && Number(price.sellingPrice) >= 0)
  if (valid.length === 0) return null
  const defaultPrice = valid.find((price) => String(price.tradePolicyId ?? '') === '1' || String(price.priceTable ?? '') === '1')
    ?? [...valid].sort((a, b) => Number(a.sellingPrice) - Number(b.sellingPrice) || String(a.tradePolicyId ?? a.priceTable ?? '').localeCompare(String(b.tradePolicyId ?? b.priceTable ?? '')))[0]
  return {
    basePrice: Number(defaultPrice.sellingPrice),
    listPrice: defaultPrice.listPrice != null && Number.isFinite(Number(defaultPrice.listPrice)) ? Number(defaultPrice.listPrice) : null,
    costPrice: defaultPrice.costPrice != null && Number.isFinite(Number(defaultPrice.costPrice)) ? Number(defaultPrice.costPrice) : null,
  }
}

/** Identidade externa do pedido — delega para o resolvedor central
 *  (channelResolution.ts). Continua exportada porque já é usada por nome;
 *  o que mudou foi a implementação deixar de ser local e duplicada. */
export function vtexExternalChannelIdentity(order: Pick<VtexOrder, 'affiliateId' | 'marketplaceOrderId' | 'salesChannel' | 'origin'>): { externalKey: string; rawIdentity: string | null } {
  const identity = resolveVtexChannelIdentity(order)
  const rawIdentity = identity.type === 'affiliate_id'
    ? identity.raw.affiliateId
    : identity.type === 'sales_channel' ? identity.raw.salesChannel : null
  return { externalKey: identity.externalKey, rawIdentity }
}

/** ANTES: cada identificador bruto desconhecido virava um canal canônico
 *  novo (`external:vtex:<slug>-<hash>`). Como `orders.sales_channel` tem FK
 *  para `sales_channels`, isso obrigava a criar uma linha de "marketplace"
 *  por sigla — a explosão de dezenas/centenas de canais vista em produção,
 *  e também a origem da segunda "Amazon" (o canônico `amazon` já existia,
 *  e um affiliate cujo texto lembrava Amazon gerava um canônico paralelo).
 *
 *  AGORA: identificador desconhecido cai no ÚNICO balde
 *  `external:vtex:unmapped` ("Canal não identificado"), e o identificador
 *  bruto vive em `vtex_channel_mappings`, que é onde ele pertence. Nenhum
 *  canal canônico é criado automaticamente, em hipótese alguma. */
export function resolveVtexChannel(order: Pick<VtexOrder, 'affiliateId' | 'marketplaceOrderId' | 'salesChannel' | 'origin'>, mappings: VtexChannelMappings = {}): VtexChannelResolution {
  const resolution = resolveCanonicalVtexChannel(order, mappings)
  return {
    canonicalChannel: resolution.canonicalKey,
    displayName: resolution.displayName,
    channelType: resolution.channelType,
    resolutionStatus: resolution.status,
    externalKey: resolution.externalKey,
    externalSalesChannel: resolution.rawIdentifiers.salesChannel,
    externalMarketplaceName: null,
    identifierType: resolution.identifierType,
    identifierValue: resolution.identifierValue,
    resolutionSource: resolution.source,
  }
}


export function classifyVtexChannel(order: Pick<VtexOrder, 'affiliateId' | 'marketplaceOrderId' | 'salesChannel' | 'origin'>, mappings: VtexChannelMappings = {}): VtexAnalyticChannel {
  return resolveVtexChannel(order, mappings).canonicalChannel
}

export function canonicalOrderKey(order: Pick<VtexOrder, 'orderId' | 'marketplaceOrderId'>, channel: VtexAnalyticChannel, resolutionStatus: 'resolved' | 'unresolved' | 'ignored' = 'resolved'): string {
  if (resolutionStatus === 'resolved' && channel !== 'loja_propria' && order.marketplaceOrderId) {
    return `${channel}:${String(order.marketplaceOrderId).trim()}`
  }
  return `vtex:${String(order.orderId).trim()}`
}

export function normalizeVtexOrder(order: VtexOrder, mappings: VtexChannelMappings = {}): VtexNormalizedOrder {
  const resolution = resolveVtexChannel(order, mappings)
  const analyticsIncluded = true
  const totalAmount = Number(order.value ?? 0) / 100
  return {
    canonicalOrderKey: canonicalOrderKey(order, resolution.canonicalChannel, resolution.resolutionStatus),
    channel: resolution.canonicalChannel,
    channelDisplayName: resolution.displayName,
    channelType: resolution.channelType,
    channelResolutionStatus: resolution.resolutionStatus,
    externalChannelKey: resolution.externalKey,
    externalSalesChannel: resolution.externalSalesChannel,
    externalMarketplaceName: resolution.externalMarketplaceName,
    identifierType: resolution.identifierType,
    identifierValue: resolution.identifierValue,
    resolutionSource: resolution.resolutionSource,
    analyticsIncluded,
    unavailableReason: resolution.resolutionStatus === 'unresolved' ? 'VTEX_CHANNEL_MAPPING_REQUIRED' : null,
    externalOrderId: String(order.orderId),
    marketplaceOrderId: order.marketplaceOrderId ? String(order.marketplaceOrderId) : null,
    affiliateId: order.affiliateId ? String(order.affiliateId) : null,
    status: normalizeVtexOrderStatus(order.status),
    totalAmount,
    feeAmount: null,
    currency: order.storePreferencesData?.currencyCode ?? null,
    orderedAt: order.creationDate,
    sourceUpdatedAt: order.lastChange ?? null,
    items: (order.items ?? []).map((item) => ({
      externalProductId: String(item.id),
      sku: item.refId ? String(item.refId) : String(item.id),
      title: item.name,
      quantity: Number(item.quantity ?? 0),
      unitPrice: Number(item.sellingPrice ?? item.priceDefinition?.calculatedSellingPrice ?? item.price ?? 0) / 100,
    })),
  }
}

export function flattenVtexCategories(nodes: VtexCategoryNode[], parentExternalId: string | null = null, ancestors: Array<{ id: string; name: string }> = []): Array<{ externalCategoryId: string; parentExternalId: string | null; name: string; path: Array<{ id: string; name: string }>; level: number }> {
  const result: Array<{ externalCategoryId: string; parentExternalId: string | null; name: string; path: Array<{ id: string; name: string }>; level: number }> = []
  for (const node of nodes ?? []) {
    if (!Number.isFinite(Number(node.id)) || typeof node.name !== 'string' || !node.name.trim()) continue
    const current = { id: String(node.id), name: node.name.trim() }
    const path = [...ancestors, current]
    result.push({ externalCategoryId: current.id, parentExternalId, name: current.name, path, level: path.length })
    result.push(...flattenVtexCategories(node.children ?? [], current.id, path))
  }
  return result
}

function mostSpecificCategory(categories?: Record<string, string>): { id: string | null; name: string | null; path: Array<{ id: string; name: string }> } {
  const entries = Object.entries(categories ?? {})
    .filter(([id, name]) => id && name)
    .map(([id, name]) => ({ id: String(id), name: String(name).replace(/^\/+|\/+$/g, '') }))
  if (entries.length === 0) return { id: null, name: null, path: [] }
  const last = entries[entries.length - 1]
  return { id: last.id, name: last.name.split('/').filter(Boolean).pop() ?? last.name, path: entries }
}

export function normalizeVtexSku(sku: VtexSkuContext, price: VtexPrice | null, inventory: VtexInventoryResponse | null) {
  const category = mostSpecificCategory(sku.ProductCategories)
  const balances = inventory?.balance ?? []
  const hasUnlimitedQuantity = balances.some((balance) => balance.hasUnlimitedQuantity)
  const availableQuantity = inventory === null || hasUnlimitedQuantity
    ? null
    : balances.reduce((sum, balance) => {
        const total = Number(balance.totalQuantity ?? 0)
        const reserved = Number(balance.reservedQuantity ?? 0)
        return sum + Math.max(0, total - reserved)
      }, 0)
  const sourceMetadata = { vtexSkuId: String(sku.Id), vtexProductId: String(sku.ProductId), priceAvailable: price !== null, inventoryAvailable: inventory !== null }
  return {
    product: {
      external_product_id: String(sku.Id),
      parent_product_id: String(sku.ProductId),
      sku: sku.RefId ? String(sku.RefId) : String(sku.Id),
      title: sku.NameComplete ?? sku.ProductName ?? sku.SkuName ?? `SKU ${sku.Id}`,
      status: sku.IsActive === false ? 'inactive' : 'active',
      price: price?.basePrice ?? null,
      category_id: category.id,
      category_name: category.name,
      category_path: category.path,
      brand_external_id: sku.BrandId == null ? null : String(sku.BrandId),
      brand_name: sku.BrandName?.trim() || null,
      available_quantity: availableQuantity,
      sold_quantity: 0,
      permalink: sku.DetailUrl ?? null,
      source_metadata: sourceMetadata,
      raw_payload: null,
    },
    inventory: {
      external_product_id: String(sku.Id),
      sku: sku.RefId ? String(sku.RefId) : String(sku.Id),
      title: sku.NameComplete ?? sku.ProductName ?? sku.SkuName ?? `SKU ${sku.Id}`,
      available_quantity: availableQuantity,
      sold_quantity_30d: null,
      raw_payload: null,
    },
    warehouseRows: balances.map((balance) => ({
      external_product_id: String(sku.Id),
      warehouse_id: String(balance.warehouseId),
      warehouse_name: balance.warehouseName ?? null,
      total_quantity: balance.totalQuantity ?? null,
      reserved_quantity: balance.reservedQuantity ?? null,
      available_quantity: balance.hasUnlimitedQuantity ? null : Math.max(0, Number(balance.totalQuantity ?? 0) - Number(balance.reservedQuantity ?? 0)),
      unlimited_quantity: Boolean(balance.hasUnlimitedQuantity),
    })),
  }
}
