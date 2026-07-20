import { Check, Boxes, ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { platformCard as c, platformAside as aside, platformSectionTitle, platformSectionSubtitle, specialistHref } from '@/site/content'

// 4ª seção — UM único card vertical (estrutura da referência Petina). À esquerda
// o card; à direita, conteúdo institucional complementar (NÃO outro card).
// Sem print de dashboard aqui (o print vai na seção de prévia).
export default function PlatformCardSection() {
  const waHref = specialistHref('Olá! Quero conhecer a plataforma Vintec.')
  return (
    <section id="servicos" className="vt-light scroll-mt-24">
      <div className="site-container site-container--tight py-14 md:py-16">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <h2 className="font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(1.7rem, 2.6vw, 2.3rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {platformSectionTitle}
          </h2>
          <p className="mt-3" style={{ color: '#46586b', fontSize: '1.05rem', lineHeight: 1.5 }}>{platformSectionSubtitle}</p>
        </div>

        <div className="grid items-center gap-10 lg:grid-cols-[minmax(350px,420px)_1fr] lg:gap-16">
          {/* Card vertical único */}
          <Reveal className="platform-card">
            <span className="platform-card__ico"><Boxes className="h-6 w-6" /></span>
            <span className="platform-card__pill">{c.pill}</span>
            <h3 className="platform-card__title">{c.title}</h3>
            <div className="platform-card__sub">{c.subtitle}</div>
            <span className="platform-card__line" />
            <p className="platform-card__text">{c.text}</p>
            <ul className="platform-card__list">
              {c.bullets.map((b) => (
                <li key={b}><Check className="h-[16px] w-[16px] shrink-0" style={{ color: '#1FA98F' }} strokeWidth={2.6} /> {b}</li>
              ))}
            </ul>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary platform-card__cta">
              {c.ctaLabel} <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>

          {/* Complementar — título institucional + frase (sem card) */}
          <Reveal delay={90} className="platform-aside">
            <span className="platform-aside__shape" aria-hidden="true" />
            <h3 className="font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(1.7rem, 2.8vw, 2.5rem)', lineHeight: 1.14, letterSpacing: '-0.02em', maxWidth: 520 }}>
              {aside.title}
            </h3>
            <p className="mt-4" style={{ color: '#46586b', fontSize: '1.08rem', lineHeight: 1.55, maxWidth: 480 }}>{aside.text}</p>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
