import Reveal from '@/site/components/Reveal'
import BrowserFrame from '@/site/components/BrowserFrame'
import { previewSection as p } from '@/site/content'

// 5ª seção — prévia da plataforma. O print do dashboard vive aqui (fora do card
// de benefícios). Título curto + tela grande. Sem lista de benefícios.
export default function PreviewSection() {
  return (
    <section id="previa" className="sec-deep scroll-mt-24">
      <div className="site-container site-container--tight py-14 md:py-18">
        <div className="mx-auto mb-9 max-w-2xl text-center">
          <h2 className="font-extrabold vt-ink" style={{ fontSize: 'clamp(1.7rem, 2.6vw, 2.3rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {p.title}
          </h2>
          <p className="mt-3 vt-muted" style={{ fontSize: '1.05rem', lineHeight: 1.5 }}>{p.text}</p>
        </div>
        <Reveal className="mx-auto max-w-4xl">
          <BrowserFrame src={p.image} alt={p.imageAlt} />
        </Reveal>
      </div>
    </section>
  )
}
