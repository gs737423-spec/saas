import { marketplaces } from '@/site/content'

// Faixa institucional única com os 4 marketplaces — substitui os balões
// flutuantes do hero. Fica estável nos 3 slides (não troca, não é
// position:absolute, não orbita a pessoa). Evita layout shift e mantém a
// prova de integração sempre visível.
export default function MarketplaceRail() {
  return (
    <div className="mp-rail-wrap">
      <span className="mp-rail-label">Integrações diretas</span>
      <div className="mp-rail">
        {marketplaces.map((m) => (
          <div key={m.name} className="mp-rail__cell" title={m.name}>
            <img src={m.logoSrc} alt={m.name} style={{ height: m.logoH * 0.72, maxWidth: 100 }} />
          </div>
        ))}
      </div>
    </div>
  )
}
