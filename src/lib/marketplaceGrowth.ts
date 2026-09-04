import type { MarketplaceGrowth } from '@/data/financeShapes'

export type MarketplaceGrowthStatus = 'up' | 'down' | 'stable' | 'unavailable'

export interface MarketplaceGrowthPresentation {
  status: MarketplaceGrowthStatus
  label: string
}

/** O selo resume a comparação menos ruidosa disponível. D-7 é preferido a
 * D-1 para não classificar um canal por uma oscilação de apenas um dia. */
export function getMarketplaceGrowthPresentation(growth: MarketplaceGrowth): MarketplaceGrowthPresentation {
  const signal = [growth.d7, growth.d30, growth.d1, growth.d365].find((value) => value !== null)
  if (signal === undefined) return { status: 'unavailable', label: 'Sem base' }
  if (signal > 2) return { status: 'up', label: 'Em alta' }
  if (signal < -2) return { status: 'down', label: 'Em queda' }
  return { status: 'stable', label: 'Estável' }
}
