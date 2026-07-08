import { Receipt, ShoppingCart, Tag, Percent, Boxes, Clock, TrendingUp, TrendingDown, Megaphone } from 'lucide-react'
import type { Product, StockItem } from '@/data/mockData'

export default function ProdutoKPIs({ product, stock }: { product: Product; stock: StockItem | undefined }) {
  const positive = product.trend >= 0
  const avgTicket = product.revenue / product.units
  const marketingSpend = Math.round(product.revenue * 0.08)

  const cards = [
    { label: 'Faturamento', value: `R$ ${product.revenue.toLocaleString('pt-BR')}`, icon: Receipt, primary: '#4C82F7', secondary: '#22D3EE' },
    { label: 'Pedidos', value: product.units.toLocaleString('pt-BR'), icon: ShoppingCart, primary: '#16C784', secondary: '#22D3EE' },
    { label: 'Ticket Médio', value: `R$ ${avgTicket.toFixed(2)}`, icon: Tag, primary: '#9061F9', secondary: '#4C82F7' },
    { label: 'Margem', value: `${product.margin}%`, icon: Percent, primary: '#F5A524', secondary: '#F5C24B' },
    { label: 'Estoque Atual', value: stock ? String(stock.stock) : '—', icon: Boxes, primary: '#22D3EE', secondary: '#4C82F7' },
    { label: 'Cobertura', value: stock ? `${stock.coverageDays} dias` : '—', icon: Clock, primary: '#F9603C', secondary: '#F4436C' },
    { label: 'Tendência', value: `${positive ? '+' : ''}${product.trend}%`, icon: positive ? TrendingUp : TrendingDown, primary: positive ? '#16C784' : '#F4436C', secondary: '#F5A524' },
    { label: 'Gasto em Marketing', value: `R$ ${marketingSpend.toLocaleString('pt-BR')}`, icon: Megaphone, primary: '#9061F9', secondary: '#22D3EE' },
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
          </div>
        )
      })}
    </div>
  )
}
