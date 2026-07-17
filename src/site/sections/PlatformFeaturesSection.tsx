import { Check, ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import BrowserFrame from '@/site/components/BrowserFrame'
import { platformBlock as b, platformFeaturesTitle, platformFeaturesSubtitle, specialistHref } from '@/site/content'

// 4ª seção — "A plataforma Vintec": UM único bloco/card principal (não vários).
// Esquerda = texto simples e comercial + bullets + CTA; direita = print da
// plataforma. Seção clara e compacta.
export default function PlatformFeaturesSection() {
  const waHref = specialistHref('Olá! Quero conhecer a plataforma Vintec.')
  return (
    <section id="plataforma-cards" className="vt-light scroll-mt-24">
      <div className="site-container site-container--tight py-14 md:py-16">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <h2 className="font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(1.7rem, 2.6vw, 2.3rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {platformFeaturesTitle}
          </h2>
          <p className="mt-3" style={{ color: '#46586b', fontSize: '1.05rem', lineHeight: 1.5 }}>
            {platformFeaturesSubtitle}
          </p>
        </div>

        <Reveal className="platform-block grid items-center gap-8 lg:grid-cols-[46fr_54fr] lg:gap-12">
          {/* Esquerda — texto */}
          <div>
            <span className="platform-card__pill">{b.pill}</span>
            <h3 className="mt-3 font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(1.4rem, 2vw, 1.85rem)', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
              {b.title}
            </h3>
            <p className="mt-3 text-[14.5px]" style={{ color: '#51617a', lineHeight: 1.55 }}>{b.text}</p>
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {b.bullets.map((item) => (
                <li key={item} className="flex items-start gap-2 text-[14px]" style={{ color: '#374559' }}>
                  <Check className="mt-0.5 h-[16px] w-[16px] shrink-0" style={{ color: '#1FA98F' }} strokeWidth={2.5} /> {item}
                </li>
              ))}
            </ul>
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-7 w-fit" style={{ padding: '0.9rem 1.7rem', fontSize: '0.98rem' }}>
              {b.ctaLabel} <ArrowRight className="h-4 w-4" />
            </a>
          </div>

          {/* Direita — print da plataforma */}
          <div className="relative">
            <BrowserFrame src={b.image} alt={b.imageAlt} />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
