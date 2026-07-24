import type { MarketplaceIntegration } from '@/site/data/marketplaces'

// Célula da composição única de marketplaces — sem borda/sombra própria (os
// divisores vêm do grid pai .mp-surface). Logo + título curto + frase.
export default function MarketplaceIntegrationCard({ item }: { item: MarketplaceIntegration }) {
  return (
    <div className="mp-cell">
      <img src={item.logoSrc} alt={item.name} className="mp-cell__logo" style={{ height: item.logoH * 1.1, maxWidth: 148 }} />
      <h3 className="mp-cell__title">{item.title}</h3>
      <p className="mp-cell__desc">{item.description}</p>
    </div>
  )
}
