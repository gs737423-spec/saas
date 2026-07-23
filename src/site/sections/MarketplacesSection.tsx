import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import { specialistHref } from '@/site/content'
import { whatsappContactUrl } from '@/lib/whatsapp'

interface ShowcaseTab {
  id: string
  navLabel: string
  title: string
  description: string
  outcome: string
  image: string
  imageAlt: string
}

// 3 telas REAIS da plataforma (capturadas ao vivo em /app/*, mesma conta
// demo), uma por seção pedida: Visão Geral, Marketplaces, Produtos. Nenhuma
// é screenshot antiga do projeto nem mockup — ver public/site/platform-showcase.
const tabs: ShowcaseTab[] = [
  {
    id: 'overview',
    navLabel: 'Visão Geral',
    title: 'Veja o resultado da operação em um só lugar.',
    description: 'Faturamento bruto, pedidos, ticket médio, comissão e devoluções reunidos, com o desempenho de cada marketplace logo abaixo.',
    outcome: 'Entenda como a operação está indo sem abrir relatório por relatório.',
    image: '/site/platform-showcase/platform-overview.webp',
    imageAlt: 'Tela Visão Geral da plataforma Vintec, mostrando faturamento bruto, pedidos, ticket médio, comissão e faturamento por marketplace',
  },
  {
    id: 'marketplaces',
    navLabel: 'Marketplaces',
    title: 'Compare o desempenho de cada marketplace.',
    description: 'Veja faturamento, pedidos, ticket médio e comissão de cada canal, com a evolução mês a mês lado a lado.',
    outcome: 'Saiba qual marketplace cresce, qual perde espaço e onde vale a pena investir mais atenção.',
    image: '/site/platform-showcase/platform-marketplaces.webp',
    imageAlt: 'Tela Marketplaces da plataforma Vintec, comparando receita, ticket médio e comissão entre Mercado Livre, Shopee, Amazon e Loja Própria',
  },
  {
    id: 'products',
    navLabel: 'Produtos',
    title: 'Encontre os produtos que merecem atenção.',
    description: 'Compare vendas, estoque, margem e tendência de cada produto para identificar líderes, itens parados e riscos de ruptura.',
    outcome: 'Priorize reposições e decisões comerciais usando a mesma rotina de acompanhamento.',
    image: '/site/platform-showcase/platform-products.webp',
    imageAlt: 'Tela Produtos da plataforma Vintec, com catálogo de SKUs, vendas, estoque, faturamento, margem e tendência',
  },
]

const benefits = [
  { title: 'MENOS BUSCAS MANUAIS', text: 'Pedidos, produtos, estoque e resultados deixam de ficar espalhados entre diferentes sistemas.' },
  { title: 'PRIORIDADES MAIS VISÍVEIS', text: 'A equipe identifica rapidamente quedas, riscos de estoque e diferenças entre marketplaces.' },
  { title: 'DECISÕES COM MAIS CONTEXTO', text: 'Gestores e colaboradores acompanham a mesma informação sem reconstruir relatórios.' },
]

// As 3 imagens têm o mesmo enquadramento (mesmo viewport na captura), então
// a altura do frame não muda entre abas — sem salto de layout.
function preloadImages() {
  tabs.forEach((t) => { const img = new Image(); img.src = t.image })
}

export default function MarketplacesSection() {
  const [active, setActive] = useState(0)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { preloadImages() }, [])

  const goTo = (i: number) => {
    const next = (i + tabs.length) % tabs.length
    setActive(next)
    tabRefs.current[next]?.focus()
  }
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); goTo(active + 1) }
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); goTo(active - 1) }
  }

  const waHref = whatsappContactUrl('Olá! Quero ver a Vintec na minha operação.') ?? specialistHref('Olá! Quero ver a Vintec na minha operação.')
  const tab = tabs[active]

  return (
    <section id="marketplaces" aria-label="A plataforma Vintec em uso" className="marketplace-showcase scroll-mt-24">
      <div className="site-container site-container--tight marketplace-showcase__intro" style={{ maxWidth: 1220 }}>
        <span className="marketplace-showcase__eyebrow">A OPERAÇÃO INTEIRA EM UMA ÚNICA VISÃO</span>
        <h2 className="marketplace-showcase__title">Veja o que acontece em todos os seus marketplaces sem trocar de painel.</h2>
        <p className="marketplace-showcase__desc">
          A Vintec reúne vendas, pedidos, estoque, produtos e resultados de Mercado Livre, Amazon, Shopee e outros canais para sua equipe identificar prioridades e tomar decisões com mais rapidez.
        </p>
      </div>

      <div className="site-container site-container--tight marketplace-showcase__layout" style={{ maxWidth: 1220 }}>
        {/* Coluna esquerda — seletores */}
        <div className="marketplace-showcase__tabs" role="tablist" aria-label="Telas da plataforma Vintec" aria-orientation="vertical" onKeyDown={onKeyDown}>
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
              onClick={() => setActive(i)}
            >
              <span className="marketplace-showcase__tab-index">{String(i + 1).padStart(2, '0')}</span>
              <span className="marketplace-showcase__tab-body">
                <span className="marketplace-showcase__tab-title">{t.title}</span>
                <span className="marketplace-showcase__tab-desc">{t.description}</span>
                <span className="marketplace-showcase__tab-outcome">{t.outcome}</span>
              </span>
            </button>
          ))}
        </div>

        {/* Coluna direita — frame proprietário (sem bolinhas de navegador) */}
        <div className="marketplace-showcase__frame">
          <div className="marketplace-showcase__frame-bar">
            <span className="marketplace-showcase__frame-name">{tab.navLabel}</span>
            <span className="marketplace-showcase__frame-meta">Visualização da plataforma</span>
            <span className="marketplace-showcase__frame-demo">Demonstração</span>
          </div>
          <div className="marketplace-showcase__frame-body" id="mp-tabpanel" role="tabpanel" aria-labelledby={`mp-tab-${tab.id}`}>
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
          </div>
        </div>
      </div>

      {/* Faixa de benefícios */}
      <div className="site-container site-container--tight marketplace-showcase__benefits" style={{ maxWidth: 1220 }}>
        {benefits.map((b) => (
          <div key={b.title} className="marketplace-showcase__benefit">
            <span className="marketplace-showcase__benefit-title">{b.title}</span>
            <p className="marketplace-showcase__benefit-text">{b.text}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="site-container site-container--tight marketplace-showcase__cta" style={{ maxWidth: 1220 }}>
        <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
          Quero ver a Vintec na minha operação <ArrowRight className="h-4 w-4" />
        </a>
        <p className="marketplace-showcase__cta-note">Conversa inicial para entender como sua equipe trabalha hoje.</p>
      </div>
    </section>
  )
}
