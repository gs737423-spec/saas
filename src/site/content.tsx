/* Conteúdo do site institucional — centralizado para não espalhar textos e
   valores mágicos pelas seções.

   POSICIONAMENTO: comunicação comercial forte sobre uma operação multicanal
   conectada por API (Mercado Livre, Amazon, Shopee, Leroy Merlin). Regra do
   projeto: não afirmar histórico, homologação, parceria oficial ou
   disponibilidade técnica não comprovada. Nada de "sincronização em tempo
   real", "todas as integrações ativas hoje" ou métricas de clientes/uso
   inventadas — só capacidade projetada do produto e contagens estruturais
   reais (ex.: "4 canais prioritários"). Zero menção a planilha/CSV/XLSX como
   forma de alimentar a plataforma — tudo é API. */
import type { ComponentType } from 'react'
import {
  LogoMercadoLivre, LogoShopee, LogoAmazon, LogoLeroyMerlin,
} from '@/site/logos'
import { whatsappContactUrl } from '@/lib/whatsapp'

// Cada âncora aponta para o TOPO de uma section real — combinado com
// scroll-margin-top no CSS, garante que o título fique sempre visível
// abaixo do header sticky.
export const nav = [
  { label: 'Soluções', href: '#servicos' },
  { label: 'Marketplaces', href: '#marketplaces' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Por que Vintec', href: '#diferenciais' },
  { label: 'FAQ', href: '#faq' },
]

export interface MarketplaceItem {
  name: string
  Logo: ComponentType
  // Logo oficial (PNG, fundo transparente) usado nos balões do hero — imagem
  // real da marca, object-fit: contain, sem redesenho/recolor/distorção.
  // `logoH` = altura de render (px) por marca, pois as proporções diferem
  // (ML é lockup quase quadrado; Amazon/Shopee/Leroy são horizontais).
  logoSrc: string
  logoH: number
}

export const marketplaces: MarketplaceItem[] = [
  { name: 'Mercado Livre', Logo: LogoMercadoLivre, logoSrc: '/site/brands/mercado-livre.png', logoH: 46 },
  { name: 'Amazon', Logo: LogoAmazon, logoSrc: '/site/brands/amazon.png', logoH: 24 },
  { name: 'Shopee', Logo: LogoShopee, logoSrc: '/site/brands/shopee.png', logoH: 26 },
  { name: 'Leroy Merlin', Logo: LogoLeroyMerlin, logoSrc: '/site/brands/leroy-merlin.png', logoH: 40 },
]

// Faixa de prova técnica — confiança, não logos repetidos.
export const trustStrip = [
  { label: 'Integração por API', desc: 'Conexão direta com os canais, sem compartilhar senhas.' },
  { label: 'Dados isolados por empresa', desc: 'Cada operação enxerga só os próprios dados.' },
  { label: 'Estrutura centralizada', desc: 'Uma visão só para todos os canais conectados.' },
  { label: 'Onboarding assistido', desc: 'Nossa equipe acompanha a implantação.' },
]

// "Quem é a Vintec" + números — só indicadores estruturais verificáveis,
// nunca métricas de clientes/faturamento/uso inventadas.
// Bloco "Quem Somos" — 2 parágrafos institucionais (estrutura editorial Petina).
export const about = {
  label: 'Quem Somos',
  title: 'Criada para substituir controles paralelos por uma rotina mais clara.',
  paragraphs: [
    'A Vintec ajuda empresas que vendem em diferentes marketplaces a reunir pedidos, estoque, vendas e resultados em uma rotina mais fácil de acompanhar.',
    'Assim, gestores e equipes passam menos tempo procurando informações e ganham mais segurança para decidir o que precisa de atenção.',
  ],
}

// Seção institucional (3ª) — pessoa corporativa à ESQUERDA, conteúdo à direita.
// Pessoa exclusiva desta seção (não aparece no hero). Linguagem simples.
export const institutionalSection = {
  label: 'SOBRE A VINTEC',
  title: 'Feita para organizar operações que vendem em vários marketplaces.',
  paragraphs: [
    'A Vintec reúne os principais canais da operação para sua equipe acompanhar vendas, pedidos, estoque e desempenho com mais clareza e menos controles paralelos.',
    'Em vez de alternar entre diferentes telas, planilhas e rotinas separadas, gestores e equipes passam a acompanhar os canais em uma estrutura mais organizada.',
  ],
  ctaLabel: 'Conheça nossas soluções',
  ctaHref: '#servicos',
  photoSrc: '/site/people/vintec-institutional-consultant.png',
  photoAlt: 'Especialista da Vintec segurando um tablet',
}

// Métricas institucionais: ver src/site/data/siteMetrics.ts (verified:false,
// source:null — NÃO publicar como fatos reais sem validação comercial).
export const institutionalMetricsTitle = 'Esse é o alcance da Vintec'

// 4ª seção — "O que você recebe": UM único card vertical (estrutura da
// referência Petina). Nada de dashboard aqui — o print vai na seção de prévia.
export const platformSectionTitle = 'O que você recebe com a Vintec'
export const platformSectionSubtitle = 'Uma plataforma feita para simplificar a rotina de quem vende em marketplaces.'
export const platformCard = {
  pill: 'PLATAFORMA PARA MARKETPLACES',
  title: 'Gestão centralizada',
  subtitle: 'SEUS CANAIS EM UM SÓ LUGAR',
  text: 'Acompanhe os principais pontos da sua venda em marketplaces sem depender de várias telas, planilhas e controles separados.',
  bullets: [
    'Pedidos reunidos em um único ambiente',
    'Estoque mais fácil de acompanhar',
    'Comparação das vendas por marketplace',
    'Produtos organizados por canal',
    'Informações mais claras para sua equipe',
  ],
  ctaLabel: 'Conheça a plataforma Vintec',
}
// Lado complementar (não é outro card) — título institucional + frase curta.
export const platformAside = {
  title: 'Tudo o que sua equipe precisa acompanhar, reunido em um só lugar.',
  text: 'Menos telas, menos planilhas e mais clareza para o dia a dia de quem vende em marketplaces.',
}

// 5ª seção — prévia da plataforma (o print sai do card e ganha seção própria).
export const previewSection = {
  title: 'Veja sua operação com mais clareza',
  text: 'Uma visão organizada dos seus marketplaces para acompanhar o que importa no dia a dia.',
  image: '/site/dashboard-overview.webp',
  imageAlt: 'Prévia do painel da Vintec com a visão geral da operação multicanal',
}

// "O que a Vintec faz" — 4 blocos, capacidades reais do produto.
export const whatWeDo = [
  {
    title: 'Centraliza a operação multicanal',
    text: 'Reúne os canais em que sua empresa vende em uma estrutura só, sem alternar entre painéis separados.',
  },
  {
    title: 'Organiza dados por canal',
    text: 'Pedidos, produtos e estoque de cada marketplace normalizados em um modelo único de leitura.',
  },
  {
    title: 'Dá clareza para acompanhar a operação',
    text: 'Indicadores executivos que mostram o que está acontecendo em cada canal, sem depender de relatório manual.',
  },
  {
    title: 'Apoia a tomada de decisão',
    text: 'Uma leitura organizada da operação para priorizar onde agir primeiro.',
  },
]

// Serviços — só capacidades com base confirmada no produto/posicionamento.
export const services = [
  {
    title: 'Centralização multicanal',
    text: 'Todos os canais conectados em uma única estrutura de acompanhamento.',
  },
  {
    title: 'Integrações por API',
    text: 'Conexão direta com Mercado Livre, Amazon, Shopee e Leroy Merlin, sem planilha.',
  },
  {
    title: 'Visão consolidada da operação',
    text: 'Pedidos, produtos e estoque organizados em uma leitura executiva única.',
  },
  {
    title: 'Acompanhamento de desempenho',
    text: 'Indicadores por canal para entender o que está funcionando e o que precisa de atenção.',
  },
  {
    title: 'Organização de produtos e canais',
    text: 'Dados normalizados por canal, sem duplicidade ou divergência entre relatórios.',
  },
  {
    title: 'Indicadores para tomada de decisão',
    text: 'Prioridades claras em vez de números soltos espalhados por telas diferentes.',
  },
]

// "Como começamos" — seção editorial de implantação acompanhada (painel
// azul-marinho + 3 etapas em linha, não jornada de 4 marcadores circulares).
export const processIntro = {
  eyebrow: 'IMPLANTAÇÃO ACOMPANHADA',
  title: 'Organizamos a mudança sem interromper sua operação.',
  text: 'Primeiro entendemos como sua equipe trabalha. Depois conectamos os marketplaces disponíveis, organizamos as informações e acompanhamos os responsáveis nos primeiros passos.',
  reassurances: ['Sem mudanças bruscas na rotina atual.', 'Com orientação durante toda a implantação.'],
  ctaLabel: 'Converse sobre a sua operação',
  ctaHref: '#conversao',
}

export const processSteps = [
  {
    n: '01',
    title: 'Entendemos sua rotina atual',
    text: 'Mapeamos onde sua empresa vende, quais planilhas e controles são utilizados e onde a equipe perde mais tempo.',
    delivery: 'Diagnóstico e plano inicial.',
  },
  {
    n: '02',
    title: 'Conectamos e organizamos',
    text: 'Configuramos os marketplaces disponíveis e reunimos pedidos, estoque, vendas e acessos em uma rotina centralizada.',
    delivery: 'Informações reunidas em um único fluxo.',
  },
  {
    n: '03',
    title: 'Acompanhamos a entrada da equipe',
    text: 'Validamos as informações, orientamos os responsáveis e acompanhamos os primeiros dias de utilização.',
    delivery: 'Equipe preparada para começar.',
  },
]

// Como funciona — 4 etapas, sempre API, nunca planilha.
export const howSteps = [
  { n: '01', title: 'Conectar', text: 'Autorize os canais por API, sem compartilhar senhas com a plataforma.' },
  { n: '02', title: 'Organizar', text: 'Os dados recebidos são estruturados em um modelo único de operação.' },
  { n: '03', title: 'Acompanhar', text: 'Indicadores e alertas mostram o que está acontecendo em cada canal.' },
  { n: '04', title: 'Decidir', text: 'Uma leitura clara da operação para priorizar com mais segurança.' },
]

// Diferenciais / benefícios.
export const differentials = [
  'Operação conectada por API, sem planilha',
  'Uma visão central para todos os canais',
  'Estrutura pensada para múltiplos marketplaces',
  'Menos dispersão de informação entre telas',
  'Organização por canal, sem duplicidade',
  'Acompanhamento mais claro da operação',
  'Onboarding acompanhado pela nossa equipe',
  'Estrutura pronta para crescer com novos canais',
]

export interface CommercialBannerContent {
  id: string
  eyebrow: string
  title: string
  text: string
  ctaLabel: string
  waMessage: string
  photoSlot: string
  photoSrc: string
  photoAlt: string
  imageSide: 'left' | 'right'
}

export const commercialBanners: CommercialBannerContent[] = [
  {
    id: 'banner-organizacao',
    eyebrow: 'Organização',
    title: 'Uma operação mais organizada para crescer em diferentes canais.',
    text: 'Centralize Mercado Livre, Amazon, Shopee e Leroy Merlin em uma estrutura só, conectada por API — sem depender de planilha ou de abrir painel por painel.',
    ctaLabel: 'Fale com um especialista',
    waMessage: 'Olá! Quero entender melhor as soluções da Vintec para operações multicanal.',
    photoSlot: 'banner-organizacao-notebook',
    photoSrc: '/site/people/processed/vintec-banner-laptop.webp',
    photoAlt: 'Pessoa segurando um notebook, ilustrando a organização da operação multicanal',
    imageSide: 'left',
  },
  {
    id: 'banner-crescimento',
    eyebrow: 'Proximidade',
    title: 'Fale com quem entende de operações multicanal.',
    text: 'Conforme a operação cresce, a Vintec foi projetada para acompanhar — mais canais, mais clareza, sem perder controle sobre o que importa.',
    ctaLabel: 'Solicitar contato',
    waMessage: 'Olá! Gostaria de saber mais sobre como a Vintec pode apoiar o crescimento da minha operação.',
    photoSlot: 'banner-crescimento-mobile',
    photoSrc: '/site/people/processed/vintec-banner-smartphone.webp',
    photoAlt: 'Pessoa segurando um smartphone, ilustrando o contato com a equipe Vintec',
    imageSide: 'right',
  },
]

// FAQ — respostas honestas sobre posicionamento comercial e forma de uso.
export const faqItems = [
  {
    q: 'O que a Vintec faz na prática?',
    a: 'A Vintec reúne informações importantes dos marketplaces em uma rotina mais organizada, ajudando equipes e gestores a acompanhar pedidos, estoque, vendas e resultados com menos controles paralelos.',
  },
  {
    q: 'Quais marketplaces podem ser conectados?',
    a: 'Os marketplaces prioritários são Mercado Livre, Amazon, Shopee e Leroy Merlin, com estrutura projetada para evoluir para novos canais.',
  },
  {
    q: 'Vou precisar continuar alimentando planilhas?',
    a: 'A proposta é reduzir a dependência de planilhas e atualizações manuais usando conexões diretas com os marketplaces disponíveis.',
  },
  {
    q: 'Como os marketplaces são conectados?',
    a: 'A conexão utiliza as integrações oficiais disponíveis para cada marketplace. Durante a implantação, a equipe da Vintec orienta as etapas necessárias.',
  },
  {
    q: 'A equipe da Vintec ajuda na implantação?',
    a: 'Sim. A equipe acompanha a configuração, a conexão dos marketplaces e a entrada da sua equipe na nova rotina.',
  },
  {
    q: 'Como funciona a conversa inicial?',
    a: 'É uma conversa sem compromisso para entender como sua equipe vende e acompanha os marketplaces hoje, antes de qualquer proposta.',
  },
]

export const contact = {
  email: '',
}

/* ==========================================================================
   LEGADO — mantido só para as seções antigas (ProblemSection,
   PlatformShowcase, DiagnosticSection, IntegrationsSecurity) continuarem
   compilando. Elas saíram da renderização de `SitePage` na reformulação
   Vintec (screenshot de dashboard não faz mais parte da home pública), mas
   o código foi preservado no repo em vez de apagado. Se algum dia essas
   seções voltarem a ser usadas, revisar o conteúdo abaixo antes — os status
   de integração aqui não foram atualizados desde a reformulação.
   ========================================================================== */
export const problemBefore = ['Acessos separados', 'Relatórios diferentes', 'Números sem padrão', 'Decisões atrasadas']
export const problemAfter = ['Uma visão consolidada', 'Dados normalizados', 'Prioridades claras', 'Comparação entre canais']

export const diagnosticExamples = [
  { title: 'Canal com queda de faturamento', detail: 'Identificado por variação negativa consistente no período comparado.' },
  { title: 'Produto Curva A com estoque crítico', detail: 'Cruza classificação ABC com cobertura de dias restante.' },
  { title: 'Marketplace com taxas elevadas', detail: 'Compara impacto de comissão sobre o faturamento bruto do canal.' },
  { title: 'Produto com excesso de cobertura', detail: 'Estoque parado além do limite configurado para o giro esperado.' },
  { title: 'Canal concentrando o resultado', detail: 'Aponta dependência quando um canal ultrapassa participação saudável.' },
]

export const securityPoints = [
  'OAuth quando suportado pelo canal',
  'Tokens protegidos no backend — nunca no navegador',
  'Dados separados por empresa',
  'Logs de sincronização',
  'Acesso controlado por autenticação',
  'Conexão revogável a qualquer momento',
]

export type IntegrationStatus = 'em-implantacao' | 'planejado' | 'sob-analise'
export const statusLabel: Record<IntegrationStatus, string> = {
  'em-implantacao': 'Em implantação',
  planejado: 'Planejado',
  'sob-analise': 'Sob análise técnica',
}
export const statusTone: Record<IntegrationStatus, string> = {
  'em-implantacao': '#4C82F7',
  planejado: '#8A96AE',
  'sob-analise': '#E9A83A',
}

export interface PlatformView {
  title: string
  desc: string
  bullets: string[]
  image: string
  alt: string
}
export interface PlatformTab extends PlatformView {
  id: string
  label: string
  secondary?: { label: string } & PlatformView
}
export const platformTabs: PlatformTab[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    title: 'Entenda a operação antes de abrir cada canal.',
    desc: 'Veja faturamento, pedidos, ticket, taxas e pontos de atenção em uma única leitura executiva.',
    bullets: ['Indicadores centralizados', 'Comparação entre períodos', 'Pontos de atenção em destaque'],
    image: '/site/dashboard-overview.webp',
    alt: 'Painel de Visão Geral com indicadores de faturamento, pedidos e taxas',
  },
]

export function specialistHref(message?: string): string {
  const wa = whatsappContactUrl(message ?? 'Olá! Gostaria de falar com um especialista da Vintec.')
  if (wa) return wa
  if (contact.email) return `mailto:${contact.email}`
  return '#demonstracao'
}
