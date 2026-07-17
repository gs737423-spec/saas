import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Layers, BarChart3, Share2, Wallet, ShoppingCart, Percent, Boxes, Network, Building2, Activity, Plug, type LucideIcon } from 'lucide-react'
import { marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

function mpBrand(name: string) {
  return marketplaces.find((m) => m.name === name)
}

// Elementos flutuantes: só logo (marca) ou só ícone (conceito) — sem texto.
type Chip =
  | { kind: 'brand'; mp: string; pos: CSSProperties; float: string }
  | { kind: 'kpi'; icon: LucideIcon; pos: CSSProperties; float: string }

interface Slide {
  eyebrowIcon: LucideIcon
  eyebrowLabel: string // só p/ leitor de tela (a11y), não renderiza como badge
  title: React.ReactNode
  sub: string
  person: string
  personAlt: string
  chips: Chip[]
  waMessage: string
}

// 4 âncoras assimétricas ao redor da pessoa. Evitam rosto (topo-centro) e
// mãos/dispositivo (centro).
const POS = {
  a: { top: '9%', left: '4%' } as CSSProperties, // superior-esquerda
  b: { top: '24%', right: '2%' } as CSSProperties, // superior-direita
  c: { top: '55%', left: '1%' } as CSSProperties, // meio-esquerda
  d: { bottom: '14%', right: '4%' } as CSSProperties, // inferior-direita
}

const slides: Slide[] = [
  {
    eyebrowIcon: Layers,
    eyebrowLabel: 'Gestão multicanal',
    title: <>Todos os seus marketplaces em uma só operação.</>,
    sub: 'Vendas, pedidos, estoque e desempenho reunidos em uma única visão.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional com um tablet, representando a operação multicanal centralizada pela Vintec',
    chips: [
      { kind: 'brand', mp: 'Mercado Livre', pos: POS.a, float: 'hero-float-a' },
      { kind: 'brand', mp: 'Amazon', pos: POS.b, float: 'hero-float-b' },
      { kind: 'brand', mp: 'Shopee', pos: POS.c, float: 'hero-float-c' },
      { kind: 'brand', mp: 'Leroy Merlin', pos: POS.d, float: 'hero-float-d' },
    ],
    waMessage: 'Olá! Gostaria de conhecer a Vintec e entender como ela conecta meus marketplaces em uma só operação.',
  },
  {
    eyebrowIcon: BarChart3,
    eyebrowLabel: 'Visão executiva',
    title: <>Enxergue o resultado sem trocar de painel.</>,
    sub: 'Compare canais, acompanhe margens e entenda onde sua operação realmente cresce.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, ilustrando a visão executiva única da operação na Vintec',
    chips: [
      { kind: 'kpi', icon: Wallet, pos: POS.a, float: 'hero-float-a' },
      { kind: 'kpi', icon: ShoppingCart, pos: POS.b, float: 'hero-float-b' },
      { kind: 'kpi', icon: Percent, pos: POS.c, float: 'hero-float-c' },
      { kind: 'kpi', icon: Boxes, pos: POS.d, float: 'hero-float-d' },
    ],
    waMessage: 'Olá! Gostaria de entender como a Vintec mostra o resultado da operação sem trocar de painel.',
  },
  {
    eyebrowIcon: Share2,
    eyebrowLabel: 'Operação conectada',
    title: <>Mais canais. Menos operação espalhada.</>,
    sub: 'Centralize informações e cresça com mais organização, clareza e controle.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, ilustrando a operação conectada e organizada com a Vintec',
    chips: [
      { kind: 'kpi', icon: Plug, pos: POS.a, float: 'hero-float-a' },
      { kind: 'kpi', icon: Network, pos: POS.b, float: 'hero-float-b' },
      { kind: 'kpi', icon: Building2, pos: POS.c, float: 'hero-float-c' },
      { kind: 'kpi', icon: Activity, pos: POS.d, float: 'hero-float-d' },
    ],
    waMessage: 'Olá! Gostaria de centralizar minha operação multicanal com a Vintec e crescer com mais controle.',
  },
]

const AUTOPLAY_MS = 7500

function HeroChip({ chip, hideOnMobile }: { chip: Chip; hideOnMobile?: boolean }) {
  const mob = hideOnMobile ? ' hero-tile--hide-mobile' : ''
  if (chip.kind === 'brand') {
    const brand = mpBrand(chip.mp)
    return (
      <span aria-hidden="true" className={`hero-tile hero-tile--brand absolute ${chip.float}${mob}`} style={chip.pos}>
        {brand ? <img src={brand.logoSrc} alt={chip.mp} className="hero-tile__img" style={{ height: brand.logoH }} /> : null}
      </span>
    )
  }
  const Icon = chip.icon
  return (
    <span aria-hidden="true" className={`hero-tile hero-tile--kpi absolute ${chip.float}${mob}`} style={chip.pos}>
      <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
    </span>
  )
}

// Forma orgânica assimétrica (SVG) atrás da pessoa — identidade, não efeito.
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
      {/* Forma assimétrica: lobo maior à direita, base mais reta à esquerda */}
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

  useEffect(() => {
    if (reducedMotion || paused) return
    const start = () => {
      if (!timerRef.current) timerRef.current = window.setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    }
    const stop = () => {
      if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null }
    }
    const onVisibility = () => (document.hidden ? stop() : start())
    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [paused, reducedMotion])

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
  const EyebrowIcon = slide.eyebrowIcon
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
        <div key={`t-${active}`} className="hero-fade max-w-xl pb-10 md:pb-12 lg:pb-16">
          {/* Símbolo do slide (sem badge/caixa) */}
          <span className="mb-4 inline-flex" aria-hidden="true">
            <EyebrowIcon className="h-[52px] w-[52px]" style={{ color: '#8FE6C4' }} strokeWidth={1.6} />
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

          {/* Controles do slider — discretos */}
          <div className="mt-8 flex items-center gap-3">
            <button type="button" aria-label="Slide anterior" onClick={() => goTo(active - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(234,244,243,0.85)' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
              {slides.map((_, i) => (
                <button key={i} role="tab" aria-selected={i === active} aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => goTo(i)} className="h-2 rounded-full transition-all"
                  style={{ width: i === active ? 26 : 8, background: i === active ? '#69c995' : 'rgba(255,255,255,0.25)' }} />
              ))}
            </div>
            <button type="button" aria-label="Próximo slide" onClick={() => goTo(active + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(234,244,243,0.85)' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pessoa ancorada na base + forma orgânica (sem layout shift). */}
        <div className="relative mx-auto h-[400px] w-full max-w-[580px] sm:h-[450px] lg:h-[500px]">
          <HeroShape />
          <span className="hero-contact-shadow" />

          {/* Pessoa muda por slide — apoiada na base, grande */}
          <div key={`p-${active}`} className="hero-fade absolute inset-x-0 bottom-0 z-[1] flex justify-center">
            <img
              src={slide.person}
              alt={slide.personAlt}
              className="max-h-[400px] w-auto object-contain sm:max-h-[450px] lg:max-h-[520px]"
              draggable={false}
            />
          </div>

          {/* Tiles flutuantes — no mobile só os 2 laterais/baixos (índices 2,3). */}
          <div key={`c-${active}`} className="hero-fade pointer-events-none absolute inset-0 z-[2]">
            {slide.chips.map((chip, i) => (
              <HeroChip key={i} chip={chip} hideOnMobile={i < 2} />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.eyebrowLabel}`}</p>
    </section>
  )
}
