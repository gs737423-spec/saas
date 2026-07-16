import { useEffect, useRef, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import PersonPhotoSlot from '@/site/components/PersonPhotoSlot'
import { marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

interface Slide {
  eyebrow: string
  title: React.ReactNode
  text: string
  chips: string[]
  ctaLabel: string
  ctaSecondary: string
  photoId: string
  waMessage: string
}

// Todos os 3 slides vendem a mesma proposta (Vintec: operação multicanal
// conectada por API) sob ângulos diferentes — nunca ofertas distintas.
const slides: Slide[] = [
  {
    eyebrow: 'Operação multicanal',
    title: <>Centralize seus marketplaces em <span style={{ color: 'var(--s-teal)' }}>uma única operação</span>.</>,
    text: 'A Vintec ajuda sua empresa a acompanhar os principais canais com mais organização, clareza e controle — tudo conectado por API.',
    chips: ['Mercado Livre', 'Amazon', 'Shopee', 'Leroy Merlin', 'Operação centralizada'],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Conheça as soluções',
    photoId: 'hero-pessoa-tablet',
    waMessage: 'Olá! Gostaria de conhecer a Vintec e entender como ela pode ajudar na minha operação de marketplaces.',
  },
  {
    eyebrow: 'Clareza operacional',
    title: <>Mais clareza para <span style={{ color: 'var(--s-teal)' }}>vender, decidir e crescer</span>.</>,
    text: 'Tenha uma visão mais organizada da operação multicanal e entenda melhor o que impacta o seu negócio.',
    chips: ['Mais controle', 'Mais organização', 'Mais eficiência', 'Decisões melhores'],
    ctaLabel: 'Solicitar contato',
    ctaSecondary: 'Ver como funciona',
    photoId: 'hero-pessoa-notebook',
    waMessage: 'Olá! Gostaria de solicitar um contato sobre a Vintec.',
  },
  {
    eyebrow: 'Estrutura pensada para crescer',
    title: <>Uma estrutura pensada para <span style={{ color: 'var(--s-teal)' }}>operações que vendem em marketplaces</span>.</>,
    text: 'A Vintec reúne tecnologia, processos e clareza para empresas que querem operar melhor e crescer com mais segurança.',
    chips: ['Conexões via API', 'Operação multicanal', 'Acompanhamento claro', 'Estrutura escalável'],
    ctaLabel: 'Fale com um especialista',
    ctaSecondary: 'Ver como funciona',
    photoId: 'hero-pessoa-celular',
    waMessage: 'Olá! Gostaria de entender melhor a estrutura da Vintec para operações multicanal.',
  },
]

const AUTOPLAY_MS = 8000

export default function Hero() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const timerRef = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  useEffect(() => {
    if (reducedMotion || paused) return
    const onVisibility = () => {
      if (document.hidden && timerRef.current) {
        window.clearInterval(timerRef.current)
        timerRef.current = null
      } else if (!document.hidden && !timerRef.current) {
        timerRef.current = window.setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS)
      }
    }
    timerRef.current = window.setInterval(() => setActive((i) => (i + 1) % slides.length), AUTOPLAY_MS)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
      timerRef.current = null
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [paused, reducedMotion])

  function goTo(i: number) {
    setActive((i + slides.length) % slides.length)
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowRight') goTo(active + 1)
    if (e.key === 'ArrowLeft') goTo(active - 1)
  }

  const touchStartX = useRef<number | null>(null)
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX }
  function onTouchEnd(e: React.TouchEvent) {
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
      className="relative overflow-hidden"
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
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(1000px 540px at 82% -10%, rgba(20,135,125,0.16), transparent 62%), radial-gradient(760px 540px at 2% 4%, rgba(76,130,247,0.1), transparent 58%)' }} />

      {/* Primeiro slide renderizado direto no HTML — nada depende de JS pra aparecer */}
      <div className="site-container relative grid items-center gap-10 py-9 md:py-10 lg:grid-cols-[42fr_58fr] lg:gap-12 lg:py-14">
        <div className="max-w-xl" style={{ minHeight: 320 }}>
          <span className="site-label mb-5" style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', padding: '6px 12px', borderRadius: 999 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--s-teal)', display: 'inline-block' }} />
            {slide.eyebrow}
          </span>

          <h1 className="site-display" style={{ color: 'var(--s-ink)' }}>{slide.title}</h1>
          <p className="site-lead mt-5">{slide.text}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {slide.ctaLabel} <ArrowRight className="h-4 w-4" />
            </a>
            <a href="#servicos" className="btn btn-ghost">{slide.ctaSecondary}</a>
          </div>

          {/* Controles do slider */}
          <div className="mt-8 flex items-center gap-3">
            <button type="button" aria-label="Slide anterior" onClick={() => goTo(active - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full" style={{ border: '1px solid var(--s-line-strong)', color: 'var(--s-ink-soft)' }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2" role="tablist" aria-label="Slides">
              {slides.map((_, i) => (
                <button
                  key={i}
                  role="tab"
                  aria-selected={i === active}
                  aria-label={`Ir para slide ${i + 1}`}
                  onClick={() => goTo(i)}
                  className="h-2 rounded-full transition-all"
                  style={{ width: i === active ? 22 : 8, background: i === active ? 'var(--s-teal)' : 'var(--s-line-strong)' }}
                />
              ))}
            </div>
            <button type="button" aria-label="Próximo slide" onClick={() => goTo(active + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full" style={{ border: '1px solid var(--s-line-strong)', color: 'var(--s-ink-soft)' }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Foto humanizada + balões dos marketplaces — altura fixa, sem layout shift entre slides */}
        <div className="relative" style={{ minHeight: 380 }}>
          <span aria-hidden="true" className="ambient-halo" style={{ width: 260, height: 260, top: -40, right: -30, background: 'radial-gradient(circle, rgba(20,135,125,0.30), transparent 70%)' }} />
          <span aria-hidden="true" className="ambient-halo" style={{ width: 220, height: 220, bottom: -30, left: -20, background: 'radial-gradient(circle, rgba(76,130,247,0.20), transparent 70%)', animationDelay: '2.5s' }} />
          <PersonPhotoSlot
            id={slide.photoId}
            src="/site/people/processed/vintec-hero-tablet.webp"
            alt="Pessoa segurando um tablet, representando a operação acompanhada pela Vintec"
            ratio="4 / 5"
            className="mx-auto max-w-sm"
          />

          {/* Balões flutuantes com os marketplaces + capacidades */}
          <div className="pointer-events-none absolute inset-0">
            {slide.chips.slice(0, 3).map((c, i) => {
              const Logo = marketplaces.find((m) => m.name === c)?.Logo
              const pos = [
                { top: '8%', left: '-4%' },
                { top: '42%', right: '-6%' },
                { bottom: '10%', left: '2%' },
              ][i]
              return (
                <span
                  key={c}
                  aria-hidden="true"
                  className={`site-card absolute flex items-center gap-2 px-3 py-2 ${i % 2 === 0 ? 'hero-float-a' : 'hero-float-b'}`}
                  style={{ ...pos, borderRadius: 999, fontSize: 12.5, fontWeight: 700, color: 'var(--s-ink)' }}
                >
                  {Logo ? <Logo /> : <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--s-teal)' }} />}
                  {c}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">{`Slide ${active + 1} de ${slides.length}: ${slide.eyebrow}`}</p>
    </section>
  )
}
