import { Receipt, ShoppingCart, Tag, Percent, Boxes, Clock, TrendingUp, TrendingDown, Megaphone } from 'lucide-react'
import type { Product, StockItem } from '@/data/mockData'

export default function ProdutoKPIs({ product, stock }: { product: Product; stock: StockItem | undefined }) {
  const positive = product.trend >= 0
  const avgTicket = product.revenue / product.units
  const marketingSpend = Math.round(product.revenue * 0.08)

  const cards = [
    { label: 'Faturamento', value: `R$ ${product.revenue.toLocaleString('pt-BR')}`, context: 'vs período anterior', icon: Receipt, primary: '#2F6BFF', secondary: '#5AB7FF' },
    { label: 'Pedidos', value: product.units.toLocaleString('pt-BR'), context: 'unidades vendidas', icon: ShoppingCart, primary: '#2BD6A0', secondary: '#5AB7FF' },
    { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(2)}`, context: 'média por pedido', icon: Tag, primary: '#194B9B', secondary: '#2F6BFF' },
    { label: 'Margem', value: `${product.margin}%`, context: 'sobre o faturamento', icon: Percent, primary: '#FFC857', secondary: '#FFC857' },
    { label: 'Estoque Atual', value: stock ? String(stock.stock) : '—', context: 'unidades disponíveis', icon: Boxes, primary: '#5AB7FF', secondary: '#2F6BFF' },
    { label: 'Cobertura', value: stock ? `${stock.coverageDays} dias` : '—', context: 'cobertura estimada', icon: Clock, primary: '#FF5F7A', secondary: '#FF5F7A' },
    { label: 'Tendência', value: `${positive ? '+' : ''}${product.trend}%`, context: 'vs período anterior', icon: positive ? TrendingUp : TrendingDown, primary: positive ? '#2BD6A0' : '#FF5F7A', secondary: '#FFC857' },
    { label: 'Gasto em Marketing', value: `R$ ${marketingSpend.toLocaleString('pt-BR')}`, context: 'investimento atribuído', icon: Megaphone, primary: '#194B9B', secondary: '#5AB7FF' },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
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
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${c.primary}14`, boxShadow: `0 0 20px -5px ${c.primary}99, inset 0 0 0 1px ${c.primary}33` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: c.primary }} />
              </div>
            </div>
            <div className="relative truncate text-lg font-bold leading-tight tracking-tight text-text-primary">{c.value}</div>
            <div className="relative mt-1 truncate text-[10.5px] text-text-muted">{c.context}</div>
          </div>
        )
      })}
    </div>
  )
}
