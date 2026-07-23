import { specialistHref } from '@/site/content'

interface PanelItem {
  label: string
  text: string
}

// Plataforma + Gestão especializada — composição editorial em dois painéis
// simultâneos (não sequenciais, sem etapas/números/setas). Ver brief:
// reconstrução da seção "O que muda na prática".
const platformItems: PanelItem[] = [
  { label: 'VENDAS E PEDIDOS', text: 'Acompanhe o que foi vendido e como cada marketplace está contribuindo para o resultado.' },
  { label: 'ESTOQUE E PRODUTOS', text: 'Encontre produtos parados, riscos de ruptura e itens que exigem reposição.' },
  { label: 'RESULTADOS E DESEMPENHO', text: 'Compare marketplaces, identifique diferenças e acompanhe os principais indicadores da operação.' },
]

const managementItems: PanelItem[] = [
  { label: 'IMPLANTAÇÃO ACOMPANHADA', text: 'Entendemos a rotina atual, configuramos as conexões disponíveis e orientamos a entrada da equipe.' },
  { label: 'LEITURA DA OPERAÇÃO', text: 'Analisamos resultados, diferenças entre marketplaces, estoque e pontos que precisam de atenção.' },
  { label: 'DEFINIÇÃO DE PRIORIDADES', text: 'Ajudamos a identificar onde a empresa está perdendo tempo, margem ou oportunidade.' },
  { label: 'ACOMPANHAMENTO DA EVOLUÇÃO', text: 'A gestão é revisada conforme a empresa amplia produtos, volume de vendas e marketplaces.' },
]

const results: PanelItem[] = [
  { label: 'MENOS TRABALHO MANUAL', text: 'Menos dependência de planilhas, conferências e relatórios separados.' },
  { label: 'MAIS CLAREZA GERENCIAL', text: 'Gestores e equipes enxergam o mesmo cenário e entendem onde agir primeiro.' },
  { label: 'MAIS SEGURANÇA PARA CRESCER', text: 'A operação ganha estrutura para ampliar canais, produtos e volume de vendas.' },
]

export default function ServicesSection() {
  const waHref = specialistHref('Olá! Quero entender como funciona o gerenciamento da Vintec.')

  return (
    <section id="servicos" className="sec-dark-flat scroll-mt-24">
      <div className="site-container site-container--tight py-16 md:py-[88px]" style={{ maxWidth: 1220 }}>
        <span className="svc2-eyebrow">PLATAFORMA E GESTÃO ESPECIALIZADA</span>
        <h2 className="svc2-title">Tecnologia para enxergar a operação. Especialistas para ajudar sua empresa a decidir.</h2>
        <p className="svc2-sub">
          A Vintec reúne as informações dos marketplaces e acompanha sua operação de perto. Nossa equipe participa da
          implantação, analisa os resultados, identifica pontos de atenção e ajuda a definir as prioridades da gestão.
        </p>
        <p className="svc2-reinforce">
          Você não recebe apenas um painel. Recebe uma estrutura de gestão para acompanhar a operação com mais clareza e direção.
        </p>

        <div className="svc2-grid">
          <div className="svc2-panel svc2-panel--platform">
            <span className="svc2-panel-label">PLATAFORMA VINTEC</span>
            <h3 className="svc2-panel-title">Tudo o que sua equipe precisa acompanhar, reunido em uma mesma rotina.</h3>
            <p className="svc2-panel-text">
              Pedidos, estoque, vendas e resultados dos diferentes marketplaces deixam de ficar espalhados entre painéis,
              planilhas e pessoas.
            </p>
            <div className="svc2-items">
              {platformItems.map((item) => (
                <div key={item.label} className="svc2-item">
                  <span className="svc2-item-label">{item.label}</span>
                  <p className="svc2-item-text">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="svc2-highlight">
              <span className="svc2-highlight-label">RESULTADO PARA A OPERAÇÃO</span>
              <p className="svc2-highlight-text">Menos tempo procurando números. Mais clareza para entender o que precisa de atenção.</p>
            </div>
          </div>

          <div className="svc2-panel svc2-panel--mgmt">
            <span className="svc2-panel-label">GESTÃO VINTEC</span>
            <h3 className="svc2-panel-title">Nossa equipe acompanha a operação junto com você.</h3>
            <p className="svc2-panel-text">
              A tecnologia organiza as informações. A equipe Vintec ajuda a transformar essas informações em prioridades e
              decisões para o negócio.
            </p>
            <div className="svc2-items">
              {managementItems.map((item) => (
                <div key={item.label} className="svc2-item">
                  <span className="svc2-item-label">{item.label}</span>
                  <p className="svc2-item-text">{item.text}</p>
                </div>
              ))}
            </div>
            <div className="svc2-highlight">
              <p className="svc2-highlight-text svc2-highlight-text--lead">Você não fica sozinho tentando interpretar mais um sistema.</p>
              <p className="svc2-highlight-text">A Vintec participa da rotina para ajudar sua equipe a transformar informação em ação gerencial.</p>
            </div>
          </div>
        </div>

        <div className="svc2-band">
          <div className="svc2-band-intro">
            <h3 className="svc2-band-title">GESTÃO ACOMPANHADA PARA SUA EMPRESA</h3>
            <p className="svc2-band-text">
              Plataforma, informações organizadas e uma equipe especializada acompanhando os pontos que influenciam o
              desempenho da operação.
            </p>
          </div>
          <div className="svc2-results">
            {results.map((r) => (
              <div key={r.label} className="svc2-result">
                <span className="svc2-result-label">{r.label}</span>
                <p className="svc2-result-text">{r.text}</p>
              </div>
            ))}
          </div>
          <div className="svc2-cta">
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              Quero entender como funciona o gerenciamento
            </a>
            <p className="svc2-cta-note">Converse com a equipe Vintec sobre a rotina atual da sua operação.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
