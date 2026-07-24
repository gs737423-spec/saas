import { specialistHref } from '@/site/content'

interface PanelItem {
  label: string
  text: string
}

// Plataforma + Gestão especializada — composição editorial compacta em dois
// painéis simultâneos (não sequenciais, sem etapas/números/setas). Cabeçalho
// título/subtítulo lado a lado (não empilhado) e faixa final como barra
// única, não uma terceira seção. Ver brief: correção de escala.
const platformItems: PanelItem[] = [
  { label: 'VENDAS E PEDIDOS', text: 'Acompanhe o que foi vendido e como cada marketplace contribui para o resultado.' },
  { label: 'ESTOQUE E PRODUTOS', text: 'Identifique produtos parados, riscos de ruptura e necessidades de reposição.' },
  { label: 'RESULTADOS E DESEMPENHO', text: 'Compare os canais e acompanhe os indicadores mais importantes da operação.' },
]

const managementItems: PanelItem[] = [
  { label: 'IMPLANTAÇÃO ACOMPANHADA', text: 'Entendemos a rotina, configuramos as conexões disponíveis e orientamos a equipe.' },
  { label: 'LEITURA DA OPERAÇÃO', text: 'Analisamos resultados, diferenças entre canais, estoque e pontos de atenção.' },
  { label: 'DEFINIÇÃO DE PRIORIDADES', text: 'Ajudamos a identificar perdas de tempo, margem e oportunidades.' },
  { label: 'ACOMPANHAMENTO DA EVOLUÇÃO', text: 'A gestão é revisada conforme a empresa amplia produtos, vendas e marketplaces.' },
]

const results: PanelItem[] = [
  { label: 'MENOS TRABALHO MANUAL', text: 'Menos dependência de planilhas e conferências.' },
  { label: 'MAIS CLAREZA GERENCIAL', text: 'Sua equipe entende onde agir primeiro.' },
  { label: 'MAIS SEGURANÇA PARA CRESCER', text: 'Estrutura para ampliar canais, produtos e vendas.' },
]

export default function ServicesSection() {
  const waHref = specialistHref('Olá! Quero conhecer o gerenciamento da Vintec.')

  return (
    <section id="servicos" className="sec-dark-flat scroll-mt-24">
      <div className="site-container site-container--tight py-16 md:py-[72px]" style={{ maxWidth: 1200 }}>
        <span className="svc2-eyebrow">PLATAFORMA E GESTÃO ESPECIALIZADA</span>

        <div className="svc2-header">
          <h2 className="svc2-title">Tecnologia para enxergar a operação. Especialistas para ajudar sua empresa a decidir.</h2>
          <div className="svc2-header-side">
            <p className="svc2-sub">
              A Vintec reúne as informações dos marketplaces e acompanha sua operação de perto. Nossa equipe participa da
              implantação, analisa os resultados e ajuda a definir as prioridades da gestão.
            </p>
            <p className="svc2-reinforce">
              Você não recebe apenas um painel. Recebe tecnologia e uma equipe participando da gestão da operação.
            </p>
          </div>
        </div>

        <div className="svc2-grid">
          <div className="svc2-panel svc2-panel--platform">
            <span className="svc2-panel-label">PLATAFORMA VINTEC</span>
            <h3 className="svc2-panel-title">Tudo o que sua equipe precisa acompanhar, reunido em uma mesma rotina.</h3>
            <p className="svc2-panel-text">Pedidos, estoque, vendas e resultados deixam de ficar espalhados entre painéis, planilhas e pessoas.</p>
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
              <p className="svc2-highlight-text">Menos tempo procurando números. Mais clareza para decidir.</p>
            </div>
          </div>

          <div className="svc2-panel svc2-panel--mgmt">
            <span className="svc2-panel-label">GESTÃO VINTEC</span>
            <h3 className="svc2-panel-title">Nossa equipe acompanha a operação junto com você.</h3>
            <p className="svc2-panel-text">A tecnologia organiza as informações. A equipe Vintec ajuda a transformar esses dados em prioridades e decisões.</p>
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
              <p className="svc2-highlight-text">A Vintec participa da rotina para ajudar sua equipe a transformar informação em decisão.</p>
            </div>
          </div>
        </div>

        <div className="svc2-band">
          <span className="svc2-band-title">GESTÃO ACOMPANHADA PARA SUA EMPRESA</span>
          <div className="svc2-band-row">
            <div className="svc2-results">
              {results.map((r) => (
                <div key={r.label} className="svc2-result">
                  <span className="svc2-result-label">{r.label}</span>
                  <p className="svc2-result-text">{r.text}</p>
                </div>
              ))}
            </div>
            <div className="svc2-cta">
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary svc2-cta-btn">
                Quero conhecer o gerenciamento
              </a>
              <p className="svc2-cta-note">Converse com a equipe Vintec.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
