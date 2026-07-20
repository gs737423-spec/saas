import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Plug, Database, Share2, Wallet, Percent, Boxes, Activity, type LucideIcon } from 'lucide-react'
import { marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

function mp(name: string) {
  return marketplaces.find((m) => m.name === name)
}

// Balão: logo oficial de marketplace (slide 1) OU conceito curto (slides 2/3).
type Chip =
  | { kind: 'logo'; name: string; pos: CSSProperties; float: string }
  | { kind: 'concept'; label: string; icon: LucideIcon; pos: CSSProperties; float: string }

interface Slide {
  label: string
  title: React.ReactNode
  sub: string
  person: string
  personAlt: string
  // Cores das formas orgânicas (2 preenchidas + 1 contorno) por slide.
  b1: string
  b2: string
  chips: Chip[]
  waMessage: string
}

// Posições assimétricas — evitam rosto (topo-centro) e mãos/dispositivo (centro).
const P = {
  tl: { top: '9%', left: '-5%' } as CSSProperties,
  tr: { top: '19%', right: '-5%' } as CSSProperties,
  ml: { top: '50%', left: '-7%' } as CSSProperties,
  br: { bottom: '13%', right: '-3%' } as CSSProperties,
}
const P3 = {
  tr: { top: '14%', right: '-4%' } as CSSProperties,
  ml: { top: '47%', left: '-6%' } as CSSProperties,
  br: { bottom: '15%', right: '-2%' } as CSSProperties,
}

const slides: Slide[] = [
  {
    label: 'GESTÃO DE MARKETPLACES',
    title: <>Todos os seus marketplaces em um só lugar.</>,
    sub: 'Acompanhe pedidos, estoque, vendas e desempenho sem depender de várias telas.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional com um tablet, representando a gestão de marketplaces em um só lugar com a Vintec',
    b1: '#8ee2a9', b2: '#67cbd0',
    chips: [
      { kind: 'logo', name: 'Mercado Livre', pos: P.tl, float: 'hero-float-a' },
      { kind: 'logo', name: 'Amazon', pos: P.tr, float: 'hero-float-b' },
      { kind: 'logo', name: 'Shopee', pos: P.ml, float: 'hero-float-c' },
      { kind: 'logo', name: 'Leroy Merlin', pos: P.br, float: 'hero-float-d' },
    ],
    waMessage: 'Olá! Gostaria de conhecer a Vintec e reunir meus marketplaces em um só lugar.',
  },
  {
    label: 'RESULTADOS MAIS CLAROS',
    title: <>Entenda o que vende e onde sua empresa está crescendo.</>,
    sub: 'Compare seus canais e encontre rapidamente o que precisa da sua atenção.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, ilustrando resultados mais claros da operação na Vintec',
    b1: '#67cbd0', b2: '#8ec9e6',
    chips: [
      { kind: 'concept', label: 'Conexão por API', icon: Plug, pos: P3.tr, float: 'hero-float-a' },
      { kind: 'concept', label: 'Dados organizados', icon: Database, pos: P3.ml, float: 'hero-float-c' },
      { kind: 'concept', label: 'Canais conectados', icon: Share2, pos: P3.br, float: 'hero-float-b' },
    ],
    waMessage: 'Olá! Gostaria de entender melhor os resultados da minha operação com a Vintec.',
  },
  {
    label: 'ROTINA MAIS ORGANIZADA',
    title: <>Mais canais. Menos bagunça no dia a dia.</>,
    sub: 'Reúna as informações dos marketplaces e trabalhe com mais clareza e controle.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, ilustrando uma rotina mais organizada com a Vintec',
    b1: '#cae86b', b2: '#8ee2a9',
    chips: [
      { kind: 'concept', label: 'Faturamento', icon: Wallet, pos: P3.tr, float: 'hero-float-a' },
      { kind: 'concept', label: 'Margem', icon: Percent, pos: P3.ml, float: 'hero-float-c' },
      { kind: 'concept', label: 'Estoque', icon: Boxes, pos: P3.br, float: 'hero-float-b' },
    ],
    waMessage: 'Olá! Gostaria de organizar a rotina da minha operação multicanal com a Vintec.',
  },
]

const AUTOPLAY_MS = 5000

function HeroChip({ chip, hideOnMobile }: { chip: Chip; hideOnMobile?: boolean }) {
  const mob = hideOnMobile ? ' hero-tile--hide-mobile' : ''
  if (chip.kind === 'logo') {
    const brand = mp(chip.name)
    return (
      <span aria-hidden="true" className={`hero-logo absolute ${chip.float}${mob}`} style={chip.pos}>
        {brand ? <img src={brand.logoSrc} alt="" style={{ height: brand.logoH, maxWidth: 148 }} /> : null}
      </span>
    )
  }
  const Icon = chip.icon
  return (
    <span aria-hidden="true" className={`hero-chip absolute ${chip.float}${mob}`} style={chip.pos}>
      <Icon className="h-[15px] w-[15px]" strokeWidth={2} />
      {chip.label}
    </span>
  )
}

// 2 formas orgânicas preenchidas + 1 contorno (cores por slide).
function HeroShapes({ b1, b2 }: { b1: string; b2: string }) {
  return (
    <div className="hero-shapes" style={{ ['--b1' as string]: b1, ['--b2' as string]: b2 }} aria-hidden="true">
      <span className="hero-blob hero-blob--a" />
      <span className="hero-blob hero-blob--b" />
      <span className="hero-blob hero-blob--c" />
    </div>
  )
}

export default function Hero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  // Autoplay 5s. Depende de `active` → toda troca (manual OU automática) limpa
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
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="site-container site-container--tight grid items-end gap-8 pt-24 lg:grid-cols-[44fr_56fr] lg:gap-10 lg:pt-24">
        {/* Texto */}
        <div key={`t-${active}`} className="hero-fade max-w-xl pb-14 md:pb-16 lg:pb-24">
          <span className="mb-4 inline-block text-[12.5px] font-bold uppercase" style={{ color: '#8FE6C4', letterSpacing: '0.14em' }}>
            {slide.label}
          </span>

          <h1 className="font-extrabold" style={{ color: '#F4FCFB', fontSize: 'clamp(2.1rem, 3.3vw, 3.3rem)', lineHeight: 1.04, letterSpacing: '-0.03em', maxWidth: 520 }}>
            {slide.title}
          </h1>

          <p className="mt-4 max-w-[500px] text-[1.12rem]" style={{ color: 'rgba(223,240,237,0.9)', lineHeight: 1.5 }}>
            {slide.sub}
          </p>

          <div className="mt-7">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.9rem 1.7rem', fontSize: '1rem' }}>
              Fale com um especialista <ArrowRight className="h-[18px] w-[18px]" />
            </a>
          </div>
        </div>

        {/* Pessoa ancorada na base + formas orgânicas + balões */}
        <div className="relative mx-auto h-[440px] w-full max-w-[600px] sm:h-[500px] lg:h-[600px]">
          <HeroShapes b1={slide.b1} b2={slide.b2} />
          <span className="hero-contact-shadow" />

          <div key={`p-${active}`} className="hero-fade absolute inset-x-0 bottom-0 z-[1] flex justify-center">
            <img
              src={slide.person}
              alt={slide.personAlt}
              className="max-h-[440px] w-auto object-contain sm:max-h-[500px] lg:max-h-[620px]"
              style={{ objectPosition: 'bottom center' }}
              loading={active === 0 ? 'eager' : 'lazy'}
              draggable={false}
            />
          </div>

          <div key={`c-${active}`} className="hero-fade pointer-events-none absolute inset-0 z-[2]">
            {slide.chips.map((chip, i) => (
              <HeroChip key={i} chip={chip} hideOnMobile={i >= 2} />
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
