import type { Marketplace } from '@/data/mockData'
import type { CategoryOption } from '@/lib/categoryAnalytics'

export interface DashboardProduct {
  id: string
  connectionId: string
  sku: string | null
  name: string
  marketplace: Marketplace
  /** Identidade oficial recebida do marketplace, quando disponível. */
  categoryId: string | null
  category: string | null
  /** null = a origem ainda não forneceu preço; nunca converter em preço zero. */
  price: number | null
  costPrice: number | null
  /** null até o cliente informar costPrice — nunca estimada. */
  margin: number | null
  stock: number
  revenue: number
  units: number
  /** null quando não há venda no período anterior pra comparar (sem base pra %). */
  trend: number | null
  sharePct: number
}

export interface ProductSalesPoint {
  date: string
  units: number
  revenue: number
}

export interface ProductSalesResponse {
  ok: boolean
  source: DashboardProductsSource
  points: ProductSalesPoint[]
  lastSyncAt: string | null
  message?: string
}

export type DashboardProductsSource = 'real' | 'demo' | 'config_missing' | 'error'

export interface DashboardPage {
  page: number
  pageSize: number
  totalRows: number
  totalPages: number
}

export interface DashboardProductMetrics {
  active: number
  withStock: number
  averageMargin: number | null
  totalUnits: number
  totalRevenue: number
  bestSeller: { name: string; sku: string | null; units: number; trend: number | null } | null
  lowestTurn: { name: string; sku: string | null; units: number; trend: number | null } | null
}

export interface DashboardProductsResponse {
  ok: boolean
  source: DashboardProductsSource
  items: DashboardProduct[]
  /** Presente apenas nas leituras paginadas da tela Produtos. */
  pagination?: DashboardPage
  categoryOptions?: CategoryOption[]
  metrics?: DashboardProductMetrics
  message?: string
}

export interface DashboardProductReportResponse {
  ok: boolean
  source: DashboardProductsSource
  topProducts: DashboardProduct[]
  lowStockProducts: DashboardProduct[]
  metrics?: {
    lowStockCount: number
    withoutCostCount: number
  }
  message?: string
}

export function selectDashboardProductMatches(
  items: DashboardProduct[],
  legacyIdentifier: string | undefined,
  exact?: { connectionId: string | null; externalProductId: string | null },
): DashboardProduct[] {
  if (exact?.connectionId && exact.externalProductId) {
    return items.filter((product) => product.connectionId === exact.connectionId && product.id === exact.externalProductId)
  }
  if (!legacyIdentifier) return []
  return items.filter((product) => (product.sku && product.sku === legacyIdentifier) || product.id === legacyIdentifier)
}
