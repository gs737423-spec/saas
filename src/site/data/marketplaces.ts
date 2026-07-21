// Módulos de integração (MarketplacesSection) — reaproveita nome/logo/altura
// de `@/site/content` (fonte única dos assets de marca) e só adiciona a
// descrição institucional de cada módulo.
import { marketplaces, type MarketplaceItem } from '@/site/content'

export interface MarketplaceIntegration extends MarketplaceItem {
  description: string
}

const descriptions: Record<string, string> = {
  'Mercado Livre': 'Acompanhe pedidos, estoque e resultados do marketplace com menos controles paralelos.',
  Amazon: 'Reúna as informações da Amazon na mesma rotina utilizada para acompanhar os outros marketplaces.',
  Shopee: 'Evite consultar o canal separadamente toda vez que precisar entender vendas ou pedidos.',
  'Leroy Merlin': 'Acompanhe o canal junto aos demais marketplaces em que sua empresa opera.',
}

export const marketplaceIntegrations: MarketplaceIntegration[] = marketplaces.map((m) => ({
  ...m,
  description: descriptions[m.name] ?? '',
}))
