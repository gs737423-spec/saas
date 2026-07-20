import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'
import HeroPersonStage from '@/site/components/HeroPersonStage'
import MarketplaceRail from '@/site/components/MarketplaceRail'

interface Slide {
  eyebrow: string
  title: React.ReactNode
  sub: string
  ctaSecondary: string
  person: string
  personAlt: string
  waMessage: string
}

const slides: Slide[] = [
  {
    eyebrow: 'INTELIGÊNCIA PARA OPERAÇÕES MULTICANAIS',
    title: <>Seus marketplaces, uma operação mais clara.</>,
    sub: 'A Vintec conecta Mercado Livre, Amazon, Shopee e Leroy Merlin para organizar vendas, pedidos, estoque e desempenho em uma única rotina de gestão.',
    ctaSecondary: 'Entenda como funciona',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional com um tablet, representando a operação multicanal mais clara com a Vintec',
    waMessage: 'Olá! Gostaria de conhecer a Vintec e organizar meus marketplaces em uma operação mais clara.',
  },
  {
    eyebrow: 'MENOS DISPERSÃO. MAIS DIREÇÃO.',
    title: <>Menos telas para acompanhar. Mais clareza para decidir.</>,
    sub: 'Reúna as informações dos canais e acompanhe sua operação com mais organização, agilidade e confiança.',
    ctaSecondary: 'Conheça as soluções',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, acompanhando a operação com mais clareza na Vintec',
    waMessage: 'Olá! Gostaria de entender como a Vintec ajuda a reduzir a dispersão de informações da minha operação.',
  },
  {
    eyebrow: 'CRESCIMENTO COM CONTROLE',
    title: <>Cresça em novos canais sem perder o controle.</>,
    sub: 'Compare os marketplaces, acompanhe os pontos de atenção e descubra onde sua empresa pode avançar.',
    ctaSecondary: 'Conheça a Vintec',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, acompanhando o crescimento da operação com controle na Vintec',
    waMessage: 'Olá! Gostaria de entender como crescer em novos marketplaces sem perder o controle da operação.',
  },
]

const AUTOPLAY_MS = 5500

export default function Hero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  // Autoplay. Depende de `active` → toda troca (manual ou automática) limpa
  // e recria o intervalo, reiniciando a contagem. Sem múltiplos timers.
  useEffect(() => {
    if (reducedMotion || paused) return
    timerRef.current = window.setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    const stop = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null } }
    const onVisibility = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [paused, reducedMotion, active])

  const goTo = (i: number) => setActive((i + slides.length) % slides.length)

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') goTo(active + 1)
    if (e.key === 'ArrowLeft') goTo(active - 1)
  }

  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 40) goTo(active + (dx < 0 ? 1 : -1))
    touchStartX.current = null
  }

  const slide = slides[active]
  const waHref = whatsappContactUrl(slide.waMessage) ?? specialistHref(slide.waMessage)

  return (
    <section
      id="topo"
      className="hero-vt"
      role="region"
      aria-roledescription="carousel"
      aria-label="Apresentação da Vintec"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="site-container site-container--tight grid items-center gap-8 pt-24 lg:grid-cols-[46fr_54fr] lg:gap-10 lg:pt-24">
        {/* Texto + MarketplaceRail (fixo, não troca com o slide) */}
        <div className="flex flex-col pb-14 md:pb-16 lg:pb-20">
          <div key={`t-${active}`} className="hero-fade max-w-xl">
            <span className="mb-4 inline-block text-[12.5px] font-bold uppercase" style={{ color: '#9DDCFF', letterSpacing: '0.14em' }}>
              {slide.eyebrow}
            </span>

            <h1 className="font-extrabold" style={{ color: '#F7F9FF', fontSize: 'clamp(2.3rem, 3.8vw, 3.6rem)', lineHeight: 1.03, letterSpacing: '-0.025em', maxWidth: 560 }}>
              {slide.title}
            </h1>

            <p className="mt-4 max-w-[500px] text-[1.1rem]" style={{ color: 'rgba(226,235,250,0.9)', lineHeight: 1.52 }}>
              {slide.sub}
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.9rem 1.7rem', fontSize: '1rem' }}>
                Fale com um especialista <ArrowRight className="h-[18px] w-[18px]" />
              </a>
              <a href="#servicos" className="btn btn-glass" style={{ padding: '0.9rem 1.5rem', fontSize: '0.96rem' }}>
                {slide.ctaSecondary}
              </a>
            </div>

            <p className="mt-3 text-[12.5px]" style={{ color: 'rgba(226,235,250,0.6)' }}>Diagnóstico inicial, sem compromisso.</p>
          </div>

          <div className="mt-9">
            <MarketplaceRail />
          </div>
        </div>

        {/* Pessoa ancorada + palco visual (HeroPersonStage) */}
        <div className="relative mx-auto h-[460px] w-full max-w-[560px] sm:h-[540px] lg:h-[640px]">
          <HeroPersonStage person={slide.person} personAlt={slide.personAlt} eager={active === 0} />
        </div>
      </div>

      {/* Setas — laterais, centralizadas verticalmente */}
      <button type="button" aria-label="Slide anterior" onClick={() => goTo(active - 1)} className="hero-arrow hero-arrow--prev">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button type="button" aria-label="Próximo slide" onClick={() => goTo(active + 1)} className="hero-arrow hero-arrow--next">
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Indicadores — centralizados na base, com progressão de tempo */}
      <div className="hero-controls">
        <div className="flex items-center gap-2.5" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === active} aria-label={`Ir para slide ${i + 1}`}
              onClick={() => goTo(i)} className="hero-dot" data-active={i === active}>
              {i === active && <span className="hero-dot__progress" style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }} />}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.eyebrow}`}</p>
    </section>
  )
}
