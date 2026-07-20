import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingCart, Boxes, TrendingUp, BarChart3, Share2, ListChecks, type LucideIcon } from 'lucide-react'
import { specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

// Chip pequeno, translúcido, com ícone + rótulo curto (não card de dashboard).
interface Chip { label: string; icon: LucideIcon; pos: CSSProperties; float: string }

interface Slide {
  label: string
  title: React.ReactNode
  sub: string
  person: string
  personAlt: string
  chips: Chip[]
  waMessage: string
}

// Só 2 âncoras por slide (máx. 2 chips) — evitam rosto/mãos/dispositivo.
const POS = {
  top: { top: '16%', right: '-2%' } as CSSProperties,
  bottom: { bottom: '18%', left: '0%' } as CSSProperties,
}

const slides: Slide[] = [
  {
    label: 'GESTÃO DE MARKETPLACES',
    title: <>Todos os seus marketplaces em um só lugar.</>,
    sub: 'Acompanhe pedidos, estoque, vendas e desempenho sem depender de várias telas.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional com um tablet, representando a gestão de marketplaces em um só lugar com a Vintec',
    chips: [
      { label: 'Pedidos', icon: ShoppingCart, pos: POS.top, float: 'hero-float-a' },
      { label: 'Estoque', icon: Boxes, pos: POS.bottom, float: 'hero-float-c' },
    ],
    waMessage: 'Olá! Gostaria de conhecer a Vintec e reunir meus marketplaces em um só lugar.',
  },
  {
    label: 'RESULTADOS MAIS CLAROS',
    title: <>Entenda o que vende e onde sua empresa está crescendo.</>,
    sub: 'Compare seus canais e encontre rapidamente o que precisa da sua atenção.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, ilustrando resultados mais claros da operação na Vintec',
    chips: [
      { label: 'Vendas', icon: TrendingUp, pos: POS.top, float: 'hero-float-a' },
      { label: 'Resultados', icon: BarChart3, pos: POS.bottom, float: 'hero-float-c' },
    ],
    waMessage: 'Olá! Gostaria de entender melhor os resultados da minha operação com a Vintec.',
  },
  {
    label: 'ROTINA MAIS ORGANIZADA',
    title: <>Mais canais. Menos bagunça no dia a dia.</>,
    sub: 'Reúna as informações dos marketplaces e trabalhe com mais clareza e controle.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, ilustrando uma rotina mais organizada com a Vintec',
    chips: [
      { label: 'Mais canais', icon: Share2, pos: POS.top, float: 'hero-float-a' },
      { label: 'Mais organização', icon: ListChecks, pos: POS.bottom, float: 'hero-float-c' },
    ],
    waMessage: 'Olá! Gostaria de organizar a rotina da minha operação multicanal com a Vintec.',
  },
]

const AUTOPLAY_MS = 5000

function HeroChip({ chip, hideOnMobile }: { chip: Chip; hideOnMobile?: boolean }) {
  const Icon = chip.icon
  const mob = hideOnMobile ? ' hero-tile--hide-mobile' : ''
  return (
    <span aria-hidden="true" className={`hero-chip absolute ${chip.float}${mob}`} style={chip.pos}>
      <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
      {chip.label}
    </span>
  )
}

function HeroShape() {
  return (
    <svg className="hero-organic" viewBox="0 0 240 200" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="heroShapeGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="rgba(163,236,197,0.92)" />
          <stop offset="55%" stopColor="rgba(103,206,181,0.60)" />
          <stop offset="100%" stopColor="rgba(86,192,179,0.26)" />
        </linearGradient>
      </defs>
      <path d="M58,44 C92,14 150,8 190,30 C226,50 236,92 226,130 C216,168 182,190 138,190 C96,190 66,178 40,150 C18,126 20,96 34,72 C42,58 48,52 58,44 Z" fill="url(#heroShapeGrad)" />
    </svg>
  )
}

export default function Hero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  // Autoplay 5s. Depende de `active` → toda troca (manual OU automática)
  // limpa e recria o intervalo, reiniciando a contagem. Sem múltiplos timers.
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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="site-container site-container--tight grid items-end gap-8 pt-20 md:pt-20 lg:grid-cols-[44fr_56fr] lg:gap-10 lg:pt-20">
        {/* Texto */}
        <div key={`t-${active}`} className="hero-fade max-w-xl pb-16 md:pb-16 lg:pb-20">
          <span className="mb-4 inline-block text-[12.5px] font-bold uppercase" style={{ color: '#8FE6C4', letterSpacing: '0.14em' }}>
            {slide.label}
          </span>

          <h1 className="font-extrabold" style={{ color: '#F4FCFB', fontSize: 'clamp(2rem, 3vw, 3rem)', lineHeight: 1.04, letterSpacing: '-0.03em', maxWidth: 500 }}>
            {slide.title}
          </h1>

          <p className="mt-4 max-w-[500px] text-[1.12rem]" style={{ color: 'rgba(223,240,237,0.9)', lineHeight: 1.5 }}>
            {slide.sub}
          </p>

          <div className="mt-6">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.8rem 1.6rem', fontSize: '0.98rem' }}>
              Fale com um especialista <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Pessoa ancorada na base + forma orgânica */}
        <div className="relative mx-auto h-[400px] w-full max-w-[580px] sm:h-[450px] lg:h-[500px]">
          <HeroShape />
          <span className="hero-contact-shadow" />

          <div key={`p-${active}`} className="hero-fade absolute inset-x-0 bottom-0 z-[1] flex justify-center">
            <img
              src={slide.person}
              alt={slide.personAlt}
              className="max-h-[400px] w-auto object-contain sm:max-h-[450px] lg:max-h-[520px]"
              draggable={false}
            />
          </div>

          <div key={`c-${active}`} className="hero-fade pointer-events-none absolute inset-0 z-[2]">
            {slide.chips.map((chip, i) => (
              <HeroChip key={i} chip={chip} hideOnMobile={i === 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Controles centralizados na base do hero */}
      <div className="hero-controls">
        <button type="button" aria-label="Slide anterior" onClick={() => goTo(active - 1)} className="hero-controls__arrow">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === active} aria-label={`Ir para slide ${i + 1}`}
              onClick={() => goTo(i)} className="h-2 rounded-full transition-all"
              style={{ width: i === active ? 28 : 8, background: i === active ? '#69c995' : 'rgba(255,255,255,0.3)' }} />
          ))}
        </div>
        <button type="button" aria-label="Próximo slide" onClick={() => goTo(active + 1)} className="hero-controls__arrow">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.label}`}</p>
    </section>
  )
}
