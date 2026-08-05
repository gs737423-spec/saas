import { useEffect, useRef, useState } from 'react'
import { Maximize2, X } from 'lucide-react'
import { ctaLabels, marketplaces, specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

interface ShowcaseTab {
  id: string
  navLabel: string
  title: string
  description: string
  image: string
  imageAlt: string
}

// 3 telas REAIS da plataforma (capturadas ao vivo em /app/*, mesma conta
// demo), uma por seção pedida: Visão Geral, Marketplaces, Produtos. Nenhuma
// é screenshot antiga do projeto nem mockup — ver public/site/platform-showcase.
// `navLabel` bate com o nome real dentro do produto/screenshot — só `title`/
// `description` usam a nomenclatura comercial da consultoria.
const tabs: ShowcaseTab[] = [
  {
    id: 'overview',
    navLabel: 'Visão Geral',
    title: 'Visão executiva da operação.',
    description: 'Visualize faturamento, pedidos, ticket médio, comissões, devoluções e evolução da operação.',
    image: '/site/platform-showcase/platform-overview.webp',
    imageAlt: 'Tela Visão Geral da plataforma MKTOnline, mostrando faturamento bruto, pedidos, ticket médio, comissão e faturamento por marketplace',
  },
  {
    id: 'marketplaces',
    navLabel: 'Marketplaces',
    title: 'Análise dos canais.',
    description: 'Compare o desempenho dos marketplaces e entenda quais canais exigem atenção ou apresentam oportunidades.',
    image: '/site/platform-showcase/platform-marketplaces.webp',
    imageAlt: 'Tela Marketplaces da plataforma MKTOnline, comparando receita, ticket médio e comissão entre Mercado Livre, Shopee, Amazon e Loja Própria',
  },
  {
    id: 'products',
    navLabel: 'Produtos',
    title: 'Gestão de produtos.',
    description: 'Acompanhe estoque, vendas, margem, cobertura e comportamento dos produtos.',
    image: '/site/platform-showcase/platform-products.webp',
    imageAlt: 'Tela Produtos da plataforma MKTOnline, com catálogo de SKUs, vendas, estoque, faturamento, margem e tendência',
  },
]

// As 3 imagens têm o mesmo enquadramento (mesmo viewport na captura), então
// a altura do frame não muda entre abas — sem salto de layout.
function preloadImages() {
  tabs.forEach((t) => { const img = new Image(); img.src = t.image })
}

export default function MarketplacesSection() {
  const [active, setActive] = useState(0)
  const [hovering, setHovering] = useState(false)
  const [focused, setFocused] = useState(false)
  const [tabHidden, setTabHidden] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const timerRef = useRef<number | null>(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  useEffect(() => { preloadImages() }, [])

  const paused = hovering || focused || tabHidden || lightboxOpen

  // Autoplay: depende de `active` de propósito — qualquer troca (clique,
  // teclado ou o próprio tick) desmonta o interval antigo e agenda um novo
  // com 2s cheios, o que já garante que o clique manual reinicia a contagem.
  useEffect(() => {
    if (reducedMotion || paused) return
    timerRef.current = window.setInterval(() => setActive((i) => (i + 1) % tabs.length), 2000)
    return () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null } }
  }, [active, paused, reducedMotion])

  // Aba oculta pausa e retoma (setState próprio, não só "stop" como no Hero).
  useEffect(() => {
    const onVisibility = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const goTo = (i: number) => {
    const next = (i + tabs.length) % tabs.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1) }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1) }
  }
  const onBlurSection = (e: React.FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocused(false)
  }
  // Clique de mouse deixa o <button> com foco nativo do navegador (Chrome/
  // Firefox); sem o blur explícito, esse foco residual mantinha `focused`
  // sempre true depois do primeiro clique e travava o autoplay para sempre.
  // Navegação por teclado (goTo) continua focando o próximo tab normalmente.
  const onTabClick = (e: React.MouseEvent<HTMLButtonElement>, i: number) => {
    setActive(i)
    e.currentTarget.blur()
  }

  useEffect(() => {
    if (!lightboxOpen) return
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') setLightboxOpen(false) }
    document.addEventListener('keydown', onKeyDown)
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKeyDown); document.body.style.overflow = overflow }
  }, [lightboxOpen])

  const waHref = whatsappContactUrl('Olá! Quero ver a plataforma da MKTOnline com um especialista.') ?? specialistHref('Olá! Quero ver a plataforma da MKTOnline com um especialista.')
  const tab = tabs[active]

  return (
    <section
      aria-label="A plataforma MKTOnline em uso"
      className="marketplace-showcase"
      onFocus={() => setFocused(true)}
      onBlur={onBlurSection}
    >
      <span id="marketplaces" aria-hidden="true" className="marketplace-showcase__compat-anchor" />
      <div className="site-container site-container--tight marketplace-showcase__intro" style={{ maxWidth: 1220 }}>
        <span className="marketplace-showcase__eyebrow">TECNOLOGIA A SERVIÇO DA CONSULTORIA</span>
        <h2 className="marketplace-showcase__title">Uma plataforma própria para acompanhar a operação junto com o cliente.</h2>
        <p className="marketplace-showcase__desc">
          Como parte dos serviços da MKTOnline, a plataforma reúne os principais indicadores dos marketplaces e cria
          uma visão compartilhada entre gestores e consultores.
        </p>
        <p className="marketplace-showcase__highlight">
          Enquanto a tecnologia organiza o cenário, nossos especialistas ajudam a interpretar o que ele significa
          para o negócio.
        </p>
      </div>

      <div
        id="plataforma"
        className="site-container site-container--tight marketplace-showcase__layout scroll-mt-24"
        style={{ maxWidth: 1220 }}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Coluna esquerda — seletores */}
        <div className="marketplace-showcase__tabs" role="tablist" aria-label="Telas da plataforma MKTOnline" aria-orientation="vertical" onKeyDown={onKeyDown}>
          {tabs.map((t, i) => (
            <button
              key={t.id}
              ref={(el) => { tabRefs.current[i] = el }}
              role="tab"
              id={`mp-tab-${t.id}`}
              aria-selected={i === active}
              aria-controls="mp-tabpanel"
              tabIndex={i === active ? 0 : -1}
              className="marketplace-showcase__tab"
              data-active={i === active}
              onClick={(e) => onTabClick(e, i)}
            >
              <span className="marketplace-showcase__tab-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="marketplace-showcase__tab-body">
                <span className="marketplace-showcase__tab-title">{t.title}</span>
                <span className="marketplace-showcase__tab-desc">{t.description}</span>
              </span>
            </button>
          ))}
          <div className="marketplace-showcase__cta">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              {ctaLabels.plataforma}
            </a>
            <p className="marketplace-showcase__cta-note">Conversa inicial para entender como sua equipe trabalha hoje.</p>
          </div>
        </div>

        {/* Coluna direita — frame proprietário (sem bolinhas de navegador) */}
        <div className="marketplace-showcase__frame">
          <div className="marketplace-showcase__frame-bar">
            <span className="marketplace-showcase__frame-name">{tab.navLabel}</span>
            <span className="marketplace-showcase__frame-meta">Visualização da plataforma</span>
          </div>
          <button
            type="button"
            className="marketplace-showcase__frame-body"
            id="mp-tabpanel"
            role="tabpanel"
            aria-labelledby={`mp-tab-${tab.id}`}
            aria-label="Ampliar screenshot da plataforma"
            onClick={(e) => { setLightboxOpen(true); e.currentTarget.blur() }}
          >
            {tabs.map((t, i) => (
              <img
                key={t.id}
                src={t.image}
                alt={i === active ? t.imageAlt : ''}
                aria-hidden={i === active ? undefined : true}
                className="marketplace-showcase__image"
                data-active={i === active}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            ))}
            <span className="marketplace-showcase__zoom-hint" aria-hidden="true">
              <Maximize2 className="h-4 w-4" />
            </span>
          </button>

          {/* Faixa de logos — decorativa, independente da aba ativa (sem key
              ligada a `active`) para nunca remontar/reiniciar o marquee. */}
          <div className="marketplace-showcase__brands">
            <span className="marketplace-showcase__brands-caption">MARKETPLACES</span>
            <div className="marketplace-showcase__brands-viewport">
              <div className="marketplace-showcase__brands-track">
                {[0, 1].map((copy) => (
                  <ul key={copy} className="marketplace-showcase__brands-set" aria-hidden={copy === 1 || undefined}>
                    {marketplaces.map((m) => (
                      <li key={m.name} className="marketplace-showcase__brand">
                        <img
                          src={m.logoSrc}
                          alt={copy === 0 ? m.name : ''}
                          className="marketplace-showcase__brand-logo"
                          data-brand={m.name}
                          draggable={false}
                        />
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {lightboxOpen && (
        <div
          className="marketplace-showcase__lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${tab.navLabel} — visualização ampliada`}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            className="marketplace-showcase__lightbox-close"
            aria-label="Fechar visualização ampliada"
            onClick={() => setLightboxOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <img
            src={tab.image}
            alt={tab.imageAlt}
            className="marketplace-showcase__lightbox-image"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />
        </div>
      )}
    </section>
  )
}
