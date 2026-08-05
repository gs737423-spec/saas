import type { Marketplace } from '@/data/mockData'

export type FinanceSource = 'demo' | 'real' | 'estimated'

export interface MarketplaceFinance {
  marketplace: Marketplace
  grossRevenue: number
  fees: number
  refunds: number
  /** bruto - taxas - estornos. Não é lucro. */
  netValue: number
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
