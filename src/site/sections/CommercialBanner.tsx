import { ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { specialistHref, type CommercialBannerContent } from '@/site/content'

// Banner comercial humanizado no dark: pessoa (fundo removido) sobre glow
// teal, texto forte, CTA. Alterna lado da imagem.
export default function CommercialBanner({ content }: { content: CommercialBannerContent }) {
  const waHref = specialistHref(content.waMessage)

  const photo = (
    <div className="relative mx-auto w-full max-w-[420px]" style={{ minHeight: 360 }}>
      <span aria-hidden="true" className="hero-orb" style={{ width: 340, height: 340, top: '46%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(39, 93, 255,0.3), transparent 68%)' }} />
      <span aria-hidden="true" className="hero-ring" style={{ width: 380, height: 380, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
      <div className="relative flex items-end justify-center">
        <img
          src={content.photoSrc}
          alt={content.photoAlt}
          className="max-h-[440px] w-auto object-contain"
          style={{ filter: 'drop-shadow(0 24px 44px rgba(0,0,0,0.5))' }}
          loading="lazy"
          draggable={false}
        />
      </div>
    </div>
  )

  const text = (
    <Reveal className="flex flex-col justify-center">
      <span className="site-label mb-3" style={{ color: '#6EC8FF' }}>{content.eyebrow}</span>
      <h2 className="site-h2 vt-ink">{content.title}</h2>
      <p className="site-lead mt-4 vt-muted">{content.text}</p>
      <div className="mt-6">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-fit" style={{ padding: '0.85rem 1.5rem' }}>
          {content.ctaLabel} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Reveal>
  )

  return (
    <section className="sec-glow">
      <div className="site-container py-14 md:py-20">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {content.imageSide === 'left' ? (<>{photo}{text}</>) : (<>{text}{photo}</>)}
        </div>
      </div>
    </section>
  )
}
