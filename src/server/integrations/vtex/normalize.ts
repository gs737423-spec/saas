import type { VtexAnalyticChannel, VtexCategoryNode, VtexChannelMappings, VtexChannelResolution, VtexInventoryResponse, VtexNormalizedOrder, VtexOrder, VtexPrice, VtexSkuContext } from './types.js'

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

function normalizedAffiliate(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

const KNOWN_CHANNEL_LABELS: Record<string, string> = {
  mercadolivre: 'Mercado Livre', shopee: 'Shopee', amazon: 'Amazon', magalu: 'Magalu', loja_propria: 'Loja Própria',
}

function stableShortHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(36).padStart(7, '0')
}

function safeChannelSegment(value: string): string {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80) || 'unmapped'
}

function channelLabel(canonicalChannel: string): string {
  return KNOWN_CHANNEL_LABELS[canonicalChannel]
    ?? canonicalChannel.split(/[:_.-]+/).filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function vtexExternalChannelIdentity(order: Pick<VtexOrder, 'affiliateId' | 'marketplaceOrderId' | 'salesChannel' | 'origin'>): { externalKey: string; rawIdentity: string | null } {
  const affiliate = normalizedAffiliate(order.affiliateId)
  if (affiliate) return { externalKey: `affiliate:${affiliate}`, rawIdentity: String(order.affiliateId).trim() }
  const externalSalesChannel = normalizedAffiliate(order.salesChannel)
  if (externalSalesChannel) return { externalKey: `sales-channel:${externalSalesChannel}`, rawIdentity: String(order.salesChannel).trim() }
  if (!order.marketplaceOrderId) return { externalKey: 'native-store', rawIdentity: null }
  return { externalKey: 'marketplace:unidentified', rawIdentity: null }
}

export function resolveVtexChannel(order: Pick<VtexOrder, 'affiliateId' | 'marketplaceOrderId' | 'salesChannel' | 'origin'>, mappings: VtexChannelMappings = {}): VtexChannelResolution {
  const identity = vtexExternalChannelIdentity(order)
  const affiliate = normalizedAffiliate(order.affiliateId)
  for (const [canonicalChannel, values] of Object.entries(mappings)) {
    if (values.some((value) => {
      const normalized = normalizedAffiliate(value)
      return (affiliate && normalized === affiliate) || normalized === identity.externalKey
    })) {
      return {
        canonicalChannel,
        displayName: channelLabel(canonicalChannel),
        channelType: canonicalChannel === 'loja_propria' ? 'own_store' : 'marketplace',
        resolutionStatus: 'resolved',
        externalKey: identity.externalKey,
        externalSalesChannel: order.salesChannel ? String(order.salesChannel) : null,
        externalMarketplaceName: null,
      }
    }
  }
  if (identity.externalKey === 'native-store') {
    return {
      canonicalChannel: 'loja_propria', displayName: 'Loja Própria', channelType: 'own_store',
      resolutionStatus: 'resolved', externalKey: identity.externalKey,
      externalSalesChannel: order.salesChannel ? String(order.salesChannel) : null, externalMarketplaceName: null,
    }
  }
  const identitySeed = identity.rawIdentity ?? identity.externalKey
  const canonicalChannel = `external:vtex:${safeChannelSegment(identitySeed)}-${stableShortHash(identity.externalKey)}`
  return {
    canonicalChannel,
    displayName: identity.rawIdentity ? `Canal VTEX ${identity.rawIdentity}` : 'Canal VTEX não mapeado',
    channelType: 'external',
    resolutionStatus: 'unresolved',
    externalKey: identity.externalKey,
    externalSalesChannel: order.salesChannel ? String(order.salesChannel) : null,
    externalMarketplaceName: null,
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
    analyticsIncluded,
    unavailableReason: resolution.resolutionStatus === 'unresolved' ? 'VTEX_CHANNEL_MAPPING_REQUIRED' : null,
    externalOrderId: String(order.orderId),
    marketplaceOrderId: order.marketplaceOrderId ? String(order.marketplaceOrderId) : null,
    affiliateId: order.affiliateId ? String(order.affiliateId) : null,
    status: normalizeVtexOrderStatus(order.status),
    totalAmount,
    feeAmount: 0,
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
