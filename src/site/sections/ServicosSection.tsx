import { specialistHref } from '@/site/content'

interface Service {
  label: string
  text: string
}

const services: Service[] = [
  { label: 'ENTENDIMENTO CONTÍNUO E DIREÇÃO ESTRATÉGICA', text: 'Conhecemos profundamente a realidade da operação, definimos prioridades junto com a empresa e ajustamos o caminho conforme o negócio e o mercado evoluem.' },
  { label: 'ACOMPANHAMENTO PRÓXIMO DA PERFORMANCE', text: 'Acompanhamos faturamento, margem, pedidos, estoque, produtos e canais de forma recorrente, apoiando decisões e antecipando pontos que exigem atenção.' },
  { label: 'EVOLUÇÃO DOS MARKETPLACES', text: 'Desenvolvemos cada canal de forma progressiva, organizando processos, identificando oportunidades e realizando ajustes contínuos para crescer com mais controle.' },
  { label: 'TECNOLOGIA QUE CONECTA A PARCERIA', text: 'A plataforma MKTOnline reúne os principais indicadores e cria uma visão compartilhada entre consultores, gestores e equipes durante toda a parceria.' },
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
        <span className="servicos-eyebrow">COMO A MKTONLINE CAMINHA COM A SUA EMPRESA</span>

        <div className="servicos-panel">
          <div className="servicos-panel__intro">
            <h2 className="servicos-panel__title">
              Mais do que consultoria, uma parceria presente em cada fase da operação.
            </h2>
            <p className="servicos-panel__text">
              A MKTOnline constrói uma relação próxima e contínua com cada empresa. Conhecemos a operação,
              acompanhamos seus desafios e participamos das decisões que orientam o crescimento do negócio.
            </p>
            <p className="servicos-panel__text">
              À medida que a empresa evolui, os canais mudam e novas oportunidades aparecem, revisamos as estratégias
              junto com a gestão para manter o crescimento organizado, rentável e sustentável.
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
          A tecnologia sustenta o acompanhamento. O verdadeiro diferencial está na proximidade, na continuidade e na
          experiência aplicada ao negócio.
        </p>

        <div className="servicos-cta">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Conversar sobre uma parceria estratégica
          </a>
          <span className="servicos-cta-note">Uma conversa inicial para entendermos o momento da sua empresa e construirmos juntos os próximos passos.</span>
        </div>
      </div>
    </section>
  )
}
