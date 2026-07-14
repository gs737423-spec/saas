/* Conteúdo do site institucional — centralizado para não espalhar textos e
   valores mágicos pelas seções.

   POSICIONAMENTO (fase 2 — redesign estrutural): a plataforma não vende
   "centralizar marketplaces", vende decisão executiva sobre a operação.
   Integração é por API; nenhuma integração está confirmada como disponível
   em produção hoje (ver api/integrations/status.ts — Mercado Livre retorna
   config_missing). Status honestos: Em implantação / Planejado / Sob
   análise técnica. Margem e CMV não são citados como entregues — dependem
   de cadastro de custo que ainda não existe no produto real. */
import type { ComponentType } from 'react'
import {
  LogoMercadoLivre, LogoShopee, LogoAmazon, LogoMagalu,
  LogoShopify, LogoNuvemshop, LogoWooCommerce, LogoLojaPropria,
} from '@/site/logos'
import { whatsappDemoUrl } from '@/lib/whatsapp'

// Cada âncora aponta para o TOPO de uma section real — combinado com
// scroll-margin-top no CSS, garante que o título fique sempre visível
// abaixo do header sticky.
export const nav = [
  { label: 'Produto', href: '#produto' },
  { label: 'Resultados', href: '#diagnostico' },
  { label: 'Integrações', href: '#integracoes' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Segurança', href: '#seguranca' },
]

export type IntegrationStatus = 'em-implantacao' | 'planejado' | 'sob-analise'

export interface MarketplaceItem {
  name: string
  Logo: ComponentType
  status: IntegrationStatus
}

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

// Único item com sinal de progresso real (o código de integração existe,
// falta configuração/validação em produção — ver api/integrations/status.ts).
export const marketplaces: MarketplaceItem[] = [
  { name: 'Mercado Livre', Logo: LogoMercadoLivre, status: 'em-implantacao' },
  { name: 'Shopee', Logo: LogoShopee, status: 'planejado' },
  { name: 'Amazon', Logo: LogoAmazon, status: 'planejado' },
  { name: 'Magalu', Logo: LogoMagalu, status: 'planejado' },
  { name: 'Shopify', Logo: LogoShopify, status: 'planejado' },
  { name: 'Nuvemshop', Logo: LogoNuvemshop, status: 'planejado' },
  { name: 'WooCommerce', Logo: LogoWooCommerce, status: 'planejado' },
  { name: 'Loja Própria', Logo: LogoLojaPropria, status: 'sob-analise' },
]

// Faixa de prova técnica — confiança, não logos repetidos.
export const trustStrip = [
  { label: 'Integração segura', desc: 'Conexão por API, sem compartilhar senhas.' },
  { label: 'Dados isolados por empresa', desc: 'Cada operação enxerga só os próprios dados.' },
  { label: 'Sincronização automatizada', desc: 'Sem atualização manual de planilhas.' },
  { label: 'Onboarding assistido', desc: 'Nossa equipe acompanha a implantação.' },
]

// Abas da Plataforma interativa (Produto imersivo). Copy orientada a decisão,
// sem menção a margem/CMV (não entregues hoje).
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
  {
    id: 'marketplaces',
    label: 'Marketplaces',
    title: 'Descubra qual canal sustenta a operação.',
    desc: 'Compare faturamento, pedidos, ticket e eficiência para entender onde crescer e onde corrigir.',
    bullets: ['Comparação lado a lado', 'Participação por canal', 'Identificação de dependência'],
    image: '/site/marketplace-comparison.webp',
    alt: 'Tela de comparação entre marketplaces mostrando participação e desempenho por canal',
  },
  {
    id: 'produtos',
    label: 'Produtos',
    title: 'Saiba quais produtos puxam o resultado.',
    desc: 'Identifique os SKUs que mais vendem, os que estão perdendo força e os que exigem ação.',
    bullets: ['Ranking de desempenho', 'Filtros inteligentes', 'Produtos que merecem atenção'],
    image: '/site/products-overview.webp',
    alt: 'Página de Produtos com ranking de desempenho',
    secondary: {
      label: 'Produto 360',
      title: 'Cada produto analisado por todos os ângulos.',
      desc: 'Tendência, vendas, pedidos, estoque e participação por canal de um produto específico, com evolução por período.',
      bullets: ['Histórico individual', 'Comparação entre canais', 'Evolução por período'],
      image: '/site/product-360.webp',
      alt: 'Tela Produto 360 com histórico individual e tendência',
    },
  },
  {
    id: 'estoque',
    label: 'Estoque',
    title: 'Antecipe ruptura, excesso e baixo giro.',
    desc: 'Visualize cobertura, Curva ABC, produtos parados e necessidades de reposição antes que impactem o caixa.',
    bullets: ['Cobertura e estoque crítico', 'Curva ABC', 'Priorização de reposição'],
    image: '/site/inventory.webp',
    alt: 'Página de Estoque com cobertura e níveis críticos',
  },
]

// Problema — compacto, sem repetir o hero.
export const problemBefore = ['Acessos separados', 'Relatórios diferentes', 'Números sem padrão', 'Decisões atrasadas']
export const problemAfter = ['Uma visão consolidada', 'Dados normalizados', 'Prioridades claras', 'Comparação entre canais']

// Diagnóstico executivo — exemplos concretos, sem alegar IA.
export const diagnosticExamples = [
  { title: 'Canal com queda de faturamento', detail: 'Identificado por variação negativa consistente no período comparado.' },
  { title: 'Produto Curva A com estoque crítico', detail: 'Cruza classificação ABC com cobertura de dias restante.' },
  { title: 'Marketplace com taxas elevadas', detail: 'Compara impacto de comissão sobre o faturamento bruto do canal.' },
  { title: 'Produto com excesso de cobertura', detail: 'Estoque parado além do limite configurado para o giro esperado.' },
  { title: 'Canal concentrando o resultado', detail: 'Aponta dependência quando um canal ultrapassa participação saudável.' },
]

// Como funciona — 3 etapas apenas.
export const howSteps = [
  { n: '01', title: 'Conectar', text: 'Autorize os canais disponíveis sem compartilhar senhas com a plataforma.' },
  { n: '02', title: 'Normalizar', text: 'Os dados recebidos são organizados em um modelo único de análise.' },
  { n: '03', title: 'Decidir', text: 'Cards, gráficos e alertas transformam dados operacionais em prioridades claras.' },
]

// Segurança — só o que é real ou está explicitamente marcado como planejado.
export const securityPoints = [
  'OAuth quando suportado pelo canal',
  'Tokens protegidos no backend — nunca no navegador',
  'Dados separados por empresa',
  'Logs de sincronização',
  'Acesso controlado por autenticação',
  'Conexão revogável a qualquer momento',
]

// FAQ — 4 perguntas, respostas honestas.
export const faqItems = [
  {
    q: 'Como os dados são integrados?',
    a: 'Por conexão via API. Você autoriza o acesso ao canal e a plataforma recebe e normaliza os dados automaticamente — sem enviar planilhas ou compartilhar senhas.',
  },
  {
    q: 'Quais canais estão disponíveis atualmente?',
    a: 'A integração com o Mercado Livre está em implantação. Shopee, Amazon, Magalu, Shopify, Nuvemshop e WooCommerce estão planejados; a conexão com loja própria está sob análise técnica.',
  },
  {
    q: 'Quanto tempo leva a implantação?',
    a: 'Varia conforme os canais e o volume da operação. O prazo é definido junto com você durante a demonstração, com acompanhamento da nossa equipe.',
  },
  {
    q: 'Como os dados de cada empresa são protegidos?',
    a: 'Cada operação acessa apenas os próprios dados, com autenticação e separação por empresa. Tokens de integração ficam protegidos no backend, nunca expostos no navegador.',
  },
]

export const contact = {
  email: '',
}

export function specialistHref(): string {
  const wa = whatsappDemoUrl()
  if (wa) return wa
  if (contact.email) return `mailto:${contact.email}`
  return '#demonstracao'
}
