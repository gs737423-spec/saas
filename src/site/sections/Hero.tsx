import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { ctaLabels, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'
import HeroPersonStage from '@/site/components/HeroPersonStage'
import MarketplaceRail from '@/site/components/MarketplaceRail'

interface Slide {
  eyebrow: string
  title: React.ReactNode
  sub: string
  ctaPrimary: string
  ctaSecondary: string
  ctaSecondaryHref: string
  microcopy: string
  person: string
  personAlt: string
  waMessage: string
}

const slides: Slide[] = [
  {
    eyebrow: 'MENOS TELAS. MAIS CONTROLE.',
    title: <>Decisões à altura do negócio que você está construindo.</>,
    sub: 'Nossa equipe atua dentro do ambiente do e-commerce para o sucesso da sua operação.',
    ctaPrimary: 'Quero organizar minha operação',
    ctaSecondary: 'Ver como funciona',
    ctaSecondaryHref: '#como-funciona',
    microcopy: 'Conversa inicial, sem compromisso.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional com um tablet, representando a operação multicanal mais clara com a MKTOnline',
    waMessage: 'Olá! Quero organizar a gestão dos meus marketplaces com a MKTOnline.',
  },
  {
    eyebrow: 'ANÁLISE E ACOMPANHAMENTO',
    title: <>Crescer bem exige mais do que esforço. Exige experiência ao lado das suas decisões.</>,
    sub: 'Unimos experiência, análise e acompanhamento para apoiar decisões importantes sobre margem, estoque, canais e desempenho.',
    ctaPrimary: ctaLabels.principal,
    ctaSecondary: 'Conhecer nossos serviços',
    ctaSecondaryHref: '#servicos',
    microcopy: 'Uma conversa sobre sua operação, sem compromisso.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, acompanhando a operação com mais clareza na MKTOnline',
    waMessage: 'Olá! Quero agendar uma conversa estratégica com a MKTOnline sobre minha operação.',
  },
  {
    eyebrow: 'ANÁLISE ESTRATÉGICA DA OPERAÇÃO',
    title: <>Você já construiu uma operação real. Vamos entender o que ela precisa para o próximo passo.</>,
    sub: 'Antes de qualquer recomendação, ouvimos como sua empresa opera hoje. A partir disso, ajudamos a organizar prioridades e apoiar decisões mais seguras para os próximos passos.',
    ctaPrimary: ctaLabels.principal,
    ctaSecondary: 'Conhecer nossos serviços',
    ctaSecondaryHref: '#servicos',
    microcopy: 'Uma conversa sobre sua operação, sem compromisso.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, acompanhando o crescimento da operação com controle na MKTOnline',
    waMessage: 'Olá! Quero agendar uma conversa estratégica com a MKTOnline sobre minha operação.',
  },
]

const AUTOPLAY_MS = 5500

// Pré-carrega e decodifica as 3 imagens de pessoa antes de permitir o
// autoplay — evita que a troca de slide 2/3 mostre a pessoa "atrasada" (o
// primeiro decode do navegador é o que trava, não a transição em si).
function preloadPeople(): Promise<void> {
  return Promise.all(
    slides.map((s) => {
      const img = new Image()
      img.src = s.person
      return typeof img.decode === 'function' ? img.decode().catch(() => {}) : Promise.resolve()
    }),
  ).then(() => undefined)
}

export default function Hero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [peopleReady, setPeopleReady] = useState(false)
  const timerRef = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  useEffect(() => {
    let cancelled = false
    preloadPeople().then(() => { if (!cancelled) setPeopleReady(true) })
    return () => { cancelled = true }
  }, [])

  // Autoplay só começa depois das 3 imagens decodificadas — o primeiro slide
  // aparece imediatamente de qualquer forma (peopleReady só bloqueia o
  // intervalo, não a renderização inicial).
  useEffect(() => {
    if (reducedMotion || paused || !peopleReady) return
    timerRef.current = window.setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    const stop = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null } }
    const onVisibility = () => { if (document.hidden) stop() }
    document.addEventListener('visibilitychange', onVisibility)
    return () => { stop(); document.removeEventListener('visibilitychange', onVisibility) }
  }, [paused, reducedMotion, active, peopleReady])

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
      aria-label="Apresentação da MKTOnline"
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

            <h1 className="font-extrabold" style={{ color: '#F7F9FF', fontSize: 'clamp(2.1rem, 3vw, 3.1rem)', lineHeight: 1.08, letterSpacing: '-0.02em', maxWidth: 600, textWrap: 'balance' }}>
              {slide.title}
            </h1>

            <p className="mt-4 max-w-[500px] text-[1.1rem]" style={{ color: 'rgba(226,235,250,0.9)', lineHeight: 1.52 }}>
              {slide.sub}
            </p>

            {/* Os dois CTAs formam um conjunto: mesma altura, padding, radius,
                tipografia e min-width (o texto curto alarga para casar com o
                longo). Cor mantém a hierarquia — primary azul, glass secundário. */}
            <div className="mt-7 flex flex-col items-stretch gap-3 hero-cta-group">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary hero-cta">
                {slide.ctaPrimary} <ArrowRight className="hero-cta__arrow h-[18px] w-[18px]" />
              </a>
              <a href={slide.ctaSecondaryHref} className="btn btn-glass hero-cta">
                {slide.ctaSecondary}
              </a>
            </div>

            <p className="mt-3 text-[12.5px]" style={{ color: 'rgba(226,235,250,0.6)' }}>{slide.microcopy}</p>
          </div>

          <div className="mt-9">
            <MarketplaceRail />
          </div>
        </div>

        {/* Pessoa ancorada + palco visual (camadas persistentes, HeroPersonStage) */}
        <div className="relative mx-auto h-[460px] w-full max-w-[560px] sm:h-[540px] lg:h-[640px]">
          <HeroPersonStage
            people={slides.map((s) => ({ src: s.person, alt: s.personAlt }))}
            activeIndex={active}
          />
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
              {i === active && peopleReady && <span className="hero-dot__progress" style={{ animationDuration: `${AUTOPLAY_MS}ms`, animationPlayState: paused ? 'paused' : 'running' }} />}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.eyebrow}`}</p>
    </section>
  )
}
