import { ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { institutionalSection as s } from '@/site/content'

// 3ª seção — institucional (estilo "Nossos negócios"): texto forte à esquerda,
// pessoa recortada + forma gráfica leve à direita. Fundo claro/elegante
// (nada de verde-escuro pesado).
export default function InstitutionalPlatformSection() {
  return (
    <section id="plataforma" className="sec-soft scroll-mt-24">
      <div className="site-container site-container--tight grid items-center gap-10 py-16 md:py-20 lg:grid-cols-[48fr_52fr] lg:gap-16">
        {/* Texto */}
        <Reveal>
          <span className="mb-4 inline-block text-[13px] font-bold uppercase" style={{ color: '#0F8A7C', letterSpacing: '0.1em' }}>
            {s.label}
          </span>
          <h2 className="font-extrabold" style={{ color: '#17324d', fontSize: 'clamp(2rem, 3.2vw, 2.7rem)', lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 560 }}>
            {s.title}
          </h2>
          <div className="mt-5 space-y-4" style={{ maxWidth: 540 }}>
            {s.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} style={{ color: '#46586b', fontSize: '1.05rem', lineHeight: 1.6 }}>{p}</p>
            ))}
          </div>
          <a href={s.ctaHref} className="btn btn-primary mt-7 w-fit" style={{ padding: '0.95rem 1.9rem', fontSize: '1rem' }}>
            {s.ctaLabel} <ArrowRight className="h-4 w-4" />
          </a>
        </Reveal>

        {/* Pessoa + forma leve */}
        <Reveal delay={80}>
          <div className="relative mx-auto flex min-h-[420px] max-w-[470px] items-end justify-center">
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                width: '112%', height: '94%', right: '-8%', bottom: '2%',
                background: 'radial-gradient(circle at 56% 42%, rgba(105,201,149,0.42), rgba(105,201,149,0) 64%)',
                borderRadius: '54% 46% 44% 56% / 54% 46% 54% 46%',
              }}
            />
            <span
              aria-hidden="true"
              className="absolute"
              style={{
                width: '86%', height: '86%', right: '8%', bottom: '4%',
                background: 'linear-gradient(160deg, rgba(31,169,143,0.14), rgba(31,169,143,0))',
                border: '1px solid rgba(31,169,143,0.18)',
                borderRadius: '52% 48% 46% 54% / 50% 46% 54% 50%',
              }}
            />
            <img
              src={s.photoSrc}
              alt={s.photoAlt}
              className="relative z-[1] w-auto object-contain"
              style={{ height: 440, maxHeight: '68vh', objectPosition: 'bottom center', filter: 'drop-shadow(0 22px 40px rgba(23,50,77,0.22))' }}
              loading="lazy"
              draggable={false}
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}
