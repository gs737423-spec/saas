import type { Marketplace } from '@/data/mockData'

export type FinanceSource = 'demo' | 'real' | 'estimated'

/** Faturamento do dia de hoje vs faturamento de exatamente N dias atrás
 *  (não soma de período — comparação dia-a-dia mesmo). null quando não há
 *  pedido pago naquele dia de referência pra comparar. */
export interface MarketplaceGrowth {
  d1: number | null
  d7: number | null
  d30: number | null
  d365: number | null
}

export interface MarketplaceFinance {
  marketplace: Marketplace
  grossRevenue: number
  fees: number
  refunds: number
  /** bruto - taxas - estornos. Não é lucro. */
  netValue: number
  ordersCount: number
  averageTicket: number
  growth: MarketplaceGrowth
  source: FinanceSource
}

export interface FinanceOverview {
  grossRevenue: number
  fees: number
  refunds: number
  /** bruto - comissão - estornos. Não é lucro. */
  netValue: number
  source: FinanceSource
}

export type FinanceTransactionType = 'Venda' | 'Comissão' | 'Tarifa' | 'Estorno' | 'Devolução' | 'Ajuste'

export interface FinanceTransaction {
  date: string
  marketplace: Marketplace
  type: FinanceTransactionType
  identifier: string
  gross: number
  discount: number
  net: number
}
