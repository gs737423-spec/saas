export type Marketplace = 'Mercado Livre' | 'Shopee' | 'Amazon' | 'Loja Própria'

export interface KPI {
  label: string
  value: string
  change: number
  prefix?: string
  suffix?: string
}

export interface RevenueMonth {
  month: string
  mercadoLivre: number
  shopee: number
  amazon: number
  lojaPropria: number
  total: number
}

export interface Product {
  id: number
  name: string
  sku: string
  marketplace: Marketplace
  revenue: number
  units: number
  margin: number
  trend: number
  goalPct: number
  sharePct: number
}

export interface Opportunity {
  id: number
  title: string
  description: string
  marketplace: Marketplace
  type: 'price_gap' | 'trending' | 'stock_alert' | 'competitor'
  impact: 'high' | 'medium' | 'low'
}

export interface Alert {
  id: number
  message: string
  type: 'warning' | 'info' | 'success' | 'danger'
  marketplace: Marketplace
  time: string
}

export interface MarketplaceConnection {
  name: Marketplace
  connected: boolean
  lastSync: string
  products: number
  orders: number
}

export const kpis: KPI[] = [
  { label: 'Receita Total', value: '284.520', change: 12.5, prefix: 'R$' },
  { label: 'Pedidos', value: '1.847', change: 8.3 },
  { label: 'Ticket Médio', value: '154,02', change: 3.8, prefix: 'R$' },
  { label: 'Taxa de Conversão', value: '4,7', change: -0.5, suffix: '%' },
]

export const revenueData: RevenueMonth[] = [
  { month: 'Jan', mercadoLivre: 42000, shopee: 18000, amazon: 12000, lojaPropria: 8000, total: 80000 },
  { month: 'Fev', mercadoLivre: 45000, shopee: 20000, amazon: 14000, lojaPropria: 9500, total: 88500 },
  { month: 'Mar', mercadoLivre: 48000, shopee: 22000, amazon: 15000, lojaPropria: 11000, total: 96000 },
  { month: 'Abr', mercadoLivre: 51000, shopee: 25000, amazon: 16500, lojaPropria: 12000, total: 104500 },
  { month: 'Mai', mercadoLivre: 55000, shopee: 28000, amazon: 18000, lojaPropria: 13000, total: 114000 },
  { month: 'Jun', mercadoLivre: 58000, shopee: 31000, amazon: 19500, lojaPropria: 14500, total: 123000 },
  { month: 'Jul', mercadoLivre: 62000, shopee: 34000, amazon: 21000, lojaPropria: 15500, total: 132500 },
  { month: 'Ago', mercadoLivre: 60000, shopee: 32000, amazon: 20000, lojaPropria: 15000, total: 127000 },
  { month: 'Set', mercadoLivre: 65000, shopee: 36000, amazon: 22000, lojaPropria: 16000, total: 139000 },
  { month: 'Out', mercadoLivre: 70000, shopee: 40000, amazon: 24000, lojaPropria: 17500, total: 151500 },
  { month: 'Nov', mercadoLivre: 85000, shopee: 52000, amazon: 30000, lojaPropria: 22000, total: 189000 },
  { month: 'Dez', mercadoLivre: 95000, shopee: 60000, amazon: 35000, lojaPropria: 25000, total: 215000 },
]

export const products: Product[] = [
  { id: 1, name: 'Kit Skincare Premium 5 Peças', sku: 'SKN-PRM-005', marketplace: 'Mercado Livre', revenue: 45200, units: 312, margin: 42, trend: 15.3, goalPct: 112, sharePct: 18.4 },
  { id: 2, name: 'Fone Bluetooth ANC Pro', sku: 'AUD-ANC-220', marketplace: 'Amazon', revenue: 38900, units: 245, margin: 35, trend: 22.1, goalPct: 97, sharePct: 15.8 },
  { id: 3, name: 'Camiseta Dry-Fit Pack 3un', sku: 'VST-DRY-3PK', marketplace: 'Shopee', revenue: 32100, units: 890, margin: 55, trend: 8.7, goalPct: 88, sharePct: 13.1 },
  { id: 4, name: 'Cadeira Ergonômica Home Office', sku: 'MOV-ERG-800', marketplace: 'Loja Própria', revenue: 28400, units: 42, margin: 48, trend: -3.2, goalPct: 71, sharePct: 11.6 },
  { id: 5, name: 'Luminária LED Inteligente RGB', sku: 'ILU-RGB-114', marketplace: 'Mercado Livre', revenue: 24800, units: 198, margin: 38, trend: 31.5, goalPct: 104, sharePct: 10.1 },
  { id: 6, name: 'Mochila Executiva Couro Sintético', sku: 'BAG-EXE-042', marketplace: 'Shopee', revenue: 21300, units: 367, margin: 52, trend: 12.4, goalPct: 83, sharePct: 8.7 },
  { id: 7, name: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', marketplace: 'Amazon', revenue: 19700, units: 156, margin: 30, trend: -5.8, goalPct: 64, sharePct: 8.0 },
  { id: 8, name: 'Organizador de Mesa Modular', sku: 'ORG-MOD-021', marketplace: 'Loja Própria', revenue: 16500, units: 220, margin: 62, trend: 18.9, goalPct: 95, sharePct: 6.7 },
  { id: 9, name: 'Garrafa Térmica 1L Inox', sku: 'GRF-INX-100', marketplace: 'Mercado Livre', revenue: 14200, units: 445, margin: 45, trend: 6.1, goalPct: 79, sharePct: 5.8 },
  { id: 10, name: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', marketplace: 'Shopee', revenue: 11800, units: 134, margin: 40, trend: 42.3, goalPct: 118, sharePct: 4.8 },
]

export interface PerformanceSummary {
  label: string
  primary: string
  secondary: string
  change: number
  tone: 'blue' | 'emerald' | 'amber' | 'rose'
  kind: 'top' | 'growth' | 'stock' | 'loss'
}

export const performanceSummary: PerformanceSummary[] = [
  { label: 'Top Produto', primary: 'Kit Skincare Premium', secondary: 'R$ 45.200 · 18,4% do total', change: 15.3, tone: 'blue', kind: 'top' },
  { label: 'Maior Crescimento', primary: 'Porta-Retrato Digital', secondary: 'R$ 11.800 em receita', change: 42.3, tone: 'emerald', kind: 'growth' },
  { label: 'Estoque Crítico', primary: '3 produtos', secondary: 'Ruptura prevista em ≤ 5 dias', change: -12, tone: 'amber', kind: 'stock' },
  { label: 'Perdas / Oportunidades', primary: 'R$ 8.400', secondary: 'Gap de preço + concorrência', change: -6.5, tone: 'rose', kind: 'loss' },
]

export const opportunities: Opportunity[] = [
  { id: 1, title: 'Gap de preço detectado', description: 'Kit Skincare Premium está 23% mais barato na Shopee vs seu preço no Mercado Livre. Oportunidade de equalizar.', marketplace: 'Shopee', type: 'price_gap', impact: 'high' },
  { id: 2, title: 'Categoria em alta', description: '"Home Office Ergonômico" cresceu 145% em buscas na Amazon nos últimos 30 dias.', marketplace: 'Amazon', type: 'trending', impact: 'high' },
  { id: 3, title: 'Estoque baixo', description: 'Camiseta Dry-Fit Pack está com apenas 34 unidades. Previsão de ruptura em 5 dias.', marketplace: 'Shopee', type: 'stock_alert', impact: 'medium' },
  { id: 4, title: 'Concorrente baixou preço', description: 'Concorrente principal reduziu Fone ANC em 18%. Considere ajustar estratégia.', marketplace: 'Amazon', type: 'competitor', impact: 'high' },
  { id: 5, title: 'Nicho inexplorado', description: 'Produtos de "organização minimalista" têm baixa concorrência e alta demanda na sua Loja Própria.', marketplace: 'Loja Própria', type: 'trending', impact: 'medium' },
]

export const alerts: Alert[] = [
  { id: 1, message: 'Fone Bluetooth ANC Pro recebeu 3 avaliações negativas nas últimas 24h', type: 'danger', marketplace: 'Amazon', time: '2 min atrás' },
  { id: 2, message: 'Receita da Shopee superou meta mensal em 12%', type: 'success', marketplace: 'Shopee', time: '1h atrás' },
  { id: 3, message: 'Novo concorrente detectado na categoria Skincare no Mercado Livre', type: 'warning', marketplace: 'Mercado Livre', time: '3h atrás' },
  { id: 4, message: 'Atualização de taxas do Mercado Livre entra em vigor em 15 dias', type: 'info', marketplace: 'Mercado Livre', time: '5h atrás' },
  { id: 5, message: 'Loja Própria atingiu 500 visitantes únicos hoje — novo recorde', type: 'success', marketplace: 'Loja Própria', time: '6h atrás' },
]

export const marketplaceConnections: MarketplaceConnection[] = [
  { name: 'Mercado Livre', connected: true, lastSync: 'Há 5 min', products: 127, orders: 892 },
  { name: 'Shopee', connected: true, lastSync: 'Há 12 min', products: 98, orders: 634 },
  { name: 'Amazon', connected: true, lastSync: 'Há 8 min', products: 64, orders: 321 },
  { name: 'Loja Própria', connected: true, lastSync: 'Tempo real', products: 156, orders: 245 },
]

export function getMarketplaceColor(mp: Marketplace): string {
  const colors: Record<Marketplace, string> = {
    'Mercado Livre': '#FFE600',
    'Shopee': '#EE4D2D',
    'Amazon': '#FF9900',
    'Loja Própria': '#3B82F6',
  }
  return colors[mp]
}
