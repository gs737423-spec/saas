// Módulos de integração (MarketplacesSection) — reaproveita nome/logo/altura
// de `@/site/content` (fonte única dos assets de marca) e só adiciona
// título curto + frase prática por marketplace.
import { marketplaces, type MarketplaceItem } from '@/site/content'

export interface MarketplaceIntegration extends MarketplaceItem {
  title: string
  description: string
}

const copy: Record<string, { title: string; description: string }> = {
  'Mercado Livre': { title: 'Pedidos e estoque acompanhados', description: 'Consulte os principais movimentos do marketplace junto aos demais canais.' },
  Amazon: { title: 'Resultados na mesma rotina', description: 'Compare vendas e desempenho sem alternar entre diferentes painéis.' },
  Shopee: { title: 'Menos consultas separadas', description: 'Acompanhe pedidos e vendas sem reconstruir as informações manualmente.' },
  'Leroy Merlin': { title: 'Mais controle sobre o canal', description: 'Visualize o desempenho junto aos outros marketplaces em que a empresa vende.' },
}

export const marketplaceIntegrations: MarketplaceIntegration[] = marketplaces.map((m) => ({
  ...m,
  title: copy[m.name]?.title ?? '',
  description: copy[m.name]?.description ?? '',
}))
