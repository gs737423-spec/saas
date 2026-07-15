import { BASELINE_DAYS, TODAY, type PeriodOption } from '@/lib/periods'
import { marketplaceMetrics, type Marketplace } from '@/data/mockData'

/* ============================================================================
 * FINANCEIRO — dados operacionais derivados dos canais de venda.
 *
 * Escopo desta fase: só o que é observável na operação de venda em si
 * (faturamento, taxas do marketplace, estornos/devoluções). Nenhum dado de
 * liquidação/repasse bancário é modelado aqui — não temos fonte real para
 * isso ainda, e estimar criaria a falsa impressão de saldo/caixa garantido.
 *
 * "Valor líquido estimado" = bruto − taxas − estornos. NUNCA tratar como
 * lucro: não desconta impostos próprios, folha, aluguel, mídia, logística
 * interna ou qualquer outra despesa da empresa.
 * ========================================================================= */

export type FinanceSource = 'demo' | 'real' | 'estimated'

/** Mesmas faixas de taxa usadas na Visão Geral (ChannelOverview) — mock para demonstração. */
const FEE_RATES: Record<Marketplace, number> = {
  'Mercado Livre': 0.175,
  'Shopee': 0.215,
  'Amazon': 0.13,
  'Loja Própria': 0.05,
}

/** Taxa de estorno/devolução por canal — variação em torno da média global de ~2,3% já usada na Visão Geral. */
const REFUND_RATES: Record<Marketplace, number> = {
  'Mercado Livre': 0.021,
  'Shopee': 0.029,
  'Amazon': 0.018,
  'Loja Própria': 0.012,
}

export interface MarketplaceFinance {
  marketplace: Marketplace
  grossRevenue: number
  fees: number
  refunds: number
  /** bruto - taxas - estornos. Não é lucro. */
  netValue: number
  /** líquido ÷ bruto × 100 */
  netEfficiencyPct: number
  source: FinanceSource
}

function buildBaseline(): MarketplaceFinance[] {
  return marketplaceMetrics.map((m) => {
    const grossRevenue = m.revenue
    const fees = Math.round(grossRevenue * FEE_RATES[m.marketplace])
    const refunds = Math.round(grossRevenue * REFUND_RATES[m.marketplace])
    const netValue = grossRevenue - fees - refunds
    return {
      marketplace: m.marketplace,
      grossRevenue,
      fees,
      refunds,
      netValue,
      netEfficiencyPct: Math.round((netValue / grossRevenue) * 1000) / 10,
      source: 'demo' as FinanceSource,
    }
  })
}

/** Baseline de 30 dias — mesma base temporal usada em toda a Visão Geral/Marketplaces. */
export const marketplaceFinance: MarketplaceFinance[] = buildBaseline()

/** Rescala o baseline de 30 dias para o período selecionado no topbar, mesma abordagem de scaleChannelOverview. */
export function scaleMarketplaceFinance(items: MarketplaceFinance[], period: PeriodOption): MarketplaceFinance[] {
  const scale = (period.days / BASELINE_DAYS) * period.jitter
  return items.map((m) => {
    const grossRevenue = Math.round(m.grossRevenue * scale)
    const fees = Math.round(m.fees * scale)
    const refunds = Math.round(m.refunds * scale)
    const netValue = grossRevenue - fees - refunds
    return {
      ...m,
      grossRevenue,
      fees,
      refunds,
      netValue,
      netEfficiencyPct: grossRevenue > 0 ? Math.round((netValue / grossRevenue) * 1000) / 10 : 0,
    }
  })
}

export interface FinanceOverview {
  grossRevenue: number
  fees: number
  refunds: number
  /** bruto - taxas - estornos. Não é lucro. */
  netValue: number
  netEfficiencyPct: number
  source: FinanceSource
}

/** Soma o comparativo por marketplace em um único total — KPIs, waterfall e tabela derivam todos daqui. */
export function buildFinanceOverview(items: MarketplaceFinance[]): FinanceOverview {
  const grossRevenue = items.reduce((s, m) => s + m.grossRevenue, 0)
  const fees = items.reduce((s, m) => s + m.fees, 0)
  const refunds = items.reduce((s, m) => s + m.refunds, 0)
  const netValue = grossRevenue - fees - refunds
  return {
    grossRevenue,
    fees,
    refunds,
    netValue,
    netEfficiencyPct: grossRevenue > 0 ? Math.round((netValue / grossRevenue) * 1000) / 10 : 0,
    source: items.every((m) => m.source === 'demo') ? 'demo' : items.some((m) => m.source === 'real') ? 'real' : 'estimated',
  }
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

function seeded(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

const marketplaces: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']
const typeWeights: { type: FinanceTransactionType; weight: number }[] = [
  { type: 'Venda', weight: 0.55 },
  { type: 'Comissão', weight: 0.2 },
  { type: 'Tarifa', weight: 0.1 },
  { type: 'Estorno', weight: 0.08 },
  { type: 'Devolução', weight: 0.05 },
  { type: 'Ajuste', weight: 0.02 },
]

function pickType(seed: number): FinanceTransactionType {
  const r = seeded(seed)
  let acc = 0
  for (const t of typeWeights) {
    acc += t.weight
    if (r <= acc) return t.type
  }
  return 'Venda'
}

/** Gera um extrato sintético e determinístico — mesma abordagem de generateDailyData em RevenueByChannelChart. */
function buildTransactions(count: number): FinanceTransaction[] {
  const list: FinanceTransaction[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - Math.floor(seeded(i * 7.13) * 30))
    const marketplace = marketplaces[Math.floor(seeded(i * 3.7) * marketplaces.length)]
    const type = pickType(i * 11.9)
    const gross = Math.round(60 + seeded(i * 5.3) * 640)
    const discountPct = type === 'Venda' ? 0 : type === 'Comissão' ? FEE_RATES[marketplace] : type === 'Tarifa' ? 0.03 : type === 'Ajuste' ? 0.01 : 1
    const discount = type === 'Estorno' || type === 'Devolução' ? gross : Math.round(gross * discountPct)
    const net = type === 'Estorno' || type === 'Devolução' ? -gross : gross - discount
    list.push({
      date: d.toISOString().split('T')[0],
      marketplace,
      type,
      identifier: `${marketplace.slice(0, 2).toUpperCase()}-${(100000 + i).toString().slice(-6)}`,
      gross: type === 'Estorno' || type === 'Devolução' ? -gross : gross,
      discount,
      net,
    })
  }
  return list.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export const financeTransactions: FinanceTransaction[] = buildTransactions(60)
