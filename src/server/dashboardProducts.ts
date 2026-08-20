import type { Marketplace } from '@/data/mockData'

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

export interface DashboardProductsResponse {
  ok: boolean
  source: DashboardProductsSource
  items: DashboardProduct[]
  message?: string
}
