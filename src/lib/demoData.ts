import type { Marketplace } from '@/data/mockData'
import type { DashboardSummary, DashboardInventoryResponse, DashboardInventoryItem } from '@/server/integrations/types'
import type { DashboardProductsResponse, DashboardProduct } from '@/server/dashboardProducts'
import type { FinanceOverview, MarketplaceFinance, FinanceTransaction } from '@/data/financeShapes'

// Payloads ilustrativos do Modo Demonstração — mesmo shape exato dos
// endpoints reais (source: 'demo', já previsto no contrato de tipos),
// nunca usados fora do toggle explícito do admin. Ver DemoModeContext.tsx.

export function demoDashboardSummary(): DashboardSummary {
  return {
    source: 'demo',
    grossRevenue: 187430.55,
    ordersCount: 612,
    averageTicket: 306.26,
    feesTotal: 21384.12,
    returnsCount: 14,
    returnsAmount: 3120.4,
    lastSyncAt: new Date().toISOString(),
    grossRevenueChangePct: 12.4,
    ordersCountChangePct: 8.1,
  }
}

// margin/trend/sharePct são percentuais 0-100 (mesma convenção da API real,
// ver api/dashboard/products.ts), não fração 0-1.
const DEMO_PRODUCTS: DashboardProduct[] = [
  { id: 'demo-1', sku: 'TEN-0231', name: 'Tênis Runner Pro Azul', marketplace: 'Mercado Livre', category: 'Calçados', price: 289.9, costPrice: 145, margin: 50, stock: 42, revenue: 24350, units: 84, trend: 14, sharePct: 19 },
  { id: 'demo-2', sku: 'MOC-1187', name: 'Mochila Urbana 20L', marketplace: 'Shopee', category: 'Acessórios', price: 159.9, costPrice: 78, margin: 51, stock: 118, units: 210, revenue: 33579, trend: 22, sharePct: 26 },
  { id: 'demo-3', sku: 'CAM-0552', name: 'Camiseta Dry-Fit Preta', marketplace: 'Amazon', category: 'Vestuário', price: 69.9, costPrice: 28, margin: 60, stock: 260, units: 340, revenue: 23766, trend: -5, sharePct: 19 },
  { id: 'demo-4', sku: 'GAR-0098', name: 'Garrafa Térmica 1L', marketplace: 'Loja Própria', category: 'Utilidades', price: 89.9, costPrice: 41, margin: 54, stock: 76, units: 96, revenue: 8630, trend: 8, sharePct: 7 },
  { id: 'demo-5', sku: 'RLG-0405', name: 'Relógio Smartwatch Lite', marketplace: 'Mercado Livre', category: 'Eletrônicos', price: 349.9, costPrice: 190, margin: 46, stock: 19, units: 58, revenue: 20294, trend: 31, sharePct: 16 },
  { id: 'demo-6', sku: 'BON-0271', name: 'Boné Trucker Bordado', marketplace: 'Shopee', category: 'Acessórios', price: 49.9, costPrice: 19, margin: 62, stock: 5, units: 140, revenue: 6986, trend: -2, sharePct: 6 },
]

export function demoDashboardProducts(): DashboardProductsResponse {
  return { ok: true, source: 'demo', items: DEMO_PRODUCTS }
}

const DEMO_INVENTORY: DashboardInventoryItem[] = DEMO_PRODUCTS.map((p, i) => ({
  sku: p.sku,
  title: p.name,
  marketplace: p.marketplace,
  availableQuantity: p.stock,
  price: p.price,
  status: p.stock < 10 ? 'baixo' : 'ativo',
  soldQuantity: p.units,
  revenue30d: p.revenue,
  turnoverRate: p.stock > 0 ? p.units / p.stock : null,
  abcClass: i < 2 ? 'A' : i < 4 ? 'B' : 'C',
  lastSyncAt: new Date().toISOString(),
  // Dados de compra/fornecedor — só existem em Modo Demonstração (sem
  // tabela de purchase orders/NF real ainda, ver types.ts).
  manufacturerCode: `FAB-${10000 + i * 1000 + p.sku!.length * 37}`,
  lastEntryAt: new Date(Date.now() - (5 + i * 9) * 86400000).toISOString(),
  entryQty: Math.round(p.stock * 1.6),
  lastInvoiceNumber: `NF-${20000 + i * 41}`,
  freightValue: Math.round(p.price * 0.6 * 100) / 100,
}))

export function demoDashboardInventory(): DashboardInventoryResponse {
  return { source: 'demo', items: DEMO_INVENTORY, lastSyncAt: new Date().toISOString() }
}

const MARKETPLACES: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']
const SHARE: Record<Marketplace, number> = { 'Mercado Livre': 0.42, Shopee: 0.31, Amazon: 0.19, 'Loja Própria': 0.08 }

function demoFinanceByMarketplace(totalGross: number): MarketplaceFinance[] {
  return MARKETPLACES.map((marketplace) => {
    const grossRevenue = Math.round(totalGross * SHARE[marketplace] * 100) / 100
    const fees = Math.round(grossRevenue * 0.115 * 100) / 100
    const refunds = Math.round(grossRevenue * 0.017 * 100) / 100
    const ordersCount = Math.round((grossRevenue / 306.26))
    return {
      marketplace,
      grossRevenue,
      fees,
      refunds,
      netValue: Math.round((grossRevenue - fees - refunds) * 100) / 100,
      ordersCount,
      averageTicket: ordersCount > 0 ? Math.round((grossRevenue / ordersCount) * 100) / 100 : 0,
      growth: { d1: 2.1, d7: 6.4, d30: 12.4, d365: 41.2 },
      source: 'demo',
    }
  })
}

export function demoFinanceOverview(): { overview: FinanceOverview; byMarketplace: MarketplaceFinance[] } {
  const summary = demoDashboardSummary()
  const byMarketplace = demoFinanceByMarketplace(summary.grossRevenue)
  const overview: FinanceOverview = {
    grossRevenue: summary.grossRevenue,
    fees: summary.feesTotal,
    refunds: summary.returnsAmount,
    netValue: Math.round((summary.grossRevenue - summary.feesTotal - summary.returnsAmount) * 100) / 100,
    source: 'demo',
  }
  return { overview, byMarketplace }
}

const TX_TYPES: FinanceTransaction['type'][] = ['Venda', 'Comissão', 'Tarifa', 'Estorno', 'Devolução']

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export interface DemoDailyRevenuePoint {
  date: string
  label: string
  mercadolivre: number
  shopee: number
  amazon: number
  lojapropria: number
  total: number
}

const DAILY_BASELINE: Record<'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria', number> = {
  mercadolivre: 2800,
  shopee: 1600,
  amazon: 900,
  lojapropria: 550,
}
const DAILY_GROWTH: Record<'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria', number> = {
  mercadolivre: 3.5,
  shopee: 4.2,
  amazon: 2.8,
  lojapropria: 1.8,
}

// Curva diária determinística (mesmo seed sempre gera o mesmo gráfico) —
// usada só quando o admin ativa o Modo Demonstração. `totalDays` já vem
// dobrado pelo endpoint (periodDays*2) pra sempre ter janela anterior.
export function demoFinanceDaily(totalDays: number): DemoDailyRevenuePoint[] {
  const points: DemoDailyRevenuePoint[] = []
  const keys = ['mercadolivre', 'shopee', 'amazon', 'lojapropria'] as const
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const dayOfWeek = d.getDay()
    const weekendFactor = dayOfWeek === 0 ? 0.7 : dayOfWeek === 6 ? 0.85 : 1
    const dayIndex = totalDays - i
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()

    const point: DemoDailyRevenuePoint = {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
      mercadolivre: 0,
      shopee: 0,
      amazon: 0,
      lojapropria: 0,
      total: 0,
    }
    let total = 0
    for (const key of keys) {
      const base = DAILY_BASELINE[key]
      const growth = DAILY_GROWTH[key] * dayIndex
      const variation = (seededRandom(seed + key.length) - 0.5) * base * 0.3
      const value = Math.max(0, Math.round((base + growth + variation) * weekendFactor))
      point[key] = value
      total += value
    }
    point.total = total
    points.push(point)
  }
  return points
}

export function demoFinanceTransactions(): FinanceTransaction[] {
  return Array.from({ length: 18 }, (_, i) => {
    const marketplace = MARKETPLACES[i % MARKETPLACES.length]
    const type = TX_TYPES[i % TX_TYPES.length]
    const gross = Math.round((80 + (i * 37) % 420) * 100) / 100
    const discount = type === 'Comissão' || type === 'Tarifa' ? Math.round(gross * 0.11 * 100) / 100 : 0
    const date = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10)
    return { date, marketplace, type, identifier: `DEMO-${1000 + i}`, gross, discount, net: Math.round((gross - discount) * 100) / 100 }
  })
}
