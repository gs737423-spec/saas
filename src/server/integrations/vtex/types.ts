export type VtexDomain = 'account' | 'orders' | 'catalog' | 'pricing' | 'inventory' | 'feed'

export interface VtexCredentials {
  accountName: string
  appKey: string
  appToken: string
}

export interface VtexPermissionCheck {
  domain: VtexDomain
  required: boolean
  ok: boolean
  status: number | null
}

export interface VtexConnectionTestResult {
  accountName: string
  valid: boolean
  permissions: VtexPermissionCheck[]
  missingRequired: VtexDomain[]
}

export interface VtexCategoryNode {
  id: number
  name: string
  hasChildren?: boolean
  url?: string
  children?: VtexCategoryNode[]
}

export interface VtexSkuContext {
  Id: number
  ProductId: number
  RefId?: string | null
  ProductRefId?: string | null
  NameComplete?: string | null
  ProductName?: string | null
  SkuName?: string | null
  IsActive?: boolean
  ProductCategories?: Record<string, string>
  DetailUrl?: string | null
}

export interface VtexPrice {
  itemId?: string
  basePrice?: number | null
  listPrice?: number | null
  costPrice?: number | null
  markup?: number | null
}

export interface VtexInventoryBalance {
  warehouseId: string
  warehouseName?: string | null
  totalQuantity?: number | null
  reservedQuantity?: number | null
  hasUnlimitedQuantity?: boolean
}

export interface VtexInventoryResponse {
  skuId?: string
  balance?: VtexInventoryBalance[]
}

export interface VtexOrderSummary {
  orderId: string
  creationDate: string
  lastChange?: string
  status: string
  totalValue?: number
}

export interface VtexOrderListResponse {
  list?: VtexOrderSummary[]
  paging?: { total?: number; pages?: number; currentPage?: number; perPage?: number }
}

export interface VtexOrderItem {
  id: string
  productId?: string
  refId?: string | null
  name: string
  quantity: number
  price: number
  sellingPrice?: number
  priceDefinition?: { calculatedSellingPrice?: number; total?: number }
}

export interface VtexOrderTotal {
  id: string
  name?: string
  value: number
}

export interface VtexOrder {
  orderId: string
  marketplaceOrderId?: string | null
  sellerOrderId?: string | null
  affiliateId?: string | null
  salesChannel?: string | null
  origin?: string | null
  status: string
  value: number
  creationDate: string
  lastChange?: string
  items: VtexOrderItem[]
  totals?: VtexOrderTotal[]
  storePreferencesData?: { currencyCode?: string; currencyLocale?: number; currencySymbol?: string }
}

/** Tenant-scoped canonical channel -> external VTEX affiliate ids or stable
 * external identity keys (for example `sales-channel:1`).
 * Keys are intentionally dynamic; adding a marketplace must not require code
 * or a database migration. */
export type VtexChannelMappings = Record<string, string[]>

export type VtexAnalyticChannel = string
export type VtexChannelResolutionStatus = 'resolved' | 'unresolved' | 'ignored'

export interface VtexChannelResolution {
  canonicalChannel: VtexAnalyticChannel
  displayName: string
  channelType: 'marketplace' | 'own_store' | 'external' | 'other'
  resolutionStatus: VtexChannelResolutionStatus
  externalKey: string
  externalSalesChannel: string | null
  externalMarketplaceName: string | null
}

export interface VtexNormalizedOrder {
  canonicalOrderKey: string
  channel: VtexAnalyticChannel
  channelDisplayName: string
  channelType: VtexChannelResolution['channelType']
  channelResolutionStatus: VtexChannelResolutionStatus
  externalChannelKey: string
  externalSalesChannel: string | null
  externalMarketplaceName: string | null
  analyticsIncluded: boolean
  unavailableReason: string | null
  externalOrderId: string
  marketplaceOrderId: string | null
  affiliateId: string | null
  status: string
  totalAmount: number
  feeAmount: number
  currency: string | null
  orderedAt: string
  sourceUpdatedAt: string | null
  items: Array<{ externalProductId: string; sku: string | null; title: string; quantity: number; unitPrice: number }>
}

export interface VtexSyncCounts {
  categoriesFetched: number
  productsFetched: number
  skusFetched: number
  pricesFetched: number
  inventoriesFetched: number
  ordersFetched: number
  ordersInserted: number
  ordersUpdated: number
  ordersDeduplicated: number
  channelsDiscovered: number
  channelsResolved: number
  channelsUnresolved: number
  errors: number
}

export interface VtexSyncCheckpoint {
  skuOffset?: number
  orderPage?: number
  orderWindowStart?: string
  orderWindowEnd?: string
  orderTargetEnd?: string
  lastOrderChange?: string
}
