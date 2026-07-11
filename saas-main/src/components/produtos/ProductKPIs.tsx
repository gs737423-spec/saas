import { Boxes, Flame, Snowflake, Percent, Receipt, TrendingUp, TrendingDown } from 'lucide-react'
import { products } from '@/data/mockData'

// Derive KPIs from mock product data
const active = products.length
const bestSeller = [...products].sort((a, b) => b.units - a.units)[0]
const lowestTurn = [...products].sort((a, b) => a.units - b.units)[0]
const avgMargin = Math.round(products.reduce((s, p) => s + p.margin, 0) / products.length)
const avgTicket = products.reduce((s, p) => s + p.revenue, 0) / products.reduce((s, p) => s + p.units, 0)

type Card = {
  label: string
  value: string
  sub: string
  change?: number
  icon: typeof Boxes
  primary: string
  secondary: string
}

const cards: Card[] = [
  { label: 'Produtos Ativos', value: String(active), sub: `${products.filter((p) => p.stock > 0).length} com estoque`, icon: Boxes, primary: '#4C82F7', secondary: '#22D3EE' },
  { label: 'Mais Vendido', value: bestSeller.name.split(' ').slice(0, 2).join(' '), sub: `${bestSeller.units} un. · ${bestSeller.sku}`, change: bestSeller.trend, icon: Flame, primary: '#16C784', secondary: '#22D3EE' },
  { label: 'Menor Giro', value: lowestTurn.name.split(' ').slice(0, 2).join(' '), sub: `${lowestTurn.units} un. · ${lowestTurn.sku}`, change: lowestTurn.trend, icon: Snowflake, primary: '#F9603C', secondary: '#F5A524' },
  { label: 'Margem Média', value: `${avgMargin}%`, sub: 'todos os produtos', icon: Percent, primary: '#9061F9', secondary: '#4C82F7' },
  { label: 'Ticket Médio', value: `R$ ${avgTicket.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, sub: 'por unidade vendida', icon: Receipt, primary: '#22D3EE', secondary: '#4C82F7' },
]

export default function ProductKPIs() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        const positive = (c.change ?? 0) >= 0
        return (
          <div key={c.label} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-36 w-36 rounded-full opacity-70 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${c.primary}40, transparent 68%)` }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-14 h-32 w-32 rounded-full opacity-40 blur-2xl transition-opacity duration-500 group-hover:opacity-60"
              style={{ background: `radial-gradient(circle, ${c.secondary}22, transparent 70%)` }}
            />

            <div className="relative mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">{c.label}</span>
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl"
                style={{ background: `${c.primary}14`, boxShadow: `0 0 20px -5px ${c.primary}99, inset 0 0 0 1px ${c.primary}33` }}
              >
                <Icon className="h-[18px] w-[18px]" style={{ color: c.primary }} />
              </div>
            </div>

            <div className="relative mb-1.5 truncate text-lg font-bold leading-tight tracking-tight text-text-primary">
              {c.value}
            </div>

            <div className="relative flex items-center gap-2">
              {c.change !== undefined && (
                <span className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${positive ? 'bg-accent-emerald/10 text-accent-emerald' : 'bg-accent-rose/10 text-accent-rose'}`}>
                  {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {positive ? '+' : ''}{c.change}%
                </span>
              )}
              <span className="truncate text-[11px] text-text-muted">{c.sub}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
