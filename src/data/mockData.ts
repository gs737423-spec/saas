import { BASELINE_DAYS, type PeriodOption } from '@/lib/periods'

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
  category: string
  marketplace: Marketplace
  revenue: number
  units: number
  stock: number
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
  { id: 1, name: 'Kit Skincare Premium 5 Peças', sku: 'SKN-PRM-005', category: 'Beleza', marketplace: 'Mercado Livre', revenue: 45200, units: 312, stock: 184, margin: 42, trend: 15.3, goalPct: 112, sharePct: 18.4 },
  { id: 2, name: 'Fone Bluetooth ANC Pro', sku: 'AUD-ANC-220', category: 'Eletrônicos', marketplace: 'Amazon', revenue: 38900, units: 245, stock: 96, margin: 35, trend: 22.1, goalPct: 97, sharePct: 15.8 },
  { id: 3, name: 'Camiseta Dry-Fit Pack 3un', sku: 'VST-DRY-3PK', category: 'Vestuário', marketplace: 'Shopee', revenue: 32100, units: 890, stock: 34, margin: 55, trend: 8.7, goalPct: 88, sharePct: 13.1 },
  { id: 4, name: 'Cadeira Ergonômica Home Office', sku: 'MOV-ERG-800', category: 'Móveis', marketplace: 'Loja Própria', revenue: 28400, units: 42, stock: 58, margin: 48, trend: -3.2, goalPct: 71, sharePct: 11.6 },
  { id: 5, name: 'Luminária LED Inteligente RGB', sku: 'ILU-RGB-114', category: 'Casa', marketplace: 'Mercado Livre', revenue: 24800, units: 198, stock: 240, margin: 38, trend: 31.5, goalPct: 104, sharePct: 10.1 },
  { id: 6, name: 'Mochila Executiva Couro Sintético', sku: 'BAG-EXE-042', category: 'Acessórios', marketplace: 'Shopee', revenue: 21300, units: 367, stock: 128, margin: 52, trend: 12.4, goalPct: 83, sharePct: 8.7 },
  { id: 7, name: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', category: 'Eletrônicos', marketplace: 'Amazon', revenue: 19700, units: 156, stock: 22, margin: 30, trend: -5.8, goalPct: 64, sharePct: 8.0 },
  { id: 8, name: 'Organizador de Mesa Modular', sku: 'ORG-MOD-021', category: 'Casa', marketplace: 'Loja Própria', revenue: 16500, units: 220, stock: 312, margin: 62, trend: 18.9, goalPct: 95, sharePct: 6.7 },
  { id: 9, name: 'Garrafa Térmica 1L Inox', sku: 'GRF-INX-100', category: 'Casa', marketplace: 'Mercado Livre', revenue: 14200, units: 445, stock: 176, margin: 45, trend: 6.1, goalPct: 79, sharePct: 5.8 },
  { id: 10, name: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', category: 'Eletrônicos', marketplace: 'Shopee', revenue: 11800, units: 134, stock: 12, margin: 40, trend: 42.3, goalPct: 118, sharePct: 4.8 },
  { id: 11, name: 'Tênis Casual Unissex Comfort', sku: 'CAL-CMF-055', category: 'Vestuário', marketplace: 'Shopee', revenue: 10400, units: 208, stock: 90, margin: 47, trend: 9.4, goalPct: 86, sharePct: 4.2 },
  { id: 12, name: 'Panela Antiaderente Cerâmica', sku: 'COZ-CER-018', category: 'Casa', marketplace: 'Mercado Livre', revenue: 9200, units: 176, stock: 41, margin: 51, trend: -8.1, goalPct: 68, sharePct: 3.7 },
]

export const productCategories = ['Beleza', 'Eletrônicos', 'Vestuário', 'Móveis', 'Casa', 'Acessórios'] as const

export interface CategoryPerf {
  category: string
  revenue: number
  sharePct: number
  trend: number
}

export const categoryPerformance: CategoryPerf[] = [
  { category: 'Beleza', revenue: 45200, sharePct: 20.2, trend: 15.3 },
  { category: 'Eletrônicos', revenue: 70400, sharePct: 31.4, trend: 11.8 },
  { category: 'Casa', revenue: 64700, sharePct: 28.9, trend: 7.2 },
  { category: 'Vestuário', revenue: 42500, sharePct: 19.0, trend: 9.1 },
  { category: 'Móveis', revenue: 28400, sharePct: 12.7, trend: -3.2 },
  { category: 'Acessórios', revenue: 21300, sharePct: 9.5, trend: 12.4 },
]

export interface ProductAlert {
  id: number
  product: string
  sku: string
  marketplace: Marketplace
  type: 'low_stock' | 'low_margin' | 'falling_sales'
  detail: string
}

export const productAlerts: ProductAlert[] = [
  { id: 1, product: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', marketplace: 'Shopee', type: 'low_stock', detail: 'Apenas 12 un. em estoque · ruptura em ~3 dias' },
  { id: 2, product: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', marketplace: 'Amazon', type: 'low_stock', detail: '22 un. restantes · giro alto' },
  { id: 3, product: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', marketplace: 'Amazon', type: 'low_margin', detail: 'Margem de 30% · abaixo da meta de 38%' },
  { id: 4, product: 'Panela Antiaderente Cerâmica', sku: 'COZ-CER-018', marketplace: 'Mercado Livre', type: 'falling_sales', detail: 'Vendas -8,1% no período · tendência de queda' },
  { id: 5, product: 'Cadeira Ergonômica Home Office', sku: 'MOV-ERG-800', marketplace: 'Loja Própria', type: 'falling_sales', detail: 'Vendas -3,2% · giro baixo (42 un.)' },
]

export interface ProductOpportunity {
  id: number
  product: string
  sku: string
  marketplace: Marketplace
  type: 'scale_investment' | 'price_adjust' | 'expand_channel'
  action: string
  detail: string
  potential: string
}

export const productOpportunities: ProductOpportunity[] = [
  { id: 1, product: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', marketplace: 'Shopee', type: 'scale_investment', action: 'Aumentar investimento', detail: 'Vendas +42,3% e meta em 118% · demanda acima da oferta', potential: '+R$ 6.400/mês' },
  { id: 2, product: 'Luminária LED Inteligente RGB', sku: 'ILU-RGB-114', marketplace: 'Mercado Livre', type: 'scale_investment', action: 'Escalar anúncios', detail: 'Crescimento +31,5% com margem saudável de 38%', potential: '+R$ 4.900/mês' },
  { id: 3, product: 'Cadeira Ergonômica Home Office', sku: 'MOV-ERG-800', marketplace: 'Loja Própria', type: 'price_adjust', action: 'Rever preço', detail: 'Meta em 71% e queda -3,2% · preço 12% acima da concorrência', potential: '+18% conversão' },
  { id: 4, product: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', marketplace: 'Amazon', type: 'price_adjust', action: 'Ajustar margem', detail: 'Margem 30% abaixo da meta · reposicionar para recuperar giro', potential: '+8 p.p. margem' },
  { id: 5, product: 'Kit Skincare Premium 5 Peças', sku: 'SKN-PRM-005', marketplace: 'Mercado Livre', type: 'expand_channel', action: 'Expandir canais', detail: 'Top de faturamento só no ML · potencial em Shopee e Amazon', potential: '+R$ 9.200/mês' },
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

export interface StockItem {
  id: number
  name: string
  sku: string
  marketplace: Marketplace
  stock: number
  coverageDays: number
  turnover: number
  status: 'ok' | 'low' | 'critical' | 'stalled'
}

export const stockItems: StockItem[] = [
  { id: 1, name: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', marketplace: 'Shopee', stock: 12, coverageDays: 3, turnover: 8.4, status: 'critical' },
  { id: 2, name: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', marketplace: 'Amazon', stock: 22, coverageDays: 6, turnover: 6.1, status: 'critical' },
  { id: 3, name: 'Camiseta Dry-Fit Pack 3un', sku: 'VST-DRY-3PK', marketplace: 'Shopee', stock: 34, coverageDays: 9, turnover: 5.3, status: 'low' },
  { id: 4, name: 'Panela Antiaderente Cerâmica', sku: 'COZ-CER-018', marketplace: 'Mercado Livre', stock: 41, coverageDays: 18, turnover: 2.1, status: 'low' },
  { id: 5, name: 'Fone Bluetooth ANC Pro', sku: 'AUD-ANC-220', marketplace: 'Amazon', stock: 96, coverageDays: 24, turnover: 3.2, status: 'ok' },
  { id: 6, name: 'Cadeira Ergonômica Home Office', sku: 'MOV-ERG-800', marketplace: 'Loja Própria', stock: 58, coverageDays: 82, turnover: 0.7, status: 'stalled' },
  { id: 7, name: 'Tênis Casual Unissex Comfort', sku: 'CAL-CMF-055', marketplace: 'Shopee', stock: 90, coverageDays: 27, turnover: 2.8, status: 'ok' },
  { id: 8, name: 'Mochila Executiva Couro Sintético', sku: 'BAG-EXE-042', marketplace: 'Shopee', stock: 128, coverageDays: 21, turnover: 3.5, status: 'ok' },
  { id: 9, name: 'Kit Skincare Premium 5 Peças', sku: 'SKN-PRM-005', marketplace: 'Mercado Livre', stock: 184, coverageDays: 35, turnover: 4.4, status: 'ok' },
  { id: 10, name: 'Garrafa Térmica 1L Inox', sku: 'GRF-INX-100', marketplace: 'Mercado Livre', stock: 176, coverageDays: 23, turnover: 3.9, status: 'ok' },
  { id: 11, name: 'Organizador de Mesa Modular', sku: 'ORG-MOD-021', marketplace: 'Loja Própria', stock: 312, coverageDays: 91, turnover: 1.1, status: 'stalled' },
  { id: 12, name: 'Luminária LED Inteligente RGB', sku: 'ILU-RGB-114', marketplace: 'Mercado Livre', stock: 240, coverageDays: 42, turnover: 3.0, status: 'ok' },
]

export interface RestockRecommendation {
  id: number
  product: string
  sku: string
  marketplace: Marketplace
  suggestedUnits: number
  reason: string
  urgency: 'alta' | 'média' | 'baixa'
}

export const restockRecommendations: RestockRecommendation[] = [
  { id: 1, product: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', marketplace: 'Shopee', suggestedUnits: 150, reason: 'Ruptura em ~3 dias · demanda em alta (+42,3%)', urgency: 'alta' },
  { id: 2, product: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', marketplace: 'Amazon', suggestedUnits: 120, reason: 'Giro alto e cobertura de apenas 6 dias', urgency: 'alta' },
  { id: 3, product: 'Camiseta Dry-Fit Pack 3un', sku: 'VST-DRY-3PK', marketplace: 'Shopee', suggestedUnits: 200, reason: 'Cobertura de 9 dias · pico de vendas recorrente', urgency: 'média' },
  { id: 4, product: 'Panela Antiaderente Cerâmica', sku: 'COZ-CER-018', marketplace: 'Mercado Livre', suggestedUnits: 60, reason: 'Cobertura de 18 dias e vendas em queda', urgency: 'baixa' },
]

export interface StockAlert {
  id: number
  product: string
  sku: string
  message: string
  type: 'ruptura' | 'parado' | 'excesso'
}

export const stockAlerts: StockAlert[] = [
  { id: 1, product: 'Porta-Retrato Digital Wi-Fi', sku: 'DEC-DIG-070', message: 'Ruptura estimada em 3 dias no ritmo de vendas atual', type: 'ruptura' },
  { id: 2, product: 'Smartwatch Fitness Tracker', sku: 'WCH-FIT-330', message: 'Ruptura estimada em 6 dias', type: 'ruptura' },
  { id: 3, product: 'Cadeira Ergonômica Home Office', sku: 'MOV-ERG-800', message: 'Sem giro relevante há 82 dias · capital parado', type: 'parado' },
  { id: 4, product: 'Organizador de Mesa Modular', sku: 'ORG-MOD-021', message: '312 un. em estoque com giro de apenas 1,1x · excesso', type: 'excesso' },
]

export interface ImportSourceStatus {
  marketplace: Marketplace
  status: 'conectado' | 'pendente' | 'erro' | 'atualizado'
  lastImport: string
  recordsImported: number
}

export const importSourceStatus: ImportSourceStatus[] = [
  { marketplace: 'Mercado Livre', status: 'atualizado', lastImport: '08/07/2026 09:14', recordsImported: 892 },
  { marketplace: 'Shopee', status: 'conectado', lastImport: '07/07/2026 18:32', recordsImported: 634 },
  { marketplace: 'Amazon', status: 'erro', lastImport: '07/07/2026 11:05', recordsImported: 321 },
  { marketplace: 'Loja Própria', status: 'pendente', lastImport: '06/07/2026 20:47', recordsImported: 245 },
]

export interface ImportRecord {
  id: number
  marketplace: Marketplace
  fileName: string
  date: string
  rows: number
  status: 'sucesso' | 'erro' | 'processando'
  errors?: number
}

export const importHistory: ImportRecord[] = [
  { id: 1, marketplace: 'Mercado Livre', fileName: 'pedidos_ml_out2025.xlsx', date: '08/07/2026 09:14', rows: 892, status: 'sucesso' },
  { id: 2, marketplace: 'Shopee', fileName: 'shopee_vendas_semana28.csv', date: '07/07/2026 18:32', rows: 634, status: 'sucesso' },
  { id: 3, marketplace: 'Amazon', fileName: 'amazon_orders_jul.xlsx', date: '07/07/2026 11:05', rows: 321, status: 'erro', errors: 4 },
  { id: 4, marketplace: 'Loja Própria', fileName: 'export_loja_propria.csv', date: '06/07/2026 20:47', rows: 245, status: 'sucesso' },
  { id: 5, marketplace: 'Mercado Livre', fileName: 'pedidos_ml_set2025.xlsx', date: '01/07/2026 08:20', rows: 851, status: 'sucesso' },
]

export type ChannelStatus = 'Saudável' | 'Atenção' | 'Crítico'

export interface MarketplaceMetrics {
  marketplace: Marketplace
  revenue: number
  orders: number
  avgTicket: number
  conversionPct: number
  sharePct: number
  trend: number
  margin: number
  status: ChannelStatus
}

export const marketplaceMetrics: MarketplaceMetrics[] = [
  { marketplace: 'Mercado Livre', revenue: 95000, orders: 892, avgTicket: 106.5, conversionPct: 5.2, sharePct: 44.2, trend: 11.8, margin: 38, status: 'Saudável' },
  { marketplace: 'Shopee', revenue: 60000, orders: 634, avgTicket: 94.6, conversionPct: 4.6, sharePct: 27.9, trend: 15.4, margin: 31, status: 'Saudável' },
  { marketplace: 'Amazon', revenue: 35000, orders: 321, avgTicket: 109.0, conversionPct: 3.8, sharePct: 16.3, trend: -2.1, margin: 34, status: 'Atenção' },
  { marketplace: 'Loja Própria', revenue: 25000, orders: 245, avgTicket: 102.0, conversionPct: 6.1, sharePct: 11.6, trend: 22.7, margin: 46, status: 'Saudável' },
]

export function getTopProductByMarketplace(mp: Marketplace): Product | undefined {
  return [...products].filter((p) => p.marketplace === mp).sort((a, b) => b.revenue - a.revenue)[0]
}

export interface MarketplaceOpportunity {
  id: number
  marketplace: Marketplace
  title: string
  detail: string
  potential: string
}

export const marketplaceOpportunities: MarketplaceOpportunity[] = [
  { id: 1, marketplace: 'Loja Própria', title: 'Canal com maior crescimento', detail: 'Receita própria cresceu 22,7% · menor dependência de taxas de marketplace', potential: '+R$ 5.500/mês' },
  { id: 2, marketplace: 'Amazon', title: 'Conversão abaixo da média', detail: 'Taxa de 3,8% vs 5,2% no Mercado Livre · revisar fichas de produto', potential: '+1,2 p.p. conversão' },
  { id: 3, marketplace: 'Shopee', title: 'Ticket médio pode subir', detail: 'Volume alto de pedidos com ticket 11% abaixo da média geral', potential: '+R$ 3.100/mês' },
]

export type ProductStatus = 'Saudável' | 'Atenção' | 'Crítico' | 'Parado'

export function getProductStatus(sku: string): ProductStatus {
  const stock = stockItems.find((s) => s.sku === sku)
  if (!stock) return 'Saudável'
  if (stock.status === 'critical') return 'Crítico'
  if (stock.status === 'stalled') return 'Parado'
  if (stock.status === 'low') return 'Atenção'
  return 'Saudável'
}

export interface ProductActivity {
  sku: string
  type: 'venda' | 'alerta' | 'avaliacao' | 'importacao' | 'campanha'
  message: string
  time: string
}

export const productActivity: ProductActivity[] = [
  { sku: 'DEC-DIG-070', type: 'alerta', message: 'Estoque crítico detectado · 12 un. restantes', time: 'Há 2h' },
  { sku: 'DEC-DIG-070', type: 'venda', message: '8 unidades vendidas na Shopee nas últimas 24h', time: 'Há 5h' },
  { sku: 'DEC-DIG-070', type: 'campanha', message: 'Campanha patrocinada pausada por orçamento esgotado', time: 'Há 9h' },
  { sku: 'DEC-DIG-070', type: 'importacao', message: 'Dados atualizados via importação Shopee', time: 'Ontem' },
  { sku: 'WCH-FIT-330', type: 'alerta', message: 'Margem abaixo da meta · revisar precificação', time: 'Há 6h' },
  { sku: 'WCH-FIT-330', type: 'avaliacao', message: '2 novas avaliações negativas na Amazon', time: 'Há 1 dia' },
  { sku: 'WCH-FIT-330', type: 'campanha', message: 'ROAS da campanha caiu para 1,8x na última semana', time: 'Há 2 dias' },
  { sku: 'MOV-ERG-800', type: 'alerta', message: 'Sem giro relevante há 82 dias', time: 'Há 3 dias' },
  { sku: 'MOV-ERG-800', type: 'venda', message: '1 unidade vendida na Loja Própria', time: 'Há 5 dias' },
  { sku: 'SKN-PRM-005', type: 'venda', message: '24 unidades vendidas no Mercado Livre', time: 'Há 3h' },
  { sku: 'SKN-PRM-005', type: 'avaliacao', message: 'Nova avaliação 5 estrelas recebida', time: 'Há 8h' },
  { sku: 'SKN-PRM-005', type: 'campanha', message: 'Campanha patrocinada com ROAS de 4,2x', time: 'Há 1 dia' },
]

function seedFromSku(sku: string): number {
  let h = 0
  for (let i = 0; i < sku.length; i++) h = (h * 31 + sku.charCodeAt(i)) >>> 0
  return h
}

export type TrendPeriod = '7D' | '30D' | '3M' | '12M'

const trendPeriodConfig: Record<TrendPeriod, { points: number; labelFn: (i: number) => string }> = {
  '7D': { points: 7, labelFn: (i) => ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'][i] },
  '30D': { points: 10, labelFn: (i) => `D${(i + 1) * 3}` },
  '3M': { points: 12, labelFn: (i) => `S${i + 1}` },
  '12M': { points: 12, labelFn: (i) => ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][i] },
}

export interface TrendPoint {
  label: string
  units: number
  revenue: number
}

export function getSalesTrend(sku: string, period: TrendPeriod = '30D'): TrendPoint[] {
  const seed = seedFromSku(sku)
  const { points, labelFn } = trendPeriodConfig[period]
  const avgTicket = 60 + (seed % 80)
  return Array.from({ length: points }, (_, i) => {
    const wave = Math.sin((seed % 100) / 15 + i * 0.55) * 0.5 + 0.5
    const units = Math.round(30 + wave * 70 + i * (period === '12M' ? 4 : 2))
    const revenue = Math.round(units * avgTicket)
    return { label: labelFn(i), units, revenue }
  })
}

export function getProductHealthSummary(product: Product, status: ProductStatus, stock: StockItem | undefined): string {
  const trendWord = product.trend >= 0 ? `crescendo ${product.trend}%` : `caindo ${Math.abs(product.trend)}%`
  if (status === 'Crítico' && stock) {
    return `Vendas ${trendWord}, mas estoque crítico com ruptura estimada em ${stock.coverageDays} dias — ação recomendada.`
  }
  if (status === 'Parado') {
    return `Produto sem giro relevante · vendas ${trendWord} · considerar promoção ou reposicionamento.`
  }
  if (status === 'Atenção') {
    return `Vendas ${trendWord}, estoque em nível de atenção · monitorar cobertura nos próximos dias.`
  }
  return `Produto saudável · vendas ${trendWord} · margem de ${product.margin}% dentro da meta.`
}

export interface ProductMarketplaceBreakdown {
  marketplace: Marketplace
  revenue: number
  orders: number
  margin: number
  avgTicket: number
}

export function getProductMarketplaceBreakdown(product: Product): ProductMarketplaceBreakdown[] {
  const others: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria'].filter((m) => m !== product.marketplace) as Marketplace[]
  const seed = seedFromSku(product.sku)
  const main: ProductMarketplaceBreakdown = {
    marketplace: product.marketplace,
    revenue: product.revenue,
    orders: product.units,
    margin: product.margin,
    avgTicket: Math.round((product.revenue / product.units) * 100) / 100,
  }
  const rest = others.map((m, i) => {
    const factor = 0.15 + ((seed >> (i * 3)) % 25) / 100
    const revenue = Math.round(product.revenue * factor)
    const orders = Math.max(1, Math.round(product.units * factor))
    return { marketplace: m, revenue, orders, margin: Math.max(10, product.margin - 5 - i * 3), avgTicket: Math.round((revenue / orders) * 100) / 100 }
  })
  return [main, ...rest].sort((a, b) => b.revenue - a.revenue)
}

export type InsightSeverity = 'Crítico' | 'Atenção' | 'Oportunidade' | 'Saudável'

export interface ProductInsight {
  label: string
  detail: string
  tone: 'positive' | 'warning' | 'danger'
  severity: InsightSeverity
  priority: number
}

export function getProductInsights(product: Product, stock: StockItem | undefined): ProductInsight[] {
  const insights: ProductInsight[] = []

  if (stock && stock.coverageDays <= 10) {
    insights.push({ label: 'Risco de ruptura', detail: `Cobertura de apenas ${stock.coverageDays} dias · repor com urgência para não perder vendas`, tone: 'danger', severity: 'Crítico', priority: 0 })
  }

  insights.push(
    product.trend >= 0
      ? { label: 'Crescimento consistente', detail: `Vendas +${product.trend}% no período · manter investimento atual em anúncios`, tone: 'positive', severity: 'Saudável', priority: 3 }
      : { label: 'Vendas em queda', detail: `Vendas ${product.trend}% no período · reduzir preço ou reforçar campanha para reverter a tendência`, tone: 'danger', severity: 'Crítico', priority: 1 }
  )

  if (product.margin < 35) {
    insights.push({ label: 'Risco de margem', detail: `Margem de ${product.margin}% abaixo do ideal para a categoria · revisar custos ou precificação`, tone: 'warning', severity: 'Atenção', priority: 2 })
  } else {
    insights.push({ label: 'Margem saudável', detail: `Margem de ${product.margin}% dentro da meta · produto pode receber mais tráfego`, tone: 'positive', severity: 'Oportunidade', priority: 3 })
  }

  if (stock) {
    if (stock.status === 'stalled') {
      insights.push({ label: 'Capital parado', detail: `Giro de ${stock.turnover}x indica necessidade de promoção ou liquidação`, tone: 'warning', severity: 'Atenção', priority: 2 })
    } else if (stock.coverageDays > 10) {
      insights.push({ label: 'Estoque sob controle', detail: `Cobertura de ${stock.coverageDays} dias · giro de ${stock.turnover}x dentro do esperado`, tone: 'positive', severity: 'Saudável', priority: 4 })
    }
  }

  if (product.goalPct < 90) {
    insights.push({ label: 'Oportunidade de marketing', detail: `Meta em ${product.goalPct}% · aumentar investimento em anúncios pode acelerar vendas`, tone: 'warning', severity: 'Oportunidade', priority: 3 })
  }

  insights.push({
    label: 'Dependência de canal',
    detail: `${product.sharePct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da receita concentrada em ${product.marketplace} · diversificar reduz risco`,
    tone: product.sharePct > 60 ? 'warning' : 'positive',
    severity: product.sharePct > 60 ? 'Atenção' : 'Saudável',
    priority: product.sharePct > 60 ? 2 : 4,
  })

  return insights.sort((a, b) => a.priority - b.priority)
}

export interface HealthScoreBreakdown {
  label: string
  score: number
  color: string
}

export interface ProductHealthScore {
  score: number
  status: ProductStatus
  breakdown: HealthScoreBreakdown[]
}

export function getProductHealthScore(product: Product, stock: StockItem | undefined, status: ProductStatus): ProductHealthScore {
  const vendas = Math.max(10, Math.min(100, 60 + product.trend * 1.5))
  const margem = Math.max(10, Math.min(100, (product.margin / 60) * 100))
  const estoque = stock ? Math.max(5, Math.min(100, (stock.coverageDays / 45) * 100)) : 70
  const marketing = Math.max(10, Math.min(100, product.goalPct))
  const reputacao = Math.max(20, Math.min(100, 100 - Math.abs(product.trend < 0 ? 25 : 5)))

  const breakdown: HealthScoreBreakdown[] = [
    { label: 'Vendas', score: Math.round(vendas), color: '#4C82F7' },
    { label: 'Margem', score: Math.round(margem), color: '#F5A524' },
    { label: 'Estoque', score: Math.round(estoque), color: '#22D3EE' },
    { label: 'Marketing', score: Math.round(marketing), color: '#9061F9' },
    { label: 'Reputação', score: Math.round(reputacao), color: '#16C784' },
  ]

  const score = Math.round(breakdown.reduce((s, b) => s + b.score, 0) / breakdown.length)
  return { score, status, breakdown }
}

export function getMarketplaceColor(mp: Marketplace): string {
  const colors: Record<Marketplace, string> = {
    'Mercado Livre': '#FFE600',
    'Shopee': '#EE4D2D',
    'Amazon': '#FF9900',
    'Loja Própria': '#3B82F6',
  }
  return colors[mp]
}

/* ============================================================================
 * VISÃO GERAL — camada executiva (E0)
 *
 * Métricas derivadas SOMENTE de dados que viriam direto dos marketplaces.
 * Sem CMV, margem real ou lucro real — esses dependem de custo de produto e
 * ficam para uma fase futura. O "faturamento líquido" aqui é ESTIMADO a partir
 * de taxas/encargos mockados; não é lucro.
 * ========================================================================= */

/**
 * Faixas de taxa/encargo por marketplace — apenas MOCK para demonstração.
 * Taxas reais variam por categoria, plano, modalidade de anúncio, frete,
 * parcelamento e promoções. Não tratar como regra oficial fixa.
 *  ML 16–19% · Shopee 20–22% · Amazon 10–15% · Loja Própria 3–6%
 */
const FEE_RATES: Record<Marketplace, number> = {
  'Mercado Livre': 0.175,
  'Shopee': 0.215,
  'Amazon': 0.13,
  'Loja Própria': 0.05,
}

export interface ChannelOverview extends MarketplaceMetrics {
  /** Faturamento líquido ESTIMADO (bruto − taxas). Não é lucro. */
  netRevenue: number
  /** Total retido pelo marketplace em R$ (mock). */
  fees: number
  /** Impacto de taxas em % do bruto. */
  feePct: number
  /** Participação no faturamento LÍQUIDO estimado. */
  netSharePct: number
  /** Eficiência líquida do canal (líquido ÷ bruto). */
  netEfficiencyPct: number
}

const _grossTotal = marketplaceMetrics.reduce((s, m) => s + m.revenue, 0)
const _withNet = marketplaceMetrics.map((m) => {
  const rate = FEE_RATES[m.marketplace]
  const fees = Math.round(m.revenue * rate)
  const netRevenue = m.revenue - fees
  return { ...m, fees, feePct: Math.round(rate * 1000) / 10, netRevenue }
})
const _netTotal = _withNet.reduce((s, m) => s + m.netRevenue, 0)

/** Comparativo por marketplace enriquecido com líquido estimado, taxas e participação. */
export const channelOverview: ChannelOverview[] = _withNet
  .map((m) => ({
    ...m,
    netSharePct: Math.round((m.netRevenue / _netTotal) * 1000) / 10,
    netEfficiencyPct: Math.round((m.netRevenue / m.revenue) * 1000) / 10,
  }))
  .sort((a, b) => b.netRevenue - a.netRevenue)

/**
 * Scales the 30-day channelOverview baseline to the globally-selected period
 * (topbar calendar dropdown). Revenue/orders/fees scale together so ratios
 * (ticket médio, %s) stay realistic — only totals move, same approach as
 * KPICards.resolveKpi. Recomputes netSharePct/netEfficiencyPct/avgTicket
 * from the scaled absolutes rather than scaling them directly (they're rates).
 */
export function scaleChannelOverview(items: ChannelOverview[], period: PeriodOption): ChannelOverview[] {
  const scale = (period.days / BASELINE_DAYS) * period.jitter
  const scaled = items.map((m) => {
    const revenue = Math.round(m.revenue * scale)
    const orders = Math.max(1, Math.round(m.orders * scale))
    const fees = Math.round(m.fees * scale)
    const netRevenue = revenue - fees
    return { ...m, revenue, orders, fees, netRevenue, avgTicket: Math.round((revenue / orders) * 100) / 100 }
  })
  const netTotal = scaled.reduce((s, m) => s + m.netRevenue, 0)
  return scaled.map((m) => ({
    ...m,
    netSharePct: Math.round((m.netRevenue / netTotal) * 1000) / 10,
    netEfficiencyPct: Math.round((m.netRevenue / m.revenue) * 1000) / 10,
  }))
}

/* --- KPIs globais da Visão Geral --------------------------------------- */

const _ordersTotal = marketplaceMetrics.reduce((s, m) => s + m.orders, 0)
const _feesTotal = _withNet.reduce((s, m) => s + m.fees, 0)
const _avgTicket = _grossTotal / _ordersTotal
/** Devoluções — estimativa de ~2.3% do bruto, consistente entre os canais. */
const _returnsTotal = _grossTotal * 0.023
const _returnsCount = Math.round(_ordersTotal * 0.018)

export type KpiTone = 'blue' | 'emerald' | 'cyan' | 'amber' | 'violet' | 'neutral'

export interface OverviewKpi {
  key: string
  label: string
  value: string
  /** Raw numeric value (30-day baseline) — scaled by the period selector. */
  raw: number
  /** true = totals that grow with the period (revenue, orders...). false = rates (ticket, efficiency). */
  scalesWithPeriod: boolean
  prefix?: string
  suffix?: string
  change: number
  /** Contexto curto sob o número. */
  context: string
  /** Micro-tag de transparência de dado (ex.: "estimado"). */
  tag?: string
  tone: KpiTone
  /** true = número âncora, ganha mais destaque visual. */
  hero?: boolean
}

export const overviewKpis: OverviewKpi[] = [
  {
    key: 'gross',
    label: 'Faturamento Bruto',
    value: _grossTotal.toLocaleString('pt-BR'),
    raw: _grossTotal,
    scalesWithPeriod: true,
    prefix: 'R$',
    change: 12.5,
    context: '',
    tone: 'cyan',
    hero: true,
  },
  {
    key: 'orders',
    label: 'Pedidos',
    value: _ordersTotal.toLocaleString('pt-BR'),
    raw: _ordersTotal,
    scalesWithPeriod: true,
    change: 8.3,
    context: 'Volume consolidado',
    tone: 'blue',
  },
  {
    key: 'ticket',
    label: 'Ticket Médio',
    value: _avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    raw: _avgTicket,
    scalesWithPeriod: false,
    prefix: 'R$',
    change: 3.8,
    context: 'Bruto por pedido',
    tone: 'violet',
  },
  {
    key: 'fees',
    label: 'Comissão',
    value: _feesTotal.toLocaleString('pt-BR'),
    raw: _feesTotal,
    scalesWithPeriod: true,
    prefix: 'R$',
    change: 1.4,
    context: `${Math.round((_feesTotal / _grossTotal) * 1000) / 10}% do bruto`,
    tag: 'estimado',
    tone: 'amber',
  },
  {
    key: 'returns',
    label: 'Devoluções',
    value: _returnsTotal.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
    raw: _returnsTotal,
    scalesWithPeriod: true,
    prefix: 'R$',
    change: -2.1,
    context: `${_returnsCount.toLocaleString('pt-BR')} pedidos`,
    tone: 'neutral',
  },
]

/* --- Selo de status de dados (faixa de confiança no cabeçalho) ---------- */

export type DataSignalStatus = 'ok' | 'pendente' | 'nao_conectado'

export interface ChannelDataSignal {
  marketplace: Marketplace
  status: DataSignalStatus
  label: string
}

const _importStatusMap: Record<ImportSourceStatus['status'], DataSignalStatus> = {
  atualizado: 'ok',
  conectado: 'ok',
  pendente: 'pendente',
  erro: 'pendente',
}

export const channelDataSignals: ChannelDataSignal[] = importSourceStatus.map((s) => ({
  marketplace: s.marketplace,
  status: _importStatusMap[s.status],
  label:
    _importStatusMap[s.status] === 'ok'
      ? 'ok'
      : _importStatusMap[s.status] === 'pendente'
        ? 'pendente'
        : 'não conectado',
}))

export const lastUpdatedLabel = 'há 8 min'

/* --- Resumo Executivo (frases por regra) ------------------------------- */

/** Conta produtos que exigem atenção: estoque crítico OU vendas em queda. */
export function getAttentionProductCount(): number {
  const skus = new Set<string>()
  stockItems.forEach((s) => {
    if (s.status === 'critical') skus.add(s.sku)
  })
  products.forEach((p) => {
    if (p.trend < 0) skus.add(p.sku)
  })
  return skus.size
}

export interface ExecutiveSummaryLine {
  text: string
  tone: 'neutral' | 'positive' | 'warning' | 'danger'
}

export function getExecutiveSummary(): ExecutiveSummaryLine[] {
  const byNet = [...channelOverview].sort((a, b) => b.netRevenue - a.netRevenue)
  const topNet = byNet[0]
  const bestTicket = [...channelOverview].sort((a, b) => b.avgTicket - a.avgTicket)[0]
  const highestFee = [...channelOverview].sort((a, b) => b.feePct - a.feePct)[0]
  const attention = getAttentionProductCount()

  return [
    {
      text: `${topNet.marketplace} concentra ${topNet.netSharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do faturamento líquido estimado.`,
      tone: topNet.netSharePct > 45 ? 'warning' : 'neutral',
    },
    {
      text: `${bestTicket.marketplace} tem o melhor ticket médio (R$ ${bestTicket.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}), mas ${bestTicket.sharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do volume.`,
      tone: 'neutral',
    },
    {
      text: `${highestFee.marketplace} tem o maior impacto de taxas: ${highestFee.feePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do bruto.`,
      tone: 'warning',
    },
    {
      text: `${attention} ${attention === 1 ? 'produto exige' : 'produtos exigem'} atenção (estoque crítico ou queda de vendas).`,
      tone: attention > 0 ? 'danger' : 'positive',
    },
  ]
}

/* --- Alertas executivos por regra -------------------------------------- */

export type ExecutiveAlertSeverity = 'danger' | 'warning' | 'info'

export interface ExecutiveAlert {
  id: string
  /** Regra que disparou o alerta (gatilho visível). */
  rule: string
  message: string
  severity: ExecutiveAlertSeverity
  marketplace?: Marketplace
  sku?: string
}

export function getExecutiveAlerts(): ExecutiveAlert[] {
  const alerts: ExecutiveAlert[] = []
  const avgTicket = _avgTicket
  const avgFeePct = channelOverview.reduce((s, m) => s + m.feePct, 0) / channelOverview.length

  // Canal com queda de faturamento
  channelOverview
    .filter((m) => m.trend < 0)
    .forEach((m) =>
      alerts.push({
        id: `drop-${m.marketplace}`,
        rule: 'Queda de faturamento no canal',
        message: `${m.marketplace}: faturamento ${m.trend.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% no período.`,
        severity: 'danger',
        marketplace: m.marketplace,
      })
    )

  // Canal com taxas/encargos acima da média
  channelOverview
    .filter((m) => m.feePct > avgFeePct + 2)
    .forEach((m) =>
      alerts.push({
        id: `fee-${m.marketplace}`,
        rule: 'Impacto de taxas acima da média',
        message: `${m.marketplace}: taxas consomem ${m.feePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do bruto, acima da média de ${avgFeePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%.`,
        severity: 'warning',
        marketplace: m.marketplace,
      })
    )

  // Canal com ticket abaixo da média geral
  channelOverview
    .filter((m) => m.avgTicket < avgTicket * 0.95)
    .forEach((m) =>
      alerts.push({
        id: `ticket-${m.marketplace}`,
        rule: 'Ticket médio abaixo da média',
        message: `${m.marketplace}: ticket R$ ${m.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} vs média R$ ${avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        severity: 'info',
        marketplace: m.marketplace,
      })
    )

  // Dependência alta de um marketplace (share líquido > 45%)
  channelOverview
    .filter((m) => m.netSharePct > 45)
    .forEach((m) =>
      alerts.push({
        id: `dep-${m.marketplace}`,
        rule: 'Dependência alta de um canal',
        message: `${m.netSharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do líquido em ${m.marketplace} — dependência alta de um único canal.`,
        severity: 'warning',
        marketplace: m.marketplace,
      })
    )

  // Produto em queda (pior tendência)
  const falling = [...products].filter((p) => p.trend < 0).sort((a, b) => a.trend - b.trend)[0]
  if (falling) {
    alerts.push({
      id: `prod-drop-${falling.sku}`,
      rule: 'Produto em queda',
      message: `${falling.name}: vendas ${falling.trend.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% no período.`,
      severity: 'warning',
      marketplace: falling.marketplace,
      sku: falling.sku,
    })
  }

  // Estoque crítico (ruptura iminente)
  stockItems
    .filter((s) => s.status === 'critical')
    .sort((a, b) => a.coverageDays - b.coverageDays)
    .forEach((s) =>
      alerts.push({
        id: `stock-${s.sku}`,
        rule: 'Estoque crítico',
        message: `${s.name}: ruptura estimada em ~${s.coverageDays} dias.`,
        severity: 'danger',
        marketplace: s.marketplace,
        sku: s.sku,
      })
    )

  // Marketplace com dados pendentes
  channelDataSignals
    .filter((s) => s.status !== 'ok')
    .forEach((s) =>
      alerts.push({
        id: `data-${s.marketplace}`,
        rule: 'Dados pendentes',
        message: `${s.marketplace}: dados ${s.label} — informação pode estar defasada.`,
        severity: 'info',
        marketplace: s.marketplace,
      })
    )

  const order: Record<ExecutiveAlertSeverity, number> = { danger: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => order[a.severity] - order[b.severity])
}

/* --- Destaques executivos (cards-veredito) ----------------------------- */

export interface ExecutiveHighlight {
  key: string
  label: string
  channel: Marketplace
  value: string
  detail: string
  tone: 'emerald' | 'violet' | 'blue' | 'cyan' | 'amber'
}

export function getExecutiveHighlights(): ExecutiveHighlight[] {
  const topNet = [...channelOverview].sort((a, b) => b.netRevenue - a.netRevenue)[0]
  const bestTicket = [...channelOverview].sort((a, b) => b.avgTicket - a.avgTicket)[0]
  const topVolume = [...channelOverview].sort((a, b) => b.orders - a.orders)[0]
  const lowestFee = [...channelOverview].sort((a, b) => a.feePct - b.feePct)[0]
  const attention =
    channelOverview.find((m) => m.status !== 'Saudável') ??
    [...channelOverview].sort((a, b) => a.trend - b.trend)[0]

  return [
    {
      key: 'net',
      label: 'Maior faturamento líquido',
      channel: topNet.marketplace,
      value: `R$ ${topNet.netRevenue.toLocaleString('pt-BR')}`,
      detail: `${topNet.netSharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do líquido total`,
      tone: 'emerald',
    },
    {
      key: 'ticket',
      label: 'Melhor ticket médio',
      channel: bestTicket.marketplace,
      value: `R$ ${bestTicket.avgTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      detail: `${bestTicket.sharePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}% do volume`,
      tone: 'violet',
    },
    {
      key: 'volume',
      label: 'Maior volume de pedidos',
      channel: topVolume.marketplace,
      value: topVolume.orders.toLocaleString('pt-BR'),
      detail: 'pedidos no período',
      tone: 'blue',
    },
    {
      key: 'fee',
      label: 'Menor impacto de taxas',
      channel: lowestFee.marketplace,
      value: `${lowestFee.feePct.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`,
      detail: 'do bruto em encargos',
      tone: 'cyan',
    },
    {
      key: 'attention',
      label: 'Canal com atenção',
      channel: attention.marketplace,
      value: attention.status,
      detail:
        attention.trend < 0
          ? `faturamento ${attention.trend.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
          : 'revisar desempenho',
      tone: 'amber',
    },
  ]
}

/* ============================================================================
 * ESTOQUE + CURVA ABC (E0) — camada unificada
 *
 * Une stockItems (giro/cobertura) + products (faturamento/share) por SKU,
 * mais dados operacionais de entrada/custo que viriam de ERP/planilha.
 * Custo aqui é operacional (custo unitário, custo de entrada) — NÃO é
 * margem ou lucro real. Essa página não trata de lucro.
 * ========================================================================= */

export type TurnoverStatus = 'Normal' | 'Lento' | 'Parado' | 'Parado crítico'

interface InventoryExtra {
  sku: string
  manufacturerCode: string
  lastEntryDate: string
  lastEntryQty: number
  cost: number
  lastEntryCost: number
  previousEntryCost: number
  turnoverStatus: TurnoverStatus
}

/** Dados operacionais mock — simulam import de ERP/planilha por SKU. */
const inventoryExtras: InventoryExtra[] = [
  { sku: 'SKN-PRM-005', manufacturerCode: 'FAB-10452', lastEntryDate: '28/06/2026', lastEntryQty: 200, cost: 84.03, lastEntryCost: 84.03, previousEntryCost: 84.03, turnoverStatus: 'Normal' },
  { sku: 'AUD-ANC-220', manufacturerCode: 'FAB-22890', lastEntryDate: '02/07/2026', lastEntryQty: 150, cost: 103.2, lastEntryCost: 103.2, previousEntryCost: 103.2, turnoverStatus: 'Normal' },
  { sku: 'VST-DRY-3PK', manufacturerCode: 'FAB-33107', lastEntryDate: '15/06/2026', lastEntryQty: 300, cost: 16.23, lastEntryCost: 16.23, previousEntryCost: 16.23, turnoverStatus: 'Normal' },
  { sku: 'MOV-ERG-800', manufacturerCode: 'FAB-40021', lastEntryDate: '10/04/2026', lastEntryQty: 40, cost: 351.62, lastEntryCost: 351.62, previousEntryCost: 351.62, turnoverStatus: 'Parado' },
  { sku: 'ILU-RGB-114', manufacturerCode: 'FAB-51334', lastEntryDate: '05/07/2026', lastEntryQty: 180, cost: 77.66, lastEntryCost: 77.66, previousEntryCost: 77.66, turnoverStatus: 'Normal' },
  { sku: 'BAG-EXE-042', manufacturerCode: 'FAB-60218', lastEntryDate: '20/06/2026', lastEntryQty: 150, cost: 27.86, lastEntryCost: 27.86, previousEntryCost: 27.86, turnoverStatus: 'Normal' },
  { sku: 'WCH-FIT-330', manufacturerCode: 'FAB-71905', lastEntryDate: '30/06/2026', lastEntryQty: 80, cost: 88.4, lastEntryCost: 96.1, previousEntryCost: 88.4, turnoverStatus: 'Normal' },
  { sku: 'ORG-MOD-021', manufacturerCode: 'FAB-80467', lastEntryDate: '22/03/2026', lastEntryQty: 250, cost: 28.5, lastEntryCost: 28.5, previousEntryCost: 28.5, turnoverStatus: 'Parado crítico' },
  { sku: 'GRF-INX-100', manufacturerCode: 'FAB-91023', lastEntryDate: '25/06/2026', lastEntryQty: 200, cost: 17.55, lastEntryCost: 17.55, previousEntryCost: 17.55, turnoverStatus: 'Normal' },
  { sku: 'DEC-DIG-070', manufacturerCode: 'FAB-13376', lastEntryDate: '10/06/2026', lastEntryQty: 100, cost: 52.83, lastEntryCost: 52.83, previousEntryCost: 52.83, turnoverStatus: 'Normal' },
  { sku: 'CAL-CMF-055', manufacturerCode: 'FAB-24689', lastEntryDate: '18/06/2026', lastEntryQty: 120, cost: 26.5, lastEntryCost: 26.5, previousEntryCost: 26.5, turnoverStatus: 'Normal' },
  { sku: 'COZ-CER-018', manufacturerCode: 'FAB-35542', lastEntryDate: '20/05/2026', lastEntryQty: 90, cost: 25.61, lastEntryCost: 27.9, previousEntryCost: 25.61, turnoverStatus: 'Lento' },
]

export interface InventoryItem {
  id: number
  sku: string
  name: string
  manufacturerCode: string
  marketplace: Marketplace
  stock: number
  units30d: number
  coverageDays: number
  turnover: number
  turnoverStatus: TurnoverStatus
  lastEntryDate: string
  lastEntryQty: number
  cost: number
  lastEntryCost: number
  previousEntryCost: number
  revenue: number
  sharePct: number
  abcClass: 'A' | 'B' | 'C'
  status: StockItem['status']
}

/** Curva ABC: A > 2% de share, B > 1%, C ≤ 1% — share sobre faturamento total da base. */
export function getABCClass(sharePct: number): 'A' | 'B' | 'C' {
  if (sharePct > 2) return 'A'
  if (sharePct > 1) return 'B'
  return 'C'
}

export interface CoverageStatus {
  label: string
  color: string
}

/** Cobertura tem cor funcional própria — cobertura alta nem sempre é boa (capital parado). */
export function getCoverageStatus(days: number): CoverageStatus {
  if (days <= 7) return { label: 'Crítico', color: '#F4436C' }
  if (days <= 20) return { label: 'Atenção', color: '#F5C24B' }
  if (days <= 45) return { label: 'Saudável', color: '#16C784' }
  return { label: 'Excesso', color: '#22D3EE' }
}

/** Status de giro é independente da cobertura — cor própria (roxo/laranja) pra não confundir. */
export const turnoverStatusStyle: Record<TurnoverStatus, { color: string; bg: string }> = {
  'Normal': { color: '#16C784', bg: 'rgba(22,199,132,0.12)' },
  'Lento': { color: '#F5A524', bg: 'rgba(245,165,36,0.12)' },
  'Parado': { color: '#9061F9', bg: 'rgba(144,97,249,0.12)' },
  'Parado crítico': { color: '#8B2942', bg: 'rgba(139,41,66,0.18)' },
}

export const inventoryItems: InventoryItem[] = stockItems.map((s) => {
  const product = products.find((p) => p.sku === s.sku)
  const extra = inventoryExtras.find((e) => e.sku === s.sku)!
  const revenue = product?.revenue ?? 0
  const sharePct = product?.sharePct ?? 0
  return {
    id: s.id,
    sku: s.sku,
    name: s.name,
    manufacturerCode: extra.manufacturerCode,
    marketplace: s.marketplace,
    stock: s.stock,
    units30d: product?.units ?? 0,
    coverageDays: s.coverageDays,
    turnover: s.turnover,
    turnoverStatus: extra.turnoverStatus,
    lastEntryDate: extra.lastEntryDate,
    lastEntryQty: extra.lastEntryQty,
    cost: extra.cost,
    lastEntryCost: extra.lastEntryCost,
    previousEntryCost: extra.previousEntryCost,
    revenue,
    sharePct,
    abcClass: getABCClass(sharePct),
    status: s.status,
  }
})

/** Valor estimado em estoque = Σ (estoque disponível × custo unitário). Dado operacional, não lucro. */
export function getEstimatedInventoryValue(): number {
  return inventoryItems.reduce((s, i) => s + i.stock * i.cost, 0)
}

/* --- Alertas inteligentes de estoque (E2, preparado em E0) -------------- */

export interface InventoryAlert {
  id: string
  rule: string
  message: string
  severity: 'danger' | 'warning' | 'info'
  sku: string
}

export function getInventoryAlerts(): InventoryAlert[] {
  const alertsList: InventoryAlert[] = []

  // Curva A com cobertura crítica
  inventoryItems
    .filter((i) => i.abcClass === 'A' && i.coverageDays <= 7)
    .forEach((i) =>
      alertsList.push({
        id: `abc-critical-${i.sku}`,
        rule: 'Curva A com cobertura crítica',
        message: `${i.name}: curva A com apenas ${i.coverageDays} dias de cobertura — prioridade máxima de reposição.`,
        severity: 'danger',
        sku: i.sku,
      })
    )

  // Alta venda + baixa cobertura (sem ser já curva A crítico acima)
  inventoryItems
    .filter((i) => i.units30d >= 200 && i.coverageDays <= 20 && !(i.abcClass === 'A' && i.coverageDays <= 7))
    .forEach((i) =>
      alertsList.push({
        id: `high-sales-low-cov-${i.sku}`,
        rule: 'Alta venda com baixa cobertura',
        message: `${i.name}: ${i.units30d} un. vendidas em 30 dias, cobertura de apenas ${i.coverageDays} dias.`,
        severity: 'warning',
        sku: i.sku,
      })
    )

  // Parado com estoque alto
  inventoryItems
    .filter((i) => (i.turnoverStatus === 'Parado' || i.turnoverStatus === 'Parado crítico') && i.stock >= 100)
    .forEach((i) =>
      alertsList.push({
        id: `stalled-high-stock-${i.sku}`,
        rule: 'Estoque parado com volume alto',
        message: `${i.name}: ${i.turnoverStatus.toLowerCase()}, ${i.stock} un. em estoque — capital parado.`,
        severity: 'warning',
        sku: i.sku,
      })
    )

  // Sem entrada recente (> 60 dias, aproximado por parse de data)
  inventoryItems
    .filter((i) => {
      const [d, m, y] = i.lastEntryDate.split('/').map(Number)
      const entryDate = new Date(y, m - 1, d)
      const refDate = new Date(2026, 6, 10)
      const days = Math.round((refDate.getTime() - entryDate.getTime()) / 86400000)
      return days > 60
    })
    .forEach((i) =>
      alertsList.push({
        id: `no-recent-entry-${i.sku}`,
        rule: 'Sem entrada recente',
        message: `${i.name}: última entrada em ${i.lastEntryDate} — mais de 60 dias sem reposição.`,
        severity: 'info',
        sku: i.sku,
      })
    )

  // Custo da última entrada maior que o custo anterior
  inventoryItems
    .filter((i) => i.lastEntryCost > i.previousEntryCost)
    .forEach((i) =>
      alertsList.push({
        id: `cost-up-${i.sku}`,
        rule: 'Custo da última entrada subiu',
        message: `${i.name}: custo de entrada foi de R$ ${i.previousEntryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para R$ ${i.lastEntryCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}.`,
        severity: 'warning',
        sku: i.sku,
      })
    )

  // Excesso de estoque (cobertura > 45 dias)
  inventoryItems
    .filter((i) => i.coverageDays > 45)
    .forEach((i) =>
      alertsList.push({
        id: `excess-${i.sku}`,
        rule: 'Excesso de estoque',
        message: `${i.name}: cobertura de ${i.coverageDays} dias — estoque acima do necessário.`,
        severity: 'info',
        sku: i.sku,
      })
    )

  // Ruptura prevista (crítico)
  inventoryItems
    .filter((i) => i.status === 'critical')
    .forEach((i) =>
      alertsList.push({
        id: `rupture-${i.sku}`,
        rule: 'Ruptura prevista',
        message: `${i.name}: ruptura estimada em ~${i.coverageDays} dias no ritmo atual de vendas.`,
        severity: 'danger',
        sku: i.sku,
      })
    )

  const order: Record<InventoryAlert['severity'], number> = { danger: 0, warning: 1, info: 2 }
  return alertsList.sort((a, b) => order[a.severity] - order[b.severity])
}
