import { ArrowRight, MessageCircle } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import BrowserFrame from '@/site/components/BrowserFrame'
import { specialistHref } from '@/site/content'

export default function FinalCta() {
  return (
    <section style={{ background: 'var(--s-surface)' }}>
      <div className="site-container py-6">
        <div className="site-dark relative overflow-hidden" style={{ borderRadius: 'var(--s-radius-block)' }}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(700px 340px at 85% 120%, rgba(18,185,129,0.12), transparent 60%)' }}
          />
          <div className="relative grid items-center gap-10 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:px-14 md:py-20">
            <Reveal>
              <h2 className="site-h2" style={{ color: 'var(--s-dark-ink)' }}>
                Sua operação já vende em diferentes canais.
                <br />
                <span style={{ color: 'var(--s-blue-bright)' }}>Agora ela precisa de uma visão única.</span>
              </h2>
              <p className="site-lead mt-5" style={{ color: 'var(--s-dark-muted)' }}>
                Centralize os dados dos seus marketplaces e transforme números separados em decisões mais claras.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#demonstracao" className="btn btn-primary">
                  Solicitar demonstração <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href={specialistHref()}
                  className="btn btn-on-dark"
                  {...(specialistHref().startsWith('http') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  <MessageCircle className="h-4 w-4" /> Falar com um especialista
                </a>
              </div>
            </Reveal>
            <Reveal delay={120} className="hidden md:block">
              <BrowserFrame
                src="/site/dashboard-overview.webp"
                alt="Visão Geral consolidada da operação na Acelera Intelligence"
                caption="Visão Geral consolidada da operação"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
