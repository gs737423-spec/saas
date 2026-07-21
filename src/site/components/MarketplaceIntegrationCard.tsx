import type { MarketplaceIntegration } from '@/site/data/marketplaces'

// Módulo branco de integração — logo oficial grande + label + descrição curta.
// Sem caixa extra ao redor da logo, sem recolorir, sem sigla improvisada.
export default function MarketplaceIntegrationCard({ item }: { item: MarketplaceIntegration }) {
  return (
    <div className="mp-module">
      <span className="mp-module__bar" aria-hidden="true" />
      <img src={item.logoSrc} alt={item.name} style={{ height: item.logoH * 1.15, maxWidth: 168 }} />
      <span className="mp-module__label">Conexão direta</span>
      <p className="mp-module__desc">{item.description}</p>
    </div>
  )
}
