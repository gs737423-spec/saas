import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

function mpLogo(name: string) {
  return marketplaces.find((m) => m.name === name)?.Logo
}

type Chip =
  | { mp: string; pos: CSSProperties; float: string }
  | { label: string; tone: string; pos: CSSProperties; float: string }

interface Slide {
  eyebrow: string
  title: React.ReactNode
  sub: string
  person: string
  personAlt: string
  chips: Chip[]
  ctaLabel: string
  ctaSecondary: string
  waMessage: string
}

// 3 slides, mesma proposta (Vintec: operação multicanal por API) sob ângulos
// diferentes — centralização, clareza, decisão. Cada slide troca pessoa,
// headline curta e arranjo de chips.
const slides: Slide[] = [
  {
    eyebrow: 'Operação multicanal',
    title: <>Todos os seus canais.<br />Uma só operação.</>,
    sub: 'Mercado Livre, Amazon, Shopee e Leroy Merlin conectados por API em uma estrutura só.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Pessoa segurando um tablet, representando a operação multicanal acompanhada pela Vintec',
    chips: [
      { mp: 'Mercado Livre', pos: { top: '4%', left: '-6%' }, float: 'hero-float-a' },
      { mp: 'Amazon', pos: { top: '20%', right: '-7%' }, float: 'hero-float-b' },
      { mp: 'Shopee', pos: { bottom: '24%', left: '-9%' }, float: 'hero-float-c' },
      { mp: 'Leroy Merlin', pos: { bottom: '6%', right: '-4%' }, float: 'hero-float-d' },
      { label: 'Operação conectada', tone: '#1FB9A8', pos: { top: '48%', left: '-12%' }, float: 'hero-float-b' },
    ],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Conheça as soluções',
    waMessage: 'Olá! Gostaria de conhecer a Vintec e entender como ela pode ajudar na minha operação de marketplaces.',
  },
  {
    eyebrow: 'Clareza operacional',
    title: <>Mais clareza para<br />acompanhar tudo.</>,
    sub: 'Pedidos, produtos e estoque de todos os canais organizados em uma única visão executiva.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Pessoa segurando um notebook, ilustrando o acompanhamento da operação na Vintec',
    chips: [
      { label: 'Visão centralizada', tone: '#1FB9A8', pos: { top: '6%', left: '-8%' }, float: 'hero-float-a' },
      { mp: 'Mercado Livre', pos: { top: '22%', right: '-6%' }, float: 'hero-float-b' },
      { label: 'Pedidos', tone: '#4C82F7', pos: { top: '50%', left: '-11%' }, float: 'hero-float-c' },
      { mp: 'Shopee', pos: { bottom: '20%', right: '-7%' }, float: 'hero-float-d' },
      { label: 'Estoque', tone: '#E9A83A', pos: { bottom: '5%', left: '-3%' }, float: 'hero-float-b' },
    ],
    ctaLabel: 'Solicitar contato',
    ctaSecondary: 'Ver como funciona',
    waMessage: 'Olá! Gostaria de entender como a Vintec dá mais clareza para a operação multicanal.',
  },
  {
    eyebrow: 'Decisão com controle',
    title: <>Decida com controle<br />da operação.</>,
    sub: 'Uma leitura executiva para priorizar onde agir primeiro e crescer com mais segurança.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Pessoa segurando um smartphone, ilustrando o contato e a decisão apoiada pela Vintec',
    chips: [
      { label: 'Desempenho', tone: '#1FB9A8', pos: { top: '5%', left: '-7%' }, float: 'hero-float-a' },
      { mp: 'Amazon', pos: { top: '24%', right: '-6%' }, float: 'hero-float-b' },
      { mp: 'Leroy Merlin', pos: { top: '52%', left: '-11%' }, float: 'hero-float-c' },
      { label: 'API', tone: '#4C82F7', pos: { bottom: '22%', right: '-5%' }, float: 'hero-float-d' },
      { label: 'Decisão', tone: '#12B981', pos: { bottom: '6%', left: '-2%' }, float: 'hero-float-b' },
    ],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Ver como funciona',
    waMessage: 'Olá! Gostaria de entender como a Vintec apoia a decisão sobre a minha operação multicanal.',
  },
]

const AUTOPLAY_MS = 8000

function HeroChip({ chip }: { chip: Chip }) {
  const common = `hero-chip absolute ${chip.float}`
  if ('mp' in chip) {
    const Logo = mpLogo(chip.mp)
    return (
      <span aria-hidden="true" className={common} style={chip.pos}>
        <span className="hero-chip__mp">{Logo ? <Logo /> : null}</span>
        {chip.mp}
      </span>
    )
  }
  return (
    <span aria-hidden="true" className={common} style={chip.pos}>
      <span className="hero-chip__dot" style={{ background: chip.tone }} />
      {chip.label}
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
      {/* Orbs de profundidade */}
      <span className="hero-orb" style={{ width: 420, height: 420, top: -120, right: 40, background: 'radial-gradient(circle, rgba(31,185,168,0.4), transparent 70%)' }} />
      <span className="hero-orb" style={{ width: 360, height: 360, bottom: -140, left: -60, background: 'radial-gradient(circle, rgba(76,130,247,0.28), transparent 70%)' }} />

      <div className="site-container grid items-center gap-10 pb-14 pt-28 md:pb-20 md:pt-32 lg:grid-cols-[46fr_54fr] lg:gap-8 lg:pb-24 lg:pt-36">
        {/* Texto */}
        <div key={`t-${active}`} className="hero-fade max-w-xl">
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={{ background: 'rgba(31,185,168,0.14)', border: '1px solid rgba(31,185,168,0.3)', color: '#7EE8DA' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#1FB9A8', display: 'inline-block' }} />
            {slide.eyebrow}
          </span>

          <h1 className="font-extrabold tracking-tight" style={{ color: '#F4FCFB', fontSize: 'clamp(2.3rem, 4.6vw, 3.9rem)', lineHeight: 1.04, letterSpacing: '-0.03em' }}>
            {slide.title}
          </h1>

          <p className="mt-5 max-w-md text-[1.05rem]" style={{ color: 'rgba(214,235,232,0.82)', lineHeight: 1.55 }}>
            {slide.sub}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem', fontSize: '0.98rem' }}>
              {slide.ctaLabel} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#servicos" className="btn btn-glass" style={{ padding: '0.85rem 1.4rem' }}>{slide.ctaSecondary}</a>
          </div>

          {/* Controles do slider */}
          <div className="mt-9 flex items-center gap-3">
            <button type="button" aria-label="Slide anterior" onClick={() => goTo(active - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(234,244,243,0.85)' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
              {slides.map((_, i) => (
                <button key={i} role="tab" aria-selected={i === active} aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => goTo(i)} className="h-2 rounded-full transition-all"
                  style={{ width: i === active ? 26 : 8, background: i === active ? '#1FB9A8' : 'rgba(255,255,255,0.25)' }} />
              ))}
            </div>
            <button type="button" aria-label="Próximo slide" onClick={() => goTo(active + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
              style={{ border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(234,244,243,0.85)' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Pessoa + composição (altura fixa, sem layout shift) */}
        <div className="relative mx-auto w-full max-w-[520px]" style={{ minHeight: 560 }}>
          {/* Anéis concêntricos + glow atrás */}
          <span className="hero-ring" style={{ width: 520, height: 520, top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }} />
          <span className="hero-ring" style={{ width: 380, height: 380, top: '50%', left: '50%', transform: 'translate(-50%,-50%)', borderColor: 'rgba(31,185,168,0.26)' }} />
          <span className="hero-orb" style={{ width: 340, height: 340, top: '46%', left: '50%', transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle, rgba(31,185,168,0.34), transparent 68%)' }} />

          {/* Pessoa muda por slide */}
          <div key={`p-${active}`} className="hero-fade absolute inset-x-0 bottom-0 flex justify-center">
            <img
              src={slide.person}
              alt={slide.personAlt}
              className="max-h-[560px] w-auto object-contain"
              style={{ filter: 'drop-shadow(0 30px 50px rgba(0,0,0,0.45))' }}
              draggable={false}
            />
          </div>

          {/* Chips glass — escondidos em telas muito estreitas pra não poluir */}
          <div key={`c-${active}`} className="hero-fade pointer-events-none absolute inset-0 hidden sm:block">
            {slide.chips.map((chip, i) => (
              <HeroChip key={i} chip={chip} />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.eyebrow}`}</p>
    </section>
  )
}
