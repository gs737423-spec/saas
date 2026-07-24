import { ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { institutionalSection as s } from '@/site/content'

// 3ª seção — institucional. Pessoa corporativa à ESQUERDA (recorte transparente
// real, ancorada na base sobre forma azul, coerente com o hero), conteúdo à
// DIREITA. Fundo surface-blue — não mais o mint/teal da identidade anterior.
export default function InstitutionalSolutionSection() {
  return (
    <section id="solucao" className="sec-surface-blue scroll-mt-24">
      <div className="site-container site-container--tight grid items-stretch gap-10 py-14 md:py-16 lg:grid-cols-[42fr_58fr] lg:gap-16">
        {/* Pessoa + forma azul */}
        <div className="institutional-stage order-2 lg:order-1">
          <span className="institutional-stage-amber" aria-hidden="true" />
          <img
            src={s.photoSrc}
            alt={s.photoAlt}
            className="institutional-person"
            width={379}
            height={1325}
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>

        {/* Conteúdo */}
        <Reveal className="order-1 flex flex-col justify-center lg:order-2">
          <span className="mb-3 inline-block text-[13px] font-bold uppercase" style={{ color: '#244EDB', letterSpacing: '0.12em' }}>
            {s.label}
          </span>
          <h2 className="font-extrabold" style={{ color: '#14243B', fontSize: 'clamp(1.9rem, 3vw, 2.6rem)', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 560 }}>
            {s.title}
          </h2>
          <div className="mt-5 space-y-4" style={{ maxWidth: 540 }}>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} style={{ color: '#42536A', fontSize: '1.05rem', lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
          <a href={s.ctaHref} className="btn btn-primary mt-7 w-fit" style={{ padding: '0.9rem 1.8rem', fontSize: '1rem' }}>
            {s.ctaLabel} <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
