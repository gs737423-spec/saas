/* Conteúdo do site institucional — centralizado para não espalhar textos e
   valores mágicos pelas seções. Números demonstrativos são coerentes com o
   sistema (mesmos dados do dashboard). */
import type { ComponentType } from 'react'
import {
  LogoMercadoLivre, LogoShopee, LogoAmazon, LogoMagalu,
  LogoShopify, LogoNuvemshop, LogoWooCommerce, LogoLojaPropria,
} from '@/site/logos'

export const nav = [
  { label: 'Plataforma', href: '#plataforma' },
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Integrações', href: '#integracoes' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'FAQ', href: '#faq' },
]

export type IntegrationStatus = 'ativo' | 'planilha' | 'em-breve'

export interface MarketplaceItem {
  name: string
  Logo: ComponentType
  status: IntegrationStatus
}

// Honestidade obrigatória: só o que existe hoje é "ativo". Integração de API
// real hoje = Mercado Livre (ver src/server/integrations/mercadolivre). Os
// demais entram por planilha ou estão em desenvolvimento.
export const marketplaces: MarketplaceItem[] = [
  { name: 'Mercado Livre', Logo: LogoMercadoLivre, status: 'ativo' },
  { name: 'Shopee', Logo: LogoShopee, status: 'planilha' },
  { name: 'Amazon', Logo: LogoAmazon, status: 'planilha' },
  { name: 'Loja Própria', Logo: LogoLojaPropria, status: 'planilha' },
  { name: 'Magalu', Logo: LogoMagalu, status: 'em-breve' },
  { name: 'Shopify', Logo: LogoShopify, status: 'em-breve' },
  { name: 'Nuvemshop', Logo: LogoNuvemshop, status: 'em-breve' },
  { name: 'WooCommerce', Logo: LogoWooCommerce, status: 'em-breve' },
]

export interface PlatformTab {
  id: string
  label: string
  title: string
  desc: string
  bullets: string[]
  image: string
  alt: string
}

export const platformTabs: PlatformTab[] = [
  {
    id: 'visao-geral',
    label: 'Visão Geral',
    title: 'Os principais números da operação em um único painel.',
    desc: 'Acompanhe faturamento bruto e líquido, pedidos, ticket médio, CMV e margem em uma visão executiva.',
    bullets: ['Indicadores centralizados', 'Comparação entre períodos', 'Visão rápida dos pontos de atenção'],
    image: '/site/dashboard-overview.webp',
    alt: 'Painel de Visão Geral da Acelera Intelligence com indicadores de faturamento, pedidos e margem',
  },
  {
    id: 'marketplaces',
    label: 'Marketplaces',
    title: 'Compare os canais sem precisar cruzar planilhas.',
    desc: 'Entenda a participação, o faturamento, os pedidos, o ticket e a margem de cada marketplace.',
    bullets: ['Comparação lado a lado', 'Participação por canal', 'Identificação de dependência'],
    image: '/site/marketplace-comparison.webp',
    alt: 'Tela de comparação entre marketplaces mostrando participação e desempenho por canal',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    title: 'Encontre rapidamente os produtos que mais impactam o resultado.',
    desc: 'Visualize produtos mais vendidos, maior faturamento, melhor margem, quedas e riscos de estoque.',
    bullets: ['Ranking de desempenho', 'Filtros inteligentes', 'Produtos que merecem atenção'],
    image: '/site/products-overview.webp',
    alt: 'Página de Produtos com ranking de desempenho e classificação por margem e faturamento',
  },
  {
    id: 'produto-360',
    label: 'Produto 360',
    title: 'Analise cada produto por todos os ângulos.',
    desc: 'Acompanhe tendência, vendas, margem, pedidos, estoque e participação de um produto específico.',
    bullets: ['Histórico individual', 'Comparação entre canais', 'Evolução por período'],
    image: '/site/product-360.webp',
    alt: 'Tela Produto 360 com histórico individual, tendência e participação por canal',
  },
  {
    id: 'estoque',
    label: 'Estoque',
    title: 'Antecipe rupturas antes que elas afetem as vendas.',
    desc: 'Identifique níveis críticos de estoque e produtos que precisam de reposição.',
    bullets: ['Estoque crítico', 'Priorização de reposição', 'Visão organizada por produto'],
    image: '/site/inventory.webp',
    alt: 'Página de Estoque com níveis críticos e recomendações de reposição',
  },
  {
    id: 'importacoes',
    label: 'Importações',
    title: 'Traga os dados dos diferentes canais para o mesmo padrão.',
    desc: 'Importe planilhas e centralize informações de fontes diferentes dentro da plataforma.',
    bullets: ['Padronização de arquivos', 'Histórico de importações', 'Identificação de inconsistências'],
    image: '/site/imports.webp',
    alt: 'Tela de Importações com histórico e padronização de planilhas dos marketplaces',
  },
]

export const problems = [
  'Dados separados em diferentes canais',
  'Planilhas que precisam ser atualizadas manualmente',
  'Dificuldade para calcular a margem real',
  'Falta de comparação entre marketplaces',
  'Estoque sem visão centralizada',
  'Produtos em queda identificados tarde demais',
  'Decisões tomadas sem visão completa',
]

export const howSteps = [
  {
    n: '01',
    title: 'Conecte ou importe',
    text: 'Integre seus canais disponíveis ou envie as planilhas dos marketplaces.',
  },
  {
    n: '02',
    title: 'Centralize os dados',
    text: 'A plataforma organiza e padroniza informações de diferentes fontes.',
  },
  {
    n: '03',
    title: 'Decida com clareza',
    text: 'Visualize indicadores, margens, produtos, estoque e pontos de atenção em um único lugar.',
  },
]

export const benefits = [
  'Visão consolidada da operação',
  'Menos dependência de planilhas',
  'Comparação clara entre canais',
  'Margem real por marketplace',
  'Melhor controle de estoque',
  'Identificação rápida de produtos em queda',
  'Priorização de oportunidades',
  'Indicadores executivos centralizados',
  'Mais agilidade nas análises',
  'Decisões baseadas em dados',
]

export const faqItems = [
  {
    q: 'Quais marketplaces podem ser utilizados?',
    a: 'A plataforma foi construída para operações que vendem em Mercado Livre, Shopee, Amazon e loja própria. A integração direta por API já está disponível para o Mercado Livre; os demais canais entram hoje pela importação de planilhas, e novas integrações estão em desenvolvimento.',
  },
  {
    q: 'É possível importar planilhas?',
    a: 'Sim. A área de Importações recebe planilhas dos diferentes canais e padroniza as informações dentro da plataforma, mantendo um histórico das importações realizadas.',
  },
  {
    q: 'A plataforma compara os resultados entre os canais?',
    a: 'Sim. A tela de Marketplaces mostra faturamento, pedidos, ticket médio, margem e participação de cada canal lado a lado, ajudando a identificar dependência e os canais mais eficientes.',
  },
  {
    q: 'Consigo acompanhar margem e CMV?',
    a: 'Sim. Faturamento bruto e líquido, CMV e margem fazem parte dos indicadores da Visão Geral e também aparecem na análise por canal e por produto.',
  },
  {
    q: 'É possível analisar cada produto individualmente?',
    a: 'Sim. A visão Produto 360 reúne faturamento, pedidos, ticket, margem, tendência, estoque e participação por canal de um produto específico, com evolução por período.',
  },
  {
    q: 'A plataforma ajuda a identificar estoque crítico?',
    a: 'Sim. A área de Estoque destaca níveis críticos e produtos que precisam de reposição, ajudando a antecipar rupturas.',
  },
  {
    q: 'Como funciona a implantação?',
    a: 'A implantação começa pela conexão dos canais disponíveis e pela importação das planilhas dos marketplaces. O melhor caminho para a sua operação é definido junto com o nosso time na demonstração.',
  },
  {
    q: 'Os dados de diferentes empresas ficam separados?',
    a: 'Sim. O acesso é controlado por autenticação e cada operação enxerga apenas os próprios dados. Falamos com você sobre a estrutura de acesso da sua equipe na demonstração.',
  },
  {
    q: 'Preciso substituir os sistemas que já utilizo?',
    a: 'Não. A proposta é centralizar a análise da operação em um único lugar. Você continua vendendo nos seus canais e usa a plataforma para enxergar o resultado consolidado.',
  },
]

// Contato — usados nos CTAs "Falar com um especialista".
// IMPORTANTE: preencha com os canais REAIS da empresa. Enquanto estiverem
// vazios, o botão "Falar com um especialista" leva ao formulário de
// demonstração (nunca a um link falso/vazio). Ex.:
//   whatsapp: 'https://wa.me/55DDDNUMERO'
//   email: 'contato@suaempresa.com.br'
export const contact = {
  whatsapp: '',
  email: '',
}

// Resolve o destino do CTA "Falar com um especialista" sem nunca cair em
// href vazio: WhatsApp real > e-mail real > formulário de demonstração.
export function specialistHref(): string {
  if (contact.whatsapp) return contact.whatsapp
  if (contact.email) return `mailto:${contact.email}`
  return '#demonstracao'
}
