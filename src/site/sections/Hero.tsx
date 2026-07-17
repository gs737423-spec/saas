import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  ArrowRight, ChevronLeft, ChevronRight, Layers, BarChart3, Share2,
  Wallet, ShoppingCart, Boxes, Network, Activity, TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

function mpBrand(name: string) {
  return marketplaces.find((m) => m.name === name)
}

// Balão: marca (logo oficial) ou indicador (ícone + texto curto — nunca só
// ícone nos slides 2/3, o visitante precisa entender sem adivinhar).
type Chip =
  | { kind: 'brand'; mp: string; pos: CSSProperties }
  | { kind: 'kpi'; icon: LucideIcon; label: string; pos: CSSProperties }

interface Slide {
  eyebrowIcon: LucideIcon
  label: string
  title: React.ReactNode
  sub: string
  person: string
  personAlt: string
  personEager?: boolean
  blob: CSSProperties // cores das 3 camadas da forma (--blob-*)
  chips: Chip[]
  waMessage: string
}

const slides: Slide[] = [
  {
    eyebrowIcon: Layers,
    label: 'Gestão multicanal',
    title: <>Todos os seus marketplaces em uma só operação.</>,
    sub: 'Vendas, pedidos, estoque e desempenho reunidos em uma única visão.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional com um tablet, representando a operação multicanal centralizada pela Vintec',
    personEager: true,
    blob: { ['--blob-back' as string]: '#8ee2a9', ['--blob-mid' as string]: '#67cbd0', ['--blob-front' as string]: '#9fe0c0' },
    chips: [
      { kind: 'brand', mp: 'Mercado Livre', pos: { top: '16%', left: '0%' } },
      { kind: 'brand', mp: 'Amazon', pos: { top: '33%', right: '-2%' } },
      { kind: 'brand', mp: 'Shopee', pos: { top: '60%', left: '-4%' } },
      { kind: 'brand', mp: 'Leroy Merlin', pos: { bottom: '12%', right: '0%' } },
    ],
    waMessage: 'Olá! Gostaria de conhecer a Vintec e entender como ela conecta meus marketplaces em uma só operação.',
  },
  {
    eyebrowIcon: BarChart3,
    label: 'Visão mais clara',
    title: <>Entenda o que vende, onde cresce e onde precisa agir.</>,
    sub: 'Acompanhe resultados, margens e pedidos sem trocar de painel o tempo todo.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, acompanhando os resultados da operação na Vintec',
    blob: { ['--blob-back' as string]: '#67cbd0', ['--blob-mid' as string]: '#8ec9e6', ['--blob-front' as string]: '#bfe6d6' },
    chips: [
      { kind: 'kpi', icon: ShoppingCart, label: 'Pedidos', pos: { top: '15%', left: '-2%' } },
      { kind: 'kpi', icon: Boxes, label: 'Estoque', pos: { top: '42%', right: '-3%' } },
      { kind: 'kpi', icon: Wallet, label: 'Vendas', pos: { bottom: '14%', left: '2%' } },
    ],
    waMessage: 'Olá! Gostaria de entender como a Vintec ajuda a acompanhar os resultados dos meus marketplaces.',
  },
  {
    eyebrowIcon: Share2,
    label: 'Crescimento organizado',
    title: <>Mais canais. Menos bagunça na rotina.</>,
    sub: 'Centralize informações e ganhe mais clareza para vender melhor nos marketplaces.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, organizando a rotina de vendas em marketplaces com a Vintec',
    blob: { ['--blob-back' as string]: '#cae86b', ['--blob-mid' as string]: '#8ee2a9', ['--blob-front' as string]: '#67cbd0' },
    chips: [
      { kind: 'kpi', icon: TrendingUp, label: 'Mais canais', pos: { top: '15%', left: '-2%' } },
      { kind: 'kpi', icon: Activity, label: 'Desempenho', pos: { top: '42%', right: '-3%' } },
      { kind: 'kpi', icon: Network, label: 'Mais clareza', pos: { bottom: '14%', left: '2%' } },
    ],
    waMessage: 'Olá! Gostaria de organizar minha rotina de vendas em marketplaces com a Vintec.',
  },
]

const AUTOPLAY_MS = 5000
const FLOATS = ['hero-float-a', 'hero-float-b', 'hero-float-c', 'hero-float-d']

function HeroChip({ chip, float, hideOnMobile }: { chip: Chip; float: string; hideOnMobile?: boolean }) {
  const mob = hideOnMobile ? ' hero-tile--hide-mobile' : ''
  if (chip.kind === 'brand') {
    const brand = mpBrand(chip.mp)
    return (
      <span aria-hidden="true" className={`hero-tile hero-tile--brand ${float}${mob}`} style={chip.pos}>
        {brand ? <img src={brand.logoSrc} alt="" className="hero-tile__img" style={{ height: brand.logoH, maxWidth: 140 }} /> : null}
      </span>
    )
  }
  const Icon = chip.icon
  return (
    <span aria-hidden="true" className={`hero-tile hero-tile--kpi ${float}${mob}`} style={chip.pos}>
      <Icon className="h-[26px] w-[26px]" strokeWidth={2} />
      <span className="hero-tile__label">{chip.label}</span>
    </span>
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
      <div
        className="site-container site-container--tight grid items-stretch gap-8 lg:grid-cols-[42fr_58fr] lg:gap-10"
        style={{ minHeight: 'clamp(520px, calc(100vh - 74px), 620px)' }}
      >
        {/* Texto */}
        <div key={`t-${active}`} className="hero-fade flex flex-col justify-center pt-[104px] pb-8 md:pb-10 lg:pt-[96px]">
          <div className="mb-5 inline-flex items-center gap-2" aria-hidden="true">
            <EyebrowIcon className="h-[17px] w-[17px]" style={{ color: '#bff0d8' }} strokeWidth={2.2} />
            <span style={{ color: '#bff0d8', fontWeight: 700, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{slide.label}</span>
          </div>

          <h1
            className="font-extrabold"
            style={{ color: '#F7FEFD', fontSize: 'clamp(2.5rem, 4.4vw, 4.05rem)', lineHeight: 1.02, letterSpacing: '-0.025em', maxWidth: 580 }}
          >
            {slide.title}
          </h1>

          <p className="mt-5" style={{ color: 'rgba(233,247,244,0.94)', fontSize: 'clamp(1.06rem, 1.4vw, 1.3rem)', lineHeight: 1.5, maxWidth: 480 }}>
            {slide.sub}
          </p>

          <div className="mt-8">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '1.05rem 2.1rem', fontSize: '1.05rem', borderRadius: 13 }}>
              Fale com um especialista <ArrowRight className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        {/* Composição visual — pessoa ancorada na base + forma + balões */}
        <div className="relative min-h-[440px] pt-[92px] lg:min-h-0 lg:pt-0">
          {/* Forma orgânica multi-camada (cores por slide) */}
          <div key={`s-${active}`} className="hero-shape hero-fade" style={slide.blob}>
            <span className="hero-blob hero-blob--back" />
            <span className="hero-blob hero-blob--mid" />
            <span className="hero-blob hero-blob--front" />
          </div>

          <span className="hero-contact-shadow" />

          {/* Pessoa — muda por slide, apoiada na base, sem distorção */}
          <img
            key={`p-${active}`}
            src={slide.person}
            alt={slide.personAlt}
            className="hero-fade absolute bottom-0 left-1/2 z-[1] w-auto max-w-full -translate-x-1/2 object-contain"
            style={{ height: '96%', maxHeight: 660, objectPosition: 'bottom center' }}
            loading={slide.personEager ? 'eager' : 'lazy'}
            draggable={false}
          />

          {/* Balões — no mobile só os 2 últimos */}
          <div key={`c-${active}`} className="hero-fade pointer-events-none absolute inset-0 z-[2]">
            {slide.chips.map((chip, i) => (
              <HeroChip key={i} chip={chip} float={FLOATS[i]} hideOnMobile={i < slide.chips.length - 2} />
            ))}
          </div>
        </div>
      </div>

      {/* Controles do carrossel — centralizados na base do hero (estilo Petina) */}
      <div className="absolute bottom-6 left-1/2 z-[4] flex -translate-x-1/2 items-center gap-3">
        <button type="button" aria-label="Slide anterior" onClick={() => goTo(active - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(244,252,251,0.95)', background: 'rgba(255,255,255,0.06)' }}>
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
          {slides.map((_, i) => (
            <button key={i} role="tab" aria-selected={i === active} aria-label={`Ir para slide ${i + 1}`}
              onClick={() => goTo(i)} className="h-2.5 rounded-full transition-all"
              style={{ width: i === active ? 28 : 10, background: i === active ? '#8fe6c4' : 'rgba(255,255,255,0.5)' }} />
          ))}
        </div>
        <button type="button" aria-label="Próximo slide" onClick={() => goTo(active + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{ border: '1px solid rgba(255,255,255,0.35)', color: 'rgba(244,252,251,0.95)', background: 'rgba(255,255,255,0.06)' }}>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.label}`}</p>
    </section>
  )
}
