import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { getMarketplaceColor } from '@/data/mockData'
import { apiFetchJson } from '@/lib/apiFetch'
import { usePeriod } from '@/contexts/PeriodContext'
import type { DashboardProduct, DashboardProductsResponse } from '@/server/dashboardProducts'

// Produto real (marketplace conectado de verdade) não tem histórico diário
// nem "atividade" por produto ainda — só o que já existe em orders/order_items
// e marketplace_products/inventory. Card enxuto, honesto sobre o que falta,
// em vez de reaproveitar os componentes mock (que assumem 4 marketplaces,
// meta, sparkline diário — nada disso existe pra dado real hoje).
//
// Um SKU pode estar anunciado em mais de um marketplace ao mesmo tempo —
// cada `matches[i]` é um anúncio (1 linha em marketplace_products). A
// página soma tudo pro card principal e detalha o breakdown por
// marketplace embaixo, em vez de mostrar só o primeiro que aparecer.
function ProdutoDetalheReal({ matches }: { matches: DashboardProduct[] }) {
  const first = matches[0]
  const totalRevenue = matches.reduce((s, p) => s + p.revenue, 0)
  const totalUnits = matches.reduce((s, p) => s + p.units, 0)
  const totalStock = matches.reduce((s, p) => s + p.stock, 0)

  // Margem combinada só faz sentido se TODO marketplace tiver custo
  // informado — misturar "com custo" e "sem custo" produziria um número
  // que parece completo mas não é (mesma regra de nunca estimar margem).
  const allHaveMargin = matches.every((p) => p.margin !== null)
  const blendedMargin = allHaveMargin && totalRevenue > 0
    ? matches.reduce((s, p) => s + (p.margin! * p.revenue), 0) / totalRevenue
    : null

  return (
    <div className="space-y-3">
      <Link to="/app/produtos" className="flex w-fit items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Voltar para Produtos
      </Link>

      <div className="glass-panel rounded-2xl p-5">
        <h1 className="text-lg font-bold tracking-tight text-text-primary">{first.name}</h1>
        <p className="mt-1 text-xs text-text-muted">
          {first.sku ?? first.id} · {first.category ?? 'Sem categoria'}
          {matches.length > 1 ? ` · vendido em ${matches.length} marketplaces` : ` · ${first.marketplace}`}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">R$ {totalRevenue.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-text-muted">faturamento total no período</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">{totalUnits.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-text-muted">unidades vendidas</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">{totalStock.toLocaleString('pt-BR')}</p>
          <p className="text-[11px] text-text-muted">estoque disponível total</p>
        </div>
        <div className="glass-panel rounded-2xl p-4">
          <p className="text-2xl font-bold tabular-nums text-text-primary">{blendedMargin !== null ? `${blendedMargin.toFixed(0)}%` : '—'}</p>
          <p className="text-[11px] text-text-muted">{blendedMargin !== null ? 'margem média ponderada' : 'defina o custo em todos os marketplaces'}</p>
        </div>
      </div>

      {matches.length > 1 && (
        <div className="glass-panel rounded-2xl p-4 sm:p-5">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">Por marketplace</h3>
          <div className="flex flex-col gap-2.5">
            {matches
              .slice()
              .sort((a, b) => b.revenue - a.revenue)
              .map((p) => {
                const color = getMarketplaceColor(p.marketplace)
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 border-t border-border-subtle/50 pt-2.5 first:border-t-0 first:pt-0">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                      <span className="font-medium text-text-primary">{p.marketplace}</span>
                      <span className="font-mono text-[11px] text-text-muted">{p.sku ?? p.id}</span>
                    </div>
                    <div className="text-right text-[13px]">
                      <span className="font-semibold text-text-primary">R$ {p.revenue.toLocaleString('pt-BR')}</span>
                      <span className="ml-2 text-text-muted">{p.units.toLocaleString('pt-BR')} un</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-5 text-center text-xs text-text-muted">
        Histórico diário de vendas e feed de atividade por produto ainda não existem pra dado real — dependem de uma tabela de série temporal que não foi criada ainda.
      </div>
    </div>
  )
}

export default function ProdutoDetalhe() {
  const { sku } = useParams<{ sku: string }>()
  const { period } = usePeriod()
  const [real, setReal] = useState<DashboardProductsResponse | null>(null)
  const [loadingReal, setLoadingReal] = useState(true)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<DashboardProductsResponse>(`/api/dashboard/products?days=${period.days}`).then((data) => {
      if (!cancelled) {
        setReal(data)
        setLoadingReal(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  if (loadingReal) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  // Um SKU vendido em 2+ marketplaces produz 2+ linhas em items (1 por
  // anúncio/conexão) — pega todas, não só a primeira, senão o
  // faturamento/estoque dos outros marketplaces some da tela sem aviso.
  const matches = (real?.items ?? []).filter((p) => (p.sku && p.sku === sku) || p.id === sku)

  if (matches.length > 0) {
    return <ProdutoDetalheReal matches={matches} />
  }

  return (
    <div className="glass-panel rounded-2xl p-6 text-center">
      <p className="text-sm font-medium text-text-primary">Produto não encontrado</p>
      <p className="mt-1 text-[13px] text-text-muted">Nenhum produto com o identificador "{sku}" foi encontrado.</p>
      <Link to="/app/produtos" className="mt-4 inline-block rounded-lg bg-accent-blue/10 px-4 py-2 text-[13px] font-medium text-accent-blue hover:bg-accent-blue/20">
        Voltar para Produtos
      </Link>
    </div>
  )
}
