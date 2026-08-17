import { ALL_MARKETPLACES } from '@/data/mockData'

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

const ZERO_GROWTH: MarketplaceGrowth = { d1: null, d7: null, d30: null, d365: null }

/** Sempre devolve os 4 canais, na ordem canônica — canal sem pedido no
 *  período vem zerado, nunca fica de fora. Estrutura da tela nunca varia
 *  por quantidade de marketplace conectado (ver decisão 2026-08-06). */
export function fillAllMarketplaces(rows: MarketplaceFinance[]): MarketplaceFinance[] {
  const byMarketplace = new Map(rows.map((r) => [r.marketplace, r]))
  const baseline = ALL_MARKETPLACES.map((marketplace) => byMarketplace.get(marketplace) ?? {
    marketplace,
    grossRevenue: 0,
    fees: 0,
    refunds: 0,
    netValue: 0,
    ordersCount: 0,
    averageTicket: 0,
    growth: ZERO_GROWTH,
    source: rows[0]?.source ?? 'real',
  })
  const baselineNames = new Set<string>(ALL_MARKETPLACES)
  return [...baseline, ...rows.filter((row) => !baselineNames.has(row.marketplace))]
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
