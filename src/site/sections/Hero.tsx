import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Wallet, ShoppingCart, Percent, Boxes, Network, Building2, Activity, Plug, type LucideIcon } from 'lucide-react'
import { marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

function mpBrand(name: string) {
  return marketplaces.find((m) => m.name === name)
}

type Chip =
  | { kind: 'brand'; mp: string; pos: CSSProperties; float: string }
  | { kind: 'kpi'; label: string; icon: LucideIcon; pos: CSSProperties; float: string }

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

// 4 âncoras assimétricas ao redor da pessoa (coluna alta, pessoa ancorada na
// base). Evitam rosto (topo-centro) e mãos/dispositivo (centro). Mesmas
// posições nos 3 slides — a composição muda pelo conteúdo dos balões.
const POS = {
  a: { top: '11%', left: '3%' } as CSSProperties, // superior-esquerda
  b: { top: '25%', right: '1%' } as CSSProperties, // superior-direita
  c: { top: '54%', left: '0%' } as CSSProperties, // meio-esquerda
  d: { bottom: '15%', right: '3%' } as CSSProperties, // inferior-direita
}

// 3 slides, 3 composições reais (pessoa + label + headline + subtítulo +
// balões diferentes). Ordem das pessoas: tablet (mulher), notebook (homem),
// smartphone (homem) — recortes reprocessados com fundo transparente real.
const slides: Slide[] = [
  {
    eyebrow: 'Gestão multicanal',
    title: <>Uma operação.<br />Todos os seus marketplaces.</>,
    sub: 'Mercado Livre, Amazon, Shopee e Leroy Merlin conectados por API para você acompanhar tudo com mais clareza.',
    person: '/site/people/processed/vintec-hero-tablet.webp',
    personAlt: 'Profissional segurando um tablet, representando a operação multicanal acompanhada pela Vintec',
    chips: [
      { kind: 'brand', mp: 'Mercado Livre', pos: POS.a, float: 'hero-float-a' },
      { kind: 'brand', mp: 'Amazon', pos: POS.b, float: 'hero-float-b' },
      { kind: 'brand', mp: 'Shopee', pos: POS.c, float: 'hero-float-c' },
      { kind: 'brand', mp: 'Leroy Merlin', pos: POS.d, float: 'hero-float-d' },
    ],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Conheça as soluções',
    waMessage: 'Olá! Gostaria de conhecer a Vintec e entender como ela conecta meus marketplaces por API.',
  },
  {
    eyebrow: 'Visão centralizada',
    title: <>Decida sem<br />trocar de painel.</>,
    sub: 'Reúna faturamento, pedidos, margem, estoque e produtos em uma leitura única da operação.',
    person: '/site/people/processed/vintec-banner-laptop.webp',
    personAlt: 'Profissional com um notebook, ilustrando a leitura única da operação na Vintec',
    chips: [
      { kind: 'kpi', label: 'Faturamento', icon: Wallet, pos: POS.a, float: 'hero-float-a' },
      { kind: 'kpi', label: 'Pedidos', icon: ShoppingCart, pos: POS.b, float: 'hero-float-b' },
      { kind: 'kpi', label: 'Margem', icon: Percent, pos: POS.c, float: 'hero-float-c' },
      { kind: 'kpi', label: 'Estoque', icon: Boxes, pos: POS.d, float: 'hero-float-d' },
    ],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Ver como funciona',
    waMessage: 'Olá! Gostaria de entender como a Vintec reúne faturamento, pedidos e estoque em uma leitura só.',
  },
  {
    eyebrow: 'Crescimento organizado',
    title: <>Mais canais,<br />sem perder o controle.</>,
    sub: 'Estruture sua operação multicanal para crescer com dados organizados, prioridades claras e acompanhamento próximo.',
    person: '/site/people/processed/vintec-banner-smartphone.webp',
    personAlt: 'Profissional com um smartphone, ilustrando o acompanhamento próximo da operação com a Vintec',
    chips: [
      { kind: 'kpi', label: 'Operação conectada', icon: Network, pos: POS.a, float: 'hero-float-a' },
      { kind: 'kpi', label: 'API', icon: Plug, pos: POS.b, float: 'hero-float-b' },
      { kind: 'kpi', label: 'Acompanhamento', icon: Activity, pos: POS.c, float: 'hero-float-c' },
      { kind: 'kpi', label: 'Dados organizados', icon: Building2, pos: POS.d, float: 'hero-float-d' },
    ],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Ver como funciona',
    waMessage: 'Olá! Gostaria de estruturar minha operação multicanal com a Vintec para crescer com mais controle.',
  },
]

const AUTOPLAY_MS = 7500

function HeroChip({ chip, hideOnMobile }: { chip: Chip; hideOnMobile?: boolean }) {
  const mob = hideOnMobile ? ' hero-balloon--hide-mobile' : ''
  if (chip.kind === 'brand') {
    const brand = mpBrand(chip.mp)
    // Logo oficial inteira (já contém o nome da marca) — object-fit: contain,
    // proporção preservada, sem texto de nome separado (evita duplicar).
    return (
      <span aria-hidden="true" className={`hero-balloon hero-balloon--brand absolute ${chip.float}${mob}`} style={chip.pos}>
        {brand ? <img src={brand.logoSrc} alt={chip.mp} className="hero-balloon__img" style={{ height: brand.logoH }} /> : null}
      </span>
    )
  }
  const Icon = chip.icon
  return (
    <span aria-hidden="true" className={`hero-balloon hero-balloon--kpi absolute ${chip.float}${mob}`} style={chip.pos}>
      <span className="hero-balloon__ico"><Icon className="h-[18px] w-[18px]" /></span>
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
      <div className="site-container site-container--tight grid items-end gap-10 pt-24 md:pt-24 lg:grid-cols-[42fr_58fr] lg:gap-10 lg:pt-24">
        {/* Texto */}
        <div key={`t-${active}`} className="hero-fade max-w-xl pb-12 md:pb-14 lg:pb-20">
          <span
            className="mb-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12.5px] font-semibold"
            style={{ background: 'rgba(105,201,149,0.16)', border: '1px solid rgba(105,201,149,0.36)', color: '#B8F0DC' }}
          >
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#69c995', display: 'inline-block' }} />
            {slide.eyebrow}
          </span>

          <h1 className="font-extrabold" style={{ color: '#F4FCFB', fontSize: 'clamp(2.2rem, 3.7vw, 3.55rem)', lineHeight: 1.02, letterSpacing: '-0.03em' }}>
            {slide.title}
          </h1>

          <p className="mt-5 max-w-[520px] text-[1.15rem]" style={{ color: 'rgba(223,240,237,0.88)', lineHeight: 1.55 }}>
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

        {/* Pessoa ancorada na base + composição (altura fixa, sem layout shift).
            Coluna encosta no fundo da hero (items-end + sem pb) — pessoa apoiada. */}
        <div className="relative mx-auto h-[400px] w-full max-w-[560px] sm:h-[460px] lg:h-[512px]">
          {/* Forma orgânica de apoio atrás da pessoa */}
          <span className="hero-shape" style={{ width: '92%', height: '80%', top: '3%', left: '52%', transform: 'translateX(-50%)' }} />
          {/* Sombra de contato na base */}
          <span className="hero-contact-shadow" />

          {/* Pessoa muda por slide */}
          <div key={`p-${active}`} className="hero-fade absolute inset-x-0 bottom-0 z-[1] flex justify-center">
            <img
              src={slide.person}
              alt={slide.personAlt}
              className="max-h-[400px] w-auto object-contain sm:max-h-[460px] lg:max-h-[512px]"
              draggable={false}
            />
          </div>

          {/* Balões — no mobile só os 2 laterais (índices 2 e 3), pra não
              cobrir rosto nem poluir; no sm+ os 4. */}
          <div key={`c-${active}`} className="hero-fade pointer-events-none absolute inset-0 z-[2]">
            {slide.chips.map((chip, i) => (
              <HeroChip key={i} chip={chip} hideOnMobile={i < 2} />
            ))}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.eyebrow}`}</p>
    </section>
  )
}
