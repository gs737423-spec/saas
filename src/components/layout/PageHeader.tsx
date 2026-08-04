import { useLocation } from 'react-router-dom'
import { products } from '@/data/mockData'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Visão Geral', subtitle: 'Resumo consolidado dos seus marketplaces' },
  '/produtos': { title: 'Produtos', subtitle: 'Catálogo, vendas e desempenho por marketplace' },
  '/marketplaces': { title: 'Canais', subtitle: 'Compare faturamento, pedidos e ticket médio por marketplace' },
  '/estoque': { title: 'Estoque', subtitle: 'Cobertura, giro e Curva ABC por produto' },
  '/importacoes': { title: 'Importações', subtitle: 'Envie planilhas, valide dados e acompanhe o histórico' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Fluxo de caixa e resultados consolidados' },
  '/relatorios': { title: 'Relatórios', subtitle: 'Relatórios customizáveis de desempenho' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Conta, integrações e preferências' },
}

// Slim in-content page title. Replaces the old fixed topbar as the title source
// on desktop — scrolls with content, minimal height, no action clutter.
export default function PageHeader() {
  const { pathname } = useLocation()
  // Rotas reais vivem sob /app (ex.: /app/produtos) — normaliza antes de
  // comparar com pageMeta, que usa chaves sem esse prefixo.
  const relativePath = pathname.replace(/^\/app/, '') || '/'
  const produtoMatch = relativePath.match(/^\/produto\/(.+)$/)
  const meta = produtoMatch
    ? (() => {
        const product = products.find((p) => p.sku === produtoMatch[1])
        return { title: product ? product.name : 'Produto 360', subtitle: 'Produto 360 · Saúde e desempenho do produto' }
      })()
    : pageMeta[relativePath] ?? pageMeta['/']

  return (
    <div className="mb-3 flex items-center gap-2.5 sm:mb-4">
      <span className="hidden h-6 w-1 rounded-full bg-gradient-to-b from-accent-blue to-accent-violet sm:block" />
      <div className="min-w-0">
        <h1
          className="truncate font-brand text-[21px] font-semibold leading-[1.2] text-text-primary sm:text-[24px]"
          style={{ letterSpacing: '-0.035em' }}
        >
          {meta.title}
        </h1>
        <p className="hidden truncate text-xs leading-[1.45] text-text-muted sm:block">{meta.subtitle}</p>
      </div>
    </div>
  )
}
