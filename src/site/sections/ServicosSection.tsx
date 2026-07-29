import { ctaLabels, specialistHref } from '@/site/content'

interface Service {
  label: string
  text: string
}

const services: Service[] = [
  { label: 'DIAGNÓSTICO E DIREÇÃO ESTRATÉGICA', text: 'Analisamos a operação, identificamos gargalos e ajudamos a definir quais problemas e oportunidades devem receber atenção primeiro.' },
  { label: 'ACOMPANHAMENTO DE PERFORMANCE', text: 'Avaliamos faturamento, margem, pedidos, estoque, produtos e desempenho dos canais para apoiar decisões da gestão.' },
  { label: 'DESENVOLVIMENTO DE MARKETPLACES', text: 'Ajudamos a empresa a entender o papel de cada canal, identificar oportunidades e organizar prioridades para crescer com mais controle.' },
  { label: 'PLATAFORMA DE GESTÃO MKTONLINE', text: 'Disponibilizamos uma plataforma própria para consolidar os principais indicadores e apoiar o acompanhamento realizado entre consultores e gestores.' },
]

// Serviços da consultoria — substitui de vez a antiga ExperienceSection.
// A MKTOnline é consultoria; a plataforma é um dos 4 serviços (o último), não
// uma seção-argumento própria. Painel único: título+texto à esquerda,
// 4 serviços em grade 2×2 à direita, sem cards grandes/numeração/timeline.
export default function ServicosSection() {
  const waHref = specialistHref('Olá! Quero conversar sobre a minha operação com a MKTOnline.')

  return (
    <section id="servicos" className="sec-dark-flat servicos-section scroll-mt-24">
      <div className="site-container site-container--tight servicos-container" style={{ maxWidth: 1200 }}>
        <span className="servicos-eyebrow">COMO A MKTONLINE PODE AJUDAR</span>

        <div className="servicos-panel">
          <div className="servicos-panel__intro">
            <h2 className="servicos-panel__title">
              Consultoria que participa da operação, não apenas entrega recomendações.
            </h2>
            <p className="servicos-panel__text">
              Cada empresa possui desafios diferentes. Por isso, a MKTOnline começa entendendo o cenário atual e
              estrutura o acompanhamento de acordo com os canais, objetivos e prioridades do negócio.
            </p>
          </div>

          <div className="servicos-grid">
            {services.map((s) => (
              <div key={s.label} className="servicos-item">
                <span className="servicos-item__label">{s.label}</span>
                <p className="servicos-item__text">{s.text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="servicos-closing">
          A tecnologia faz parte da entrega. O principal valor está na experiência aplicada às decisões da empresa.
        </p>

        <div className="servicos-cta">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            {ctaLabels.contexto}
          </a>
          <span className="servicos-cta-note">Conversa inicial, sem compromisso.</span>
        </div>
      </div>
    </section>
  )
}
