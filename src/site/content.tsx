/* Conteúdo do site institucional — centralizado para não espalhar textos e
   valores mágicos pelas seções. Números demonstrativos são coerentes com o
   sistema (mesmos dados do dashboard).

   POSICIONAMENTO: a plataforma integra os marketplaces por API. O cliente
   conecta suas contas, os dados são recebidos e organizados pelas conexões
   disponíveis e os indicadores ficam centralizados em uma única visão.
   Nada de importação/planilha/upload manual. */
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

export type IntegrationStatus = 'disponivel' | 'em-desenvolvimento' | 'em-breve'

export interface MarketplaceItem {
  name: string
  Logo: ComponentType
  status: IntegrationStatus
}

// Honestidade obrigatória: só o que existe hoje é "disponível". Integração de
// API real hoje = Mercado Livre (ver src/server/integrations/mercadolivre). Os
// demais canais estão em desenvolvimento ou previstos.
export const marketplaces: MarketplaceItem[] = [
  { name: 'Mercado Livre', Logo: LogoMercadoLivre, status: 'disponivel' },
  { name: 'Shopee', Logo: LogoShopee, status: 'em-desenvolvimento' },
  { name: 'Amazon', Logo: LogoAmazon, status: 'em-desenvolvimento' },
  { name: 'Loja Própria', Logo: LogoLojaPropria, status: 'em-desenvolvimento' },
  { name: 'Magalu', Logo: LogoMagalu, status: 'em-breve' },
  { name: 'Shopify', Logo: LogoShopify, status: 'em-breve' },
  { name: 'Nuvemshop', Logo: LogoNuvemshop, status: 'em-breve' },
  { name: 'WooCommerce', Logo: LogoWooCommerce, status: 'em-breve' },
]

export const statusLabel: Record<IntegrationStatus, string> = {
  disponivel: 'Disponível',
  'em-desenvolvimento': 'Em desenvolvimento',
  'em-breve': 'Em breve',
}

// Abas da Plataforma interativa. Produto 360 vive DENTRO de "Produtos" como
// visão secundária (não é mais uma seção isolada).
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
    title: 'Os principais números da operação em um único painel.',
    desc: 'Acompanhe faturamento bruto e líquido, pedidos, ticket médio, CMV e margem em uma visão executiva.',
    bullets: ['Indicadores centralizados', 'Comparação entre períodos', 'Pontos de atenção em destaque'],
    image: '/site/dashboard-overview.webp',
    alt: 'Painel de Visão Geral da Acelera Intelligence com indicadores de faturamento, pedidos e margem',
  },
  {
    id: 'marketplaces',
    label: 'Marketplaces',
    title: 'Compare os canais em uma única visão.',
    desc: 'Entenda a participação, o faturamento, os pedidos, o ticket e a margem de cada marketplace, lado a lado.',
    bullets: ['Comparação lado a lado', 'Participação por canal', 'Identificação de dependência'],
    image: '/site/marketplace-comparison.webp',
    alt: 'Tela de comparação entre marketplaces mostrando participação e desempenho por canal',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    title: 'Encontre rapidamente os produtos que mais impactam o resultado.',
    desc: 'Visualize produtos mais vendidos, maior faturamento, melhor margem, crescimento, quedas e riscos de estoque.',
    bullets: ['Ranking de desempenho', 'Filtros inteligentes', 'Produtos que merecem atenção'],
    image: '/site/products-overview.webp',
    alt: 'Página de Produtos com ranking de desempenho e classificação por margem e faturamento',
    secondary: {
      label: 'Produto 360',
      title: 'Cada produto analisado por todos os ângulos.',
      desc: 'Tendência, vendas, margem, pedidos, estoque e participação por canal de um produto específico, com evolução por período.',
      bullets: ['Histórico individual', 'Comparação entre canais', 'Evolução por período'],
      image: '/site/product-360.webp',
      alt: 'Tela Produto 360 com histórico individual, tendência e participação por canal',
    },
  },
  {
    id: 'estoque',
    label: 'Estoque',
    title: 'Antecipe rupturas antes que elas afetem as vendas.',
    desc: 'Acompanhe estoque atual, cobertura e níveis críticos, com priorização dos produtos que precisam de reposição.',
    bullets: ['Cobertura e estoque crítico', 'Produtos próximos da ruptura', 'Priorização de reposição'],
    image: '/site/inventory.webp',
    alt: 'Página de Estoque com níveis críticos e recomendações de reposição',
  },
]

// Problema — no máximo quatro pontos, sem menção a planilhas.
export const problems = [
  'Dados separados entre os canais',
  'Dificuldade para entender a margem real',
  'Falta de comparação entre marketplaces',
  'Produtos e estoques analisados tarde demais',
]

// Como funciona — narrativa por API (conectar, centralizar, decidir).
export const howSteps = [
  {
    n: '01',
    title: 'Conecte seus marketplaces',
    text: 'Autorize as conexões disponíveis para que a plataforma acesse os dados necessários da operação.',
  },
  {
    n: '02',
    title: 'Centralize as informações',
    text: 'Os dados recebidos pelas APIs são organizados em uma única estrutura de análise.',
  },
  {
    n: '03',
    title: 'Acompanhe e decida',
    text: 'Visualize faturamento, margem, produtos, estoque e desempenho por canal em um só lugar.',
  },
]

export const benefits = [
  'Visão consolidada da operação',
  'Comparação clara entre canais',
  'Margem real por marketplace',
  'Controle de estoque e rupturas',
  'Produtos em queda identificados cedo',
  'Indicadores executivos centralizados',
]

// FAQ compacto — perguntas essenciais, respostas baseadas no produto real.
export const faqItems = [
  {
    q: 'Quais marketplaces podem ser conectados?',
    a: 'A plataforma centraliza Mercado Livre, Shopee, Amazon e loja própria. A integração direta por API já está disponível para o Mercado Livre; os demais canais estão em desenvolvimento e novas integrações estão previstas.',
  },
  {
    q: 'Como os dados chegam à plataforma?',
    a: 'Por integração via API. Você conecta suas contas dos marketplaces e a plataforma recebe e organiza os dados pelas conexões disponíveis, sem alimentação manual.',
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
    q: 'Os dados de diferentes empresas ficam separados?',
    a: 'Sim. O acesso é controlado por autenticação e cada operação enxerga apenas os próprios dados. Detalhamos a estrutura de acesso da sua equipe na demonstração.',
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
