import { Boxes, Flame, Snowflake, Percent, Receipt, TrendingUp, TrendingDown } from 'lucide-react'
import type { DashboardProduct as Product } from '@/server/dashboardProducts'
import AnimatedNumber from '@/components/common/AnimatedNumber'

type Card = {
  label: string
  /** number = animated counter; string = static text (e.g. a product name). */
  value: number | string
  format?: (v: number) => string
  sub: string
  change?: number | null
  icon: typeof Boxes
  primary: string
}

export default function ProductKPIs({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  const active = products.length
  const bestSeller = [...products].sort((a, b) => b.units - a.units)[0]
  const lowestTurn = [...products].sort((a, b) => a.units - b.units)[0]
  const withMargin = products.filter((p) => p.margin !== null)
  const avgMargin = withMargin.length > 0 ? Math.round(withMargin.reduce((s, p) => s + (p.margin ?? 0), 0) / withMargin.length) : null
  const totalUnits = products.reduce((s, p) => s + p.units, 0)
  const avgTicket = totalUnits > 0 ? products.reduce((s, p) => s + p.revenue, 0) / totalUnits : 0

  const cards: Card[] = [
    { label: 'Produtos Ativos', value: active, format: (v) => String(Math.round(v)), sub: `${products.filter((p) => p.stock > 0).length} com estoque`, icon: Boxes, primary: '#3A8DFF' },
    { label: 'Mais Vendido', value: bestSeller.name.split(' ').slice(0, 2).join(' '), sub: `${bestSeller.units} un. · ${bestSeller.sku ?? bestSeller.id}`, change: bestSeller.trend, icon: Flame, primary: '#3BE38E' },
    { label: 'Menor Giro', value: lowestTurn.name.split(' ').slice(0, 2).join(' '), sub: `${lowestTurn.units} un. · ${lowestTurn.sku ?? lowestTurn.id}`, change: lowestTurn.trend, icon: Snowflake, primary: '#FF5E7D' },
    { label: 'Margem Média', value: avgMargin ?? '—', format: avgMargin !== null ? (v) => `${Math.round(v)}%` : undefined, sub: avgMargin !== null ? 'todos os produtos' : 'defina o custo dos produtos', icon: Percent, primary: '#194B9B' },
    { label: 'Ticket Médio', value: avgTicket, format: (v) => `R$ ${v.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, sub: 'por unidade vendida', icon: Receipt, primary: '#46E5FF' },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        const positive = (c.change ?? 0) >= 0
        return (
          <div key={c.label} className="overview-glass overview-card-hover relative flex h-full min-h-[112px] min-w-0 flex-col overflow-hidden rounded-2xl p-2.5">
            <div className="mb-1.5 flex min-h-[28px] items-start justify-between gap-1.5">
              <span className="min-w-0 text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">{c.label}</span>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c.primary}16`, boxShadow: `inset 0 0 0 1px ${c.primary}33` }}>
                <Icon className="h-3.5 w-3.5" style={{ color: c.primary }} />
              </div>
            </div>

            <div className="truncate font-mono text-[16px] font-bold leading-none tracking-tight text-text-primary">
              {typeof c.value === 'number' && c.format ? <AnimatedNumber value={c.value} format={c.format} /> : c.value}
            </div>

            <div className="mt-auto flex items-center gap-1.5 pt-1.5">
              {c.change !== undefined && c.change !== null && (
                <span className={`flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{c.change}%
                </span>
              )}
              <span className="truncate text-[10px] text-text-muted">{c.sub}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
