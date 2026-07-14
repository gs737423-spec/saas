import { ArrowRight, MessageCircle } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { specialistHref } from '@/site/content'

// Faixa curta de transição para a conversão — não uma nova tela grande.
export default function FinalCta() {
  return (
    <section style={{ background: 'var(--s-surface)' }}>
      <div className="site-container py-6">
        <div className="site-dark relative overflow-hidden" style={{ borderRadius: 'var(--s-radius-block)', minHeight: 300 }}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{ background: 'radial-gradient(700px 340px at 85% 120%, rgba(18,185,129,0.12), transparent 60%)' }}
          />
          {/* Assinatura gráfica — linhas de conexão discretas, some no lado direito */}
          <svg aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-1/2 opacity-[0.16] md:block" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
            <circle cx="360" cy="150" r="3" fill="#6FA0FF" />
            <path d="M40 60 L200 60 L240 100 L360 100" fill="none" stroke="#4C82F7" strokeWidth="1" />
            <path d="M40 150 L220 150 L260 150 L360 150" fill="none" stroke="#4C82F7" strokeWidth="1" />
            <path d="M40 240 L200 240 L240 200 L360 200" fill="none" stroke="#4C82F7" strokeWidth="1" />
            <circle cx="40" cy="60" r="2.5" fill="#6FA0FF" /><circle cx="40" cy="150" r="2.5" fill="#6FA0FF" /><circle cx="40" cy="240" r="2.5" fill="#6FA0FF" />
          </svg>
          <div className="relative flex h-full flex-col justify-center px-6 py-14 md:px-14 md:py-16" style={{ minHeight: 300 }}>
            <Reveal className="max-w-2xl">
              <h2 className="site-h2" style={{ color: 'var(--s-dark-ink)', fontSize: 'clamp(1.7rem, 3.6vw, 2.6rem)' }}>
                Sua operação vende em vários canais.
                <br />
                <span style={{ color: 'var(--s-blue-bright)' }}>A gestão precisa acontecer em uma única visão.</span>
              </h2>
              <p className="site-lead mt-4" style={{ color: 'var(--s-dark-muted)' }}>
                Conecte seus marketplaces e acompanhe os principais indicadores da operação em um único lugar.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
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
          </div>
        </div>
      </div>
    </section>
  )
}
