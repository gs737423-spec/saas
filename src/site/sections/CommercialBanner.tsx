import { ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import PersonPhotoSlot from '@/site/components/PersonPhotoSlot'
import { specialistHref, type CommercialBannerContent } from '@/site/content'

export default function CommercialBanner({ content }: { content: CommercialBannerContent }) {
  const waHref = specialistHref(content.waMessage)
  const photo = (
    <PersonPhotoSlot
      id={content.photoSlot}
      src={content.photoSrc}
      alt={content.photoAlt}
      ratio="4 / 5"
      className="mx-auto max-w-sm"
    />
  )
  const text = (
    <Reveal className="flex flex-col justify-center">
      <span className="site-label mb-3">{content.eyebrow}</span>
      <h2 className="site-h2" style={{ color: 'var(--s-ink)' }}>{content.title}</h2>
      <p className="site-lead mt-4">{content.text}</p>
      <div className="mt-6">
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-fit">
          {content.ctaLabel} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </Reveal>
  )

  return (
    <section style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-8 md:py-11">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">
          {content.imageSide === 'left' ? (<>{photo}{text}</>) : (<>{text}{photo}</>)}
        </div>
      </div>
    </section>
  )
}
