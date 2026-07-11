/**
 * API Service Layer
 *
 * All data access goes through this module. Currently returns mock data with
 * simulated async delay. To connect to a real backend, replace the body of
 * each method with a fetch() call — the signatures stay the same.
 */

import {
  type KPI,
  type RevenueMonth,
  type Product,
  type Opportunity,
  type Alert,
  type InventoryItem,
  type Marketplace,
  type MarketplaceConnection,
  type StockItem,
  type StockAlert,
  type RestockRecommendation,
  type ImportSourceStatus,
  type ImportRecord,
  type MarketplaceMetrics,
  type ChannelOverview,
  type OverviewKpi,
  type ChannelDataSignal,
  type CategoryPerf,
  type ProductAlert,
  type ProductOpportunity,
  type PerformanceSummary,
  type ProductActivity,
  type TrendPoint,
  type TrendPeriod,
  type ProductStatus,
  type ProductInsight,
  type ProductHealthScore,
  type ProductMarketplaceBreakdown,
  type ExecutiveSummaryLine,
  type ExecutiveAlert,
  type ExecutiveHighlight,
  type InventoryAlert,
  type MarketplaceOpportunity,
  kpis,
  revenueData,
  products,
  opportunities,
  alerts,
  inventoryItems,
  marketplaceConnections,
  stockItems,
  stockAlerts,
  restockRecommendations,
  importSourceStatus,
  importHistory,
  marketplaceMetrics,
  channelOverview,
  overviewKpis,
  channelDataSignals,
  lastUpdatedLabel,
  categoryPerformance,
  productCategories,
  productAlerts,
  productOpportunities,
  performanceSummary,
  productActivity,
  marketplaceOpportunities,
  getSalesTrend,
  getProductStatus,
  getProductHealthSummary,
  getProductInsights,
  getProductHealthScore,
  getProductMarketplaceBreakdown,
  getMarketplaceColor,
  getCoverageStatus,
  turnoverStatusStyle,
  getEstimatedInventoryValue,
  getTopProductByMarketplace,
  getExecutiveSummary,
  getExecutiveAlerts,
  getExecutiveHighlights,
  getAttentionProductCount,
  getInventoryAlerts,
  getABCClass,
} from '@/data/mockData'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_BASE = import.meta.env.VITE_API_URL || 'https://api.acelera.app/v1'

/** Simulated network latency (ms). Set to 0 to disable. */
const MOCK_DELAY = 100

// ---------------------------------------------------------------------------
// Generic fetch helper (used when real API is wired up)
// ---------------------------------------------------------------------------

/**
 * Authenticated fetch wrapper. Reads the JWT from localStorage and sets
 * the Authorization header automatically.
 *
 * Currently unused — every method returns mock data. When you swap in real
 * calls, use `request<T>('/products', { method: 'GET' })` etc.
 */
async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('auth_token')

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`API ${res.status}: ${body}`)
  }

  return res.json() as Promise<T>
}

// ---------------------------------------------------------------------------
// Filter & response types
// ---------------------------------------------------------------------------

export interface ProductFilters {
  marketplace?: Marketplace
  category?: string
  search?: string
  sortBy?: keyof Product
  sortDir?: 'asc' | 'desc'
  minRevenue?: number
  maxRevenue?: number
}

export interface InventoryFilters {
  marketplace?: Marketplace
  status?: StockItem['status']
  abcClass?: 'A' | 'B' | 'C'
  turnoverStatus?: InventoryItem['turnoverStatus']
  search?: string
  sortBy?: keyof InventoryItem
  sortDir?: 'asc' | 'desc'
}

export interface InventoryStats {
  totalItems: number
  totalUnits: number
  estimatedValue: number
  criticalCount: number
  lowCount: number
  stalledCount: number
  okCount: number
}

export interface SyncResult {
  success: boolean
  marketplace: string
  recordsSynced: number
  errors: number
  syncedAt: string
}

export interface SyncStatus {
  marketplace: Marketplace
  connected: boolean
  lastSync: string
  products: number
  orders: number
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const delay = () => new Promise<void>((r) => setTimeout(r, MOCK_DELAY))

// ---------------------------------------------------------------------------
// API object
// ---------------------------------------------------------------------------

export const api = {
  // =========================================================================
  // Dashboard
  // =========================================================================

  /** TODO: Replace with real API call — GET /api/v1/dashboard/kpis */
  async getDashboardKPIs(): Promise<KPI[]> {
    await delay()
    return kpis
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/revenue?period={period} */
  async getRevenueByChannel(period: string): Promise<RevenueMonth[]> {
    await delay()
    // Currently ignores period — mock has full-year data
    return revenueData
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/overview-kpis */
  async getOverviewKPIs(): Promise<OverviewKpi[]> {
    await delay()
    return overviewKpis
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/opportunities */
  async getOpportunities(): Promise<Opportunity[]> {
    await delay()
    return opportunities
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/alerts */
  async getAlerts(): Promise<Alert[]> {
    await delay()
    return alerts
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/channel-signals */
  async getChannelDataSignals(): Promise<ChannelDataSignal[]> {
    await delay()
    return channelDataSignals
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/last-updated */
  async getLastUpdatedLabel(): Promise<string> {
    await delay()
    return lastUpdatedLabel
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/performance-summary */
  async getPerformanceSummary(): Promise<PerformanceSummary[]> {
    await delay()
    return performanceSummary
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/executive-summary */
  async getExecutiveSummary(): Promise<ExecutiveSummaryLine[]> {
    await delay()
    return getExecutiveSummary()
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/executive-alerts */
  async getExecutiveAlerts(): Promise<ExecutiveAlert[]> {
    await delay()
    return getExecutiveAlerts()
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/executive-highlights */
  async getExecutiveHighlights(): Promise<ExecutiveHighlight[]> {
    await delay()
    return getExecutiveHighlights()
  },

  /** TODO: Replace with real API call — GET /api/v1/dashboard/attention-count */
  async getAttentionProductCount(): Promise<number> {
    await delay()
    return getAttentionProductCount()
  },

  // =========================================================================
  // Products
  // =========================================================================

  /** TODO: Replace with real API call — GET /api/v1/products?marketplace=...&category=...&search=...&sort=...&order=... */
  async getProducts(filters?: ProductFilters): Promise<Product[]> {
    await delay()
    let result = [...products]

    if (filters) {
      if (filters.marketplace) {
        result = result.filter((p) => p.marketplace === filters.marketplace)
      }
      if (filters.category) {
        result = result.filter((p) => p.category === filters.category)
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.sku.toLowerCase().includes(q),
        )
      }
      if (filters.minRevenue !== undefined) {
        result = result.filter((p) => p.revenue >= filters.minRevenue!)
      }
      if (filters.maxRevenue !== undefined) {
        result = result.filter((p) => p.revenue <= filters.maxRevenue!)
      }
      if (filters.sortBy) {
        const dir = filters.sortDir === 'asc' ? 1 : -1
        result.sort((a, b) => {
          const va = a[filters.sortBy!]
          const vb = b[filters.sortBy!]
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
          return String(va).localeCompare(String(vb)) * dir
        })
      }
    }

    return result
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku */
  async getProductById(sku: string): Promise<Product | null> {
    await delay()
    return products.find((p) => p.sku === sku) ?? null
  },

  /** TODO: Replace with real API call — GET /api/v1/products/categories */
  async getProductCategories(): Promise<string[]> {
    await delay()
    return [...productCategories]
  },

  /** TODO: Replace with real API call — GET /api/v1/products/category-performance */
  async getCategoryPerformance(): Promise<CategoryPerf[]> {
    await delay()
    return categoryPerformance
  },

  /** TODO: Replace with real API call — GET /api/v1/products/alerts */
  async getProductAlerts(): Promise<ProductAlert[]> {
    await delay()
    return productAlerts
  },

  /** TODO: Replace with real API call — GET /api/v1/products/opportunities */
  async getProductOpportunities(): Promise<ProductOpportunity[]> {
    await delay()
    return productOpportunities
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/activity */
  async getProductActivity(sku: string): Promise<ProductActivity[]> {
    await delay()
    return productActivity.filter((a) => a.sku === sku)
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/sales-trend?period={period} */
  async getProductSalesTrend(sku: string, period: TrendPeriod = '30D'): Promise<TrendPoint[]> {
    await delay()
    return getSalesTrend(sku, period)
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/status */
  async getProductStatus(sku: string): Promise<ProductStatus> {
    await delay()
    return getProductStatus(sku)
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/health-summary */
  async getProductHealthSummary(product: Product): Promise<string> {
    await delay()
    const status = getProductStatus(product.sku)
    const stock = stockItems.find((s) => s.sku === product.sku)
    return getProductHealthSummary(product, status, stock)
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/insights */
  async getProductInsights(product: Product): Promise<ProductInsight[]> {
    await delay()
    const stock = stockItems.find((s) => s.sku === product.sku)
    return getProductInsights(product, stock)
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/health-score */
  async getProductHealthScore(product: Product): Promise<ProductHealthScore> {
    await delay()
    const stock = stockItems.find((s) => s.sku === product.sku)
    const status = getProductStatus(product.sku)
    return getProductHealthScore(product, stock, status)
  },

  /** TODO: Replace with real API call — GET /api/v1/products/:sku/marketplace-breakdown */
  async getProductMarketplaceBreakdown(product: Product): Promise<ProductMarketplaceBreakdown[]> {
    await delay()
    return getProductMarketplaceBreakdown(product)
  },

  // =========================================================================
  // Inventory
  // =========================================================================

  /** TODO: Replace with real API call — GET /api/v1/inventory?marketplace=...&status=...&abc=...&sort=...&order=... */
  async getInventoryItems(filters?: InventoryFilters): Promise<InventoryItem[]> {
    await delay()
    let result = [...inventoryItems]

    if (filters) {
      if (filters.marketplace) {
        result = result.filter((i) => i.marketplace === filters.marketplace)
      }
      if (filters.status) {
        result = result.filter((i) => i.status === filters.status)
      }
      if (filters.abcClass) {
        result = result.filter((i) => i.abcClass === filters.abcClass)
      }
      if (filters.turnoverStatus) {
        result = result.filter((i) => i.turnoverStatus === filters.turnoverStatus)
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        result = result.filter(
          (i) =>
            i.name.toLowerCase().includes(q) ||
            i.sku.toLowerCase().includes(q) ||
            i.manufacturerCode.toLowerCase().includes(q),
        )
      }
      if (filters.sortBy) {
        const dir = filters.sortDir === 'asc' ? 1 : -1
        result.sort((a, b) => {
          const va = a[filters.sortBy!]
          const vb = b[filters.sortBy!]
          if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir
          return String(va).localeCompare(String(vb)) * dir
        })
      }
    }

    return result
  },

  /** TODO: Replace with real API call — GET /api/v1/inventory/stats */
  async getInventoryStats(): Promise<InventoryStats> {
    await delay()
    return {
      totalItems: inventoryItems.length,
      totalUnits: inventoryItems.reduce((s, i) => s + i.stock, 0),
      estimatedValue: getEstimatedInventoryValue(),
      criticalCount: inventoryItems.filter((i) => i.status === 'critical').length,
      lowCount: inventoryItems.filter((i) => i.status === 'low').length,
      stalledCount: inventoryItems.filter((i) => i.status === 'stalled').length,
      okCount: inventoryItems.filter((i) => i.status === 'ok').length,
    }
  },

  /** TODO: Replace with real API call — GET /api/v1/inventory/stock-alerts */
  async getStockAlerts(): Promise<StockAlert[]> {
    await delay()
    return stockAlerts
  },

  /** TODO: Replace with real API call — GET /api/v1/inventory/restock-recommendations */
  async getRestockRecommendations(): Promise<RestockRecommendation[]> {
    await delay()
    return restockRecommendations
  },

  /** TODO: Replace with real API call — GET /api/v1/inventory/alerts */
  async getInventoryAlerts(): Promise<InventoryAlert[]> {
    await delay()
    return getInventoryAlerts()
  },

  // =========================================================================
  // Marketplaces
  // =========================================================================

  /** TODO: Replace with real API call — GET /api/v1/marketplaces/metrics */
  async getMarketplaceMetrics(): Promise<MarketplaceMetrics[]> {
    await delay()
    return marketplaceMetrics
  },

  /** TODO: Replace with real API call — GET /api/v1/marketplaces/overview */
  async getMarketplaceComparison(): Promise<ChannelOverview[]> {
    await delay()
    return channelOverview
  },

  /** TODO: Replace with real API call — GET /api/v1/marketplaces/connections */
  async getMarketplaceConnections(): Promise<MarketplaceConnection[]> {
    await delay()
    return marketplaceConnections
  },

  /** TODO: Replace with real API call — GET /api/v1/marketplaces/opportunities */
  async getMarketplaceOpportunities(): Promise<MarketplaceOpportunity[]> {
    await delay()
    return marketplaceOpportunities
  },

  /** TODO: Replace with real API call — GET /api/v1/marketplaces/:name/top-product */
  async getTopProductByMarketplace(mp: Marketplace): Promise<Product | undefined> {
    await delay()
    return getTopProductByMarketplace(mp)
  },

  // =========================================================================
  // Sync / Import
  // =========================================================================

  /** TODO: Replace with real API call — POST /api/v1/sync/:marketplace */
  async syncMarketplace(marketplace: string): Promise<SyncResult> {
    await delay()
    return {
      success: true,
      marketplace,
      recordsSynced: Math.floor(Math.random() * 500) + 100,
      errors: 0,
      syncedAt: new Date().toISOString(),
    }
  },

  /** TODO: Replace with real API call — GET /api/v1/sync/status */
  async getSyncStatus(): Promise<SyncStatus[]> {
    await delay()
    return marketplaceConnections.map((c) => ({
      marketplace: c.name,
      connected: c.connected,
      lastSync: c.lastSync,
      products: c.products,
      orders: c.orders,
    }))
  },

  /** TODO: Replace with real API call — GET /api/v1/import/sources */
  async getImportSourceStatus(): Promise<ImportSourceStatus[]> {
    await delay()
    return importSourceStatus
  },

  /** TODO: Replace with real API call — GET /api/v1/import/history */
  async getImportHistory(): Promise<ImportRecord[]> {
    await delay()
    return importHistory
  },

  // =========================================================================
  // Utility (re-exported for convenience — no API call needed)
  // =========================================================================

  getMarketplaceColor,
  getCoverageStatus,
  turnoverStatusStyle,
  getABCClass,
}

// Re-export types so consumers can import from '@/services/api'
export type {
  KPI,
  RevenueMonth,
  Product,
  Opportunity,
  Alert,
  InventoryItem,
  Marketplace,
  MarketplaceConnection,
  StockItem,
  StockAlert,
  RestockRecommendation,
  ImportSourceStatus,
  ImportRecord,
  MarketplaceMetrics,
  ChannelOverview,
  OverviewKpi,
  ChannelDataSignal,
  CategoryPerf,
  ProductAlert,
  ProductOpportunity,
  PerformanceSummary,
  ProductActivity,
  TrendPoint,
  TrendPeriod,
  ProductStatus,
  ProductInsight,
  ProductHealthScore,
  ProductMarketplaceBreakdown,
  ExecutiveSummaryLine,
  ExecutiveAlert,
  ExecutiveHighlight,
  InventoryAlert,
  MarketplaceOpportunity,
}
