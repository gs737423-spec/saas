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
  { label: 'Diferenciais', href: '#diferenciais' },
  { label: 'FAQ', href: '#faq' },
]

export interface MarketplaceItem {
  name: string
  Logo: ComponentType
}

export const marketplaces: MarketplaceItem[] = [
  { name: 'Mercado Livre', Logo: LogoMercadoLivre },
  { name: 'Amazon', Logo: LogoAmazon },
  { name: 'Shopee', Logo: LogoShopee },
  { name: 'Leroy Merlin', Logo: LogoLeroyMerlin },
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
export const about = {
  label: 'Quem é a Vintec',
  title: 'Mais clareza para a sua operação multicanal.',
  text: 'A Vintec centraliza a operação de quem vende em marketplaces: conecta os canais por API, organiza os dados em um modelo único e transforma isso em uma visão executiva para decidir com mais controle.',
}

// Indicadores estruturais da 2ª seção (grid editorial 2×2). Números reais do
// posicionamento — nada de CMV/margem por custo (não contemplados na v1: o
// líquido é apurado por taxas/descontos, ver ledger BRUTO→DESCONTO→LÍQUIDO).
export const numbers = [
  { value: '4', label: 'canais conectados', desc: 'Mercado Livre, Amazon, Shopee e Leroy Merlin em uma única operação.' },
  { value: '6', label: 'visões executivas', desc: 'Faturamento, pedidos, ticket médio, descontos, líquido e participação por canal.' },
  { value: '1', label: 'painel central', desc: 'Leitura consolidada da operação sem alternar entre várias telas.' },
  { value: 'API', label: 'base de conexão', desc: 'Integração como base da operação e do acompanhamento.' },
]

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
    q: 'O que a Vintec faz?',
    a: 'Centraliza a operação de quem vende em marketplaces: conecta os canais por API, organiza os dados em um modelo único e entrega uma visão executiva para apoiar decisões.',
  },
  {
    q: 'Para quais marketplaces a Vintec atende inicialmente?',
    a: 'Os canais prioritários são Mercado Livre, Amazon, Shopee e Leroy Merlin, com estrutura projetada para evoluir para novos canais.',
  },
  {
    q: 'Como funciona a integração?',
    a: 'Por conexão via API. Você autoriza o acesso ao canal e a Vintec recebe e organiza os dados automaticamente — sem enviar planilhas ou compartilhar senhas.',
  },
  {
    q: 'Os dados entram por planilha?',
    a: 'Não. A operação é pensada inteiramente via API — planilha e upload manual não fazem parte do fluxo da plataforma.',
  },
  {
    q: 'A Vintec atende empresas com operação multicanal?',
    a: 'Sim, esse é o cenário para o qual a Vintec foi desenhada: empresas que vendem em mais de um canal e precisam de uma visão única da operação.',
  },
  {
    q: 'Como posso falar com um especialista?',
    a: 'Pelos botões "Fale com um especialista" espalhados pelo site, que abrem uma conversa direta no WhatsApp com nossa equipe.',
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
