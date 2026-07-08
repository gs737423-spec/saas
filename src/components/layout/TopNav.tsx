import { Search, Bell, Upload, ChevronDown } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { products } from '@/data/mockData'

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Visão Geral', subtitle: 'Inteligência de e-commerce · 4 marketplaces' },
  '/produtos': { title: 'Produtos', subtitle: 'Catálogo, vendas, margem e desempenho dos produtos por marketplace' },
  '/marketplaces': { title: 'Marketplaces', subtitle: 'Receita, pedidos e desempenho por canal de venda' },
  '/estoque': { title: 'Estoque', subtitle: 'Cobertura, giro e alertas de reposição por produto' },
  '/importacoes': { title: 'Importações', subtitle: 'Envie planilhas, valide dados e acompanhe o histórico de importações' },
  '/financeiro': { title: 'Financeiro', subtitle: 'Fluxo de caixa e resultados consolidados' },
  '/marketing': { title: 'Marketing', subtitle: 'Campanhas, ROI e investimento em anúncios' },
  '/avaliacoes': { title: 'Avaliações', subtitle: 'Reputação e reviews por marketplace' },
  '/relatorios': { title: 'Relatórios', subtitle: 'Relatórios customizáveis de desempenho' },
  '/configuracoes': { title: 'Configurações', subtitle: 'Conta, integrações e preferências' },
}

export default function TopNav() {
  const { pathname } = useLocation()
  const produtoMatch = pathname.match(/^\/produto\/(.+)$/)
  const produtoDetalheMeta = produtoMatch
    ? (() => {
        const product = products.find((p) => p.sku === produtoMatch[1])
        return { title: product ? product.name : 'Produto 360', subtitle: 'Produto 360 · Saúde e desempenho do produto' }
      })()
    : null
  const meta = produtoDetalheMeta ?? pageMeta[pathname] ?? pageMeta['/']
  return (
    <header className="fixed left-0 right-0 top-0 z-30 h-14 border-b border-border-subtle bg-bg-secondary/75 backdrop-blur-2xl md:left-16 md:h-16">
      <div className="mx-auto flex h-full max-w-[1600px] items-center justify-between px-3 sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-2.5">
            <h1 className="truncate whitespace-nowrap text-[15px] font-semibold tracking-tight text-text-primary sm:text-[19px]">
              {meta.title}
            </h1>
            <span className="hidden items-center gap-1.5 rounded-full border border-accent-emerald/20 bg-accent-emerald/10 px-2.5 py-1 text-[11px] font-medium text-accent-emerald sm:flex">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-emerald" />
              </span>
              Tempo real
            </span>
          </div>
          <p className="hidden truncate text-xs text-text-muted sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div className="group hidden h-11 items-center gap-2.5 rounded-xl border border-border-subtle bg-bg-card/60 px-3.5 transition-all duration-200 focus-within:border-accent-blue/50 focus-within:bg-bg-card md:flex md:w-48 lg:w-72 xl:w-80">
          <Search className="h-4 w-4 text-text-muted transition-colors group-focus-within:text-accent-blue" />
          <input
            type="text"
            placeholder="Buscar produtos, SKUs, métricas..."
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <kbd className="rounded-md border border-border-default bg-bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-text-muted">⌘K</kbd>
        </div>

        {/* Mobile search icon */}
        <button
          title="Buscar"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:text-text-primary md:hidden"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>

        <button
          title="Importar Dados"
          className="group relative flex h-10 w-10 cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-[0_10px_30px_-8px_rgba(76,130,247,0.6)] md:h-11 md:w-auto md:justify-start md:px-5"
        >
          <span className="absolute inset-0 bg-gradient-to-r from-accent-blue via-[#6C6CF5] to-accent-violet" />
          <span className="absolute inset-0 bg-gradient-to-r from-accent-blue via-[#6C6CF5] to-accent-violet opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-70" />
          <Upload className="relative h-4 w-4 shrink-0" />
          <span className="relative hidden md:inline">Importar Dados</span>
        </button>

        <button className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-border-subtle bg-bg-card/60 text-text-muted transition-colors hover:border-border-default hover:text-text-primary md:h-11 md:w-11">
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-secondary bg-accent-rose" />
        </button>

        <button className="flex h-10 w-10 cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-border-subtle bg-bg-card/60 transition-colors hover:border-border-default hover:bg-bg-card md:h-11 md:w-auto md:px-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-accent-blue to-accent-violet text-xs font-bold text-white">
            GA
          </div>
          <div className="hidden flex-col items-start leading-none md:flex">
            <span className="text-xs font-medium text-text-primary">Gabriel</span>
            <span className="text-[10px] text-text-muted">Admin</span>
          </div>
          <ChevronDown className="hidden h-3.5 w-3.5 text-text-muted md:block" />
        </button>
      </div>
      </div>
    </header>
  )
}
