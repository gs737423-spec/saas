export interface DashboardProduct {
  id: string
  sku: string | null
  name: string
  marketplace: 'Mercado Livre'
  category: string | null
  price: number
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

export type DashboardProductsSource = 'real' | 'demo' | 'config_missing' | 'error'

export interface DashboardProductsResponse {
  ok: boolean
  source: DashboardProductsSource
  items: DashboardProduct[]
  message?: string
}
