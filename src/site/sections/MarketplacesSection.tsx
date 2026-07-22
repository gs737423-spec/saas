import { ArrowRight } from 'lucide-react'
import { marketplaceIntegrations } from '@/site/data/marketplaces'
import MarketplaceIntegrationCard from '@/site/components/MarketplaceIntegrationCard'

const results = [
  'Pedidos reunidos',
  'Estoque acompanhado',
  'Resultados comparáveis',
]

// Marketplaces — composição editorial em duas colunas: texto + CTA à
// esquerda, UMA superfície com os 4 marketplaces (grid 2×2, divisores
// internos, sem espaço entre células) à direita. Fundo claro azulado.
export default function MarketplacesSection() {
  return (
    <section id="marketplaces" aria-label="Marketplaces atendidos" className="mp-section scroll-mt-24">
      <div className="site-container site-container--tight" style={{ maxWidth: 1220, paddingTop: 96, paddingBottom: 96 }}>
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-5">
            <span className="mp-marker" aria-hidden="true" />
            <span className="mb-3 mt-3 block text-[12.5px] font-bold uppercase" style={{ color: '#2F6BFF', letterSpacing: '0.14em' }}>
              MARKETPLACES CONECTADOS
            </span>
            <h2 className="font-extrabold" style={{ color: '#13243B', fontSize: 'clamp(1.9rem, 2.6vw, 2.5rem)', lineHeight: 1.18, letterSpacing: '-0.02em', maxWidth: 460 }}>
              Acompanhe seus marketplaces sem abrir cada painel separadamente.
            </h2>
            <p className="mt-4" style={{ color: '#53657A', fontSize: '1rem', lineHeight: 1.6, maxWidth: '42ch' }}>
              Mercado Livre, Amazon, Shopee e Leroy Merlin passam a fazer parte da mesma rotina de acompanhamento. Assim, sua equipe consulta pedidos, estoque, vendas e resultados sem procurar informações em diferentes acessos.
            </p>
            <a href="#como-funciona" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold hover:underline" style={{ color: '#2F6BFF' }}>
              Veja como a Vintec organiza seus marketplaces <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="lg:col-span-7">
            <div className="mp-surface">
              {marketplaceIntegrations.map((item) => (
                <MarketplaceIntegrationCard key={item.name} item={item} />
              ))}
            </div>
            <p className="mp-note">Conexões realizadas conforme a disponibilidade de integração de cada marketplace.</p>
            <div className="mp-results">
              {results.map((r) => (
                <span key={r} className="mp-results__item"><span className="mp-results__dot" aria-hidden="true" />{r}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
