import { ArrowRight } from 'lucide-react'
import { marketplaceIntegrations } from '@/site/data/marketplaces'
import MarketplaceIntegrationCard from '@/site/components/MarketplaceIntegrationCard'

// Marketplaces — integration wall, família CLARA (referência §20 do brief).
// Substitui o diagrama com símbolo "V" central e linhas diagonais por
// módulos brancos grandes em grid 2×2, sem marquee.
export default function MarketplacesSection() {
  return (
    <section id="marketplaces" aria-label="Marketplaces atendidos" className="mp-section scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center lg:gap-8">
          <div className="lg:col-span-4">
            <span className="site-label mb-3" style={{ color: 'var(--vintec-blue-700)' }}>Marketplaces atendidos</span>
            <h2 className="font-extrabold" style={{ color: 'var(--vintec-text)', fontSize: 'clamp(1.9rem, 3vw, 2.4rem)', lineHeight: 1.12, letterSpacing: '-0.02em' }}>
              Conecte os marketplaces em que sua empresa já vende.
            </h2>
            <p className="mt-4" style={{ color: 'var(--vintec-text-soft)', fontSize: '1rem', lineHeight: 1.6 }}>
              A Vintec reúne Mercado Livre, Amazon, Shopee e Leroy Merlin para que pedidos, estoque e resultados sejam acompanhados sem depender de informações espalhadas.
            </p>
            <a href="#como-funciona" className="mt-6 inline-flex items-center gap-2 text-[14px] font-semibold hover:underline" style={{ color: 'var(--vintec-blue-700)' }}>
              Veja como funciona a conexão <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-8">
            {marketplaceIntegrations.map((item) => (
              <MarketplaceIntegrationCard key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
