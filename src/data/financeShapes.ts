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
  marketplace: string
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

/** A fixture demo já entrega seus próprios canais. Esta camada nunca cria
 * linhas: vazio real continua vazio e tenant sem Amazon não recebe Amazon. */
export function fillAllMarketplaces(rows: MarketplaceFinance[]): MarketplaceFinance[] {
  return rows
}

export type FinanceTransactionType = 'Venda' | 'Tarifa' | 'Estorno' | 'Devolução' | 'Ajuste'

export interface FinanceTransaction {
  date: string
  marketplace: string
  type: FinanceTransactionType
  identifier: string
  gross: number
  discount: number
  net: number
}
