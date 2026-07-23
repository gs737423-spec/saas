import type { ReactNode } from 'react'

// Página de Política de Privacidade — reconstrução completa (layout, hierarquia
// e conteúdo jurídico-base LGPD). Renderizada só para /privacidade; /termos
// continua usando o layout simples original em LegalPage.tsx, intocado.
const LAST_UPDATED = '23 de julho de 2026' // atualizar manualmente quando o conteúdo mudar

interface Section {
  id: string
  title: string
  body: ReactNode
}

const sections: Section[] = [
  {
    id: 'visao-geral',
    title: 'Visão geral',
    body: (
      <p>
        Esta política descreve como a Vintec trata os dados pessoais coletados por meio do site institucional, de
        formulários de contato e solicitação de demonstração, de comunicações comerciais e de outras interações
        relacionadas à apresentação da plataforma. Ela se aplica a visitantes, potenciais clientes e demais pessoas que
        interagem com o site, e não substitui eventuais contratos ou termos específicos firmados com clientes da
        plataforma.
      </p>
    ),
  },
  {
    id: 'controlador',
    title: 'Quem somos — controlador dos dados',
    body: (
      <>
        <p>
          Para os fins desta política, a Vintec é a responsável pelo tratamento dos dados pessoais coletados no
          contexto do site institucional e dos contatos comerciais realizados a partir dele.
        </p>
        <ul className="privpolicy-list">
          <li><strong>Razão social:</strong> [preencher]</li>
          <li><strong>CNPJ:</strong> [preencher]</li>
          <li><strong>Endereço:</strong> [preencher]</li>
          <li><strong>E-mail de contato:</strong> [preencher]</li>
          <li><strong>Canal de privacidade / encarregado (DPO):</strong> [preencher]</li>
        </ul>
      </>
    ),
  },
  {
    id: 'dados-coletados',
    title: 'Dados que coletamos',
    body: (
      <>
        <p>Coletamos diferentes tipos de dados, a depender de como você interage com o site:</p>
        <ul className="privpolicy-list">
          <li><strong>Dados de identificação:</strong> nome, empresa e cargo informados em formulários.</li>
          <li><strong>Dados de contato:</strong> e-mail, telefone e WhatsApp.</li>
          <li><strong>Dados comerciais:</strong> marketplace utilizado, faixa de pedidos mensais e contexto operacional da empresa.</li>
          <li><strong>Dados de navegação:</strong> endereço IP, navegador, dispositivo, páginas acessadas, cookies e métricas de uso do site.</li>
          <li><strong>Dados enviados voluntariamente</strong> em formulários de contato, demonstração ou mensagens diretas.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'como-usamos',
    title: 'Como usamos os dados',
    body: (
      <>
        <p>Utilizamos os dados coletados para finalidades como:</p>
        <ul className="privpolicy-list">
          <li>responder solicitações e pedidos de contato;</li>
          <li>agendar e conduzir demonstrações da plataforma;</li>
          <li>apresentar as soluções da Vintec de forma adequada ao contexto de cada empresa;</li>
          <li>entender o contexto operacional do potencial cliente;</li>
          <li>melhorar a experiência de navegação no site;</li>
          <li>enviar comunicações institucionais e comerciais, quando permitido;</li>
          <li>cumprir obrigações legais e regulatórias aplicáveis;</li>
          <li>proteger a plataforma e prevenir fraudes ou usos indevidos.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'bases-legais',
    title: 'Bases legais',
    body: (
      <>
        <p>
          Dependendo da finalidade, o tratamento poderá se apoiar em uma ou mais bases legais previstas na legislação
          aplicável, como:
        </p>
        <ul className="privpolicy-list">
          <li>consentimento do titular;</li>
          <li>execução de procedimentos preliminares relacionados a um eventual contrato;</li>
          <li>legítimo interesse da Vintec, respeitados os direitos e liberdades fundamentais do titular;</li>
          <li>cumprimento de obrigação legal ou regulatória;</li>
          <li>exercício regular de direitos em processo judicial, administrativo ou arbitral.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'compartilhamento',
    title: 'Compartilhamento de dados',
    body: (
      <>
        <p>Os dados podem ser compartilhados, quando necessário para as finalidades descritas nesta política, com:</p>
        <ul className="privpolicy-list">
          <li>fornecedores de tecnologia que dão suporte ao site e à operação da Vintec;</li>
          <li>ferramentas de hospedagem, analytics, CRM, e-mail ou atendimento ao cliente;</li>
          <li>parceiros operacionais essenciais à prestação dos serviços;</li>
          <li>autoridades públicas, quando exigido por lei ou determinação judicial.</li>
        </ul>
        <p>A Vintec busca compartilhar apenas os dados estritamente necessários para cada finalidade.</p>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies e tecnologias de rastreamento',
    body: (
      <>
        <p>
          Cookies são pequenos arquivos armazenados no navegador que ajudam um site a funcionar corretamente e a
          entender como é utilizado. Eles podem se enquadrar em diferentes categorias, como:
        </p>
        <ul className="privpolicy-list">
          <li><strong>Essenciais:</strong> necessários para o funcionamento básico do site.</li>
          <li><strong>Analíticos:</strong> ajudam a entender como o site é utilizado.</li>
          <li><strong>Desempenho:</strong> auxiliam na melhoria de velocidade e estabilidade.</li>
          <li><strong>Funcionais:</strong> lembram preferências para melhorar a experiência.</li>
        </ul>
        <p>
          O uso específico de cookies pode variar conforme as ferramentas ativas no site. Quando aplicável, você pode
          gerenciar ou desativar cookies diretamente nas configurações do seu navegador.
        </p>
      </>
    ),
  },
  {
    id: 'armazenamento-seguranca',
    title: 'Armazenamento e segurança',
    body: (
      <p>
        A Vintec adota medidas técnicas e organizacionais razoáveis para proteger os dados pessoais contra acesso não
        autorizado, perda, alteração ou divulgação indevida. Embora sejam adotadas medidas de segurança compatíveis com
        a natureza das informações tratadas, nenhum sistema é completamente imune a riscos.
      </p>
    ),
  },
  {
    id: 'retencao-exclusao',
    title: 'Retenção e exclusão dos dados',
    body: (
      <>
        <p>Os dados pessoais são mantidos:</p>
        <ul className="privpolicy-list">
          <li>pelo tempo necessário para cumprir as finalidades descritas nesta política;</li>
          <li>pelo prazo exigido por lei ou regulamentação aplicável;</li>
          <li>enquanto houver interesse legítimo que justifique a manutenção;</li>
          <li>até solicitação válida de exclusão por parte do titular, quando cabível.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'direitos-titular',
    title: 'Direitos do titular',
    body: (
      <>
        <p>Nos termos da LGPD, você pode solicitar, entre outros direitos:</p>
        <ul className="privpolicy-list">
          <li>confirmação da existência de tratamento de dados;</li>
          <li>acesso aos dados pessoais tratados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>anonimização, bloqueio ou eliminação de dados, quando cabível;</li>
          <li>portabilidade dos dados, quando aplicável;</li>
          <li>informação sobre com quem os dados são compartilhados;</li>
          <li>revogação do consentimento, quando essa for a base legal do tratamento;</li>
          <li>oposição ao tratamento, quando cabível.</li>
        </ul>
        <p>
          As solicitações serão analisadas nos termos da legislação aplicável e poderão depender da verificação da
          identidade do solicitante.
        </p>
      </>
    ),
  },
  {
    id: 'transferencias',
    title: 'Transferências internacionais',
    body: (
      <p>
        Alguns fornecedores de tecnologia utilizados pela Vintec podem armazenar ou processar dados em servidores
        localizados fora do Brasil. Nesses casos, a empresa buscará adotar medidas apropriadas para resguardar os dados
        pessoais, conforme a legislação aplicável.
      </p>
    ),
  },
  {
    id: 'links-terceiros',
    title: 'Links de terceiros',
    body: (
      <p>
        O site pode conter links para sites de terceiros. A Vintec não se responsabiliza pelas práticas ou políticas de
        privacidade desses sites externos, e recomenda a leitura dos respectivos termos antes de fornecer dados
        pessoais.
      </p>
    ),
  },
  {
    id: 'privacidade-menores',
    title: 'Privacidade de menores',
    body: (
      <p>
        A Vintec não direciona intencionalmente seus serviços, formulários ou comunicações a menores de idade sem a
        devida representação legal.
      </p>
    ),
  },
  {
    id: 'alteracoes',
    title: 'Alterações nesta política',
    body: (
      <p>
        Esta política pode ser atualizada a qualquer momento, para refletir mudanças legais, operacionais ou nas
        práticas da Vintec. A data da última atualização é sempre indicada no topo desta página.
      </p>
    ),
  },
  {
    id: 'contato',
    title: 'Contato',
    body: (
      <>
        <p>Para dúvidas, solicitações ou exercício de direitos relacionados à privacidade e a dados pessoais, entre em contato:</p>
        <ul className="privpolicy-list">
          <li><strong>E-mail:</strong> [preencher]</li>
          <li><strong>Responsável / encarregado:</strong> [preencher]</li>
          <li><strong>Canal adicional:</strong> [preencher]</li>
        </ul>
      </>
    ),
  },
]

export default function PrivacyPolicyPage() {
  return (
    <main className="privpolicy">
      {import.meta.env.DEV && (
        <div className="privpolicy-devnotice site-container">
          Este documento deve ser revisado e validado pelo responsável jurídico da empresa antes da publicação
          definitiva. (Aviso visível apenas em ambiente de desenvolvimento.)
        </div>
      )}

      <section className="privpolicy-hero">
        <div className="site-container privpolicy-hero__inner">
          <span className="privpolicy-breadcrumb">Vintec / Política de Privacidade</span>
          <h1 className="privpolicy-title">Política de Privacidade</h1>
          <p className="privpolicy-subtitle">
            Saiba como a Vintec coleta, utiliza, armazena e protege os dados informados por usuários, clientes e
            visitantes do site.
          </p>
          <div className="privpolicy-hero__meta">
            <span className="privpolicy-updated">Última atualização: {LAST_UPDATED}</span>
            <p className="privpolicy-hero__contact">
              Em caso de dúvidas sobre privacidade ou dados pessoais, entre em contato com a equipe responsável.
            </p>
          </div>
        </div>
      </section>

      <div className="site-container privpolicy-layout">
        <nav className="privpolicy-toc" aria-label="Sumário da política de privacidade">
          <span className="privpolicy-toc__label">Nesta página</span>
          <ul>
            {sections.map((s) => (
              <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
            ))}
          </ul>
        </nav>

        <nav className="privpolicy-toc-mobile" aria-label="Sumário da política de privacidade">
          <span className="privpolicy-toc__label">Nesta página</span>
          <ul>
            {sections.map((s) => (
              <li key={s.id}><a href={`#${s.id}`}>{s.title}</a></li>
            ))}
          </ul>
        </nav>

        <div className="privpolicy-content">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="privpolicy-section scroll-mt-24">
              <h2 className="privpolicy-section__title">{s.title}</h2>
              <div className="privpolicy-section__body">{s.body}</div>
            </section>
          ))}
        </div>
      </div>
    </main>
  )
}
