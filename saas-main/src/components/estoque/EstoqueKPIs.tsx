import { Boxes, AlertTriangle, Clock, PauseCircle, PackageX } from 'lucide-react'
import { stockItems } from '@/data/mockData'

const totalStock = stockItems.reduce((s, i) => s + i.stock, 0)
const critical = stockItems.filter((i) => i.status === 'critical').length
const avgCoverage = Math.round(stockItems.reduce((s, i) => s + i.coverageDays, 0) / stockItems.length)
const stalled = stockItems.filter((i) => i.status === 'stalled').length
const rupture = stockItems.filter((i) => i.coverageDays <= 7).length

const cards = [
  { label: 'Itens em Estoque', value: totalStock.toLocaleString('pt-BR'), sub: `${stockItems.length} SKUs ativos`, icon: Boxes, primary: '#4C82F7', secondary: '#22D3EE' },
  { label: 'Estoque Crítico', value: String(critical), sub: 'produtos em estado crítico', icon: AlertTriangle, primary: '#F4436C', secondary: '#F9603C' },
  { label: 'Cobertura Média', value: `${avgCoverage} dias`, sub: 'estimativa de duração', icon: Clock, primary: '#F5A524', secondary: '#F5C24B' },
  { label: 'Produtos Parados', value: String(stalled), sub: 'sem giro relevante', icon: PauseCircle, primary: '#9061F9', secondary: '#4C82F7' },
  { label: 'Ruptura Estimada', value: String(rupture), sub: 'ruptura em ≤ 7 dias', icon: PackageX, primary: '#F9603C', secondary: '#F4436C' },
]

export default function EstoqueKPIs() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className="glass-panel glass-panel-hover group relative overflow-hidden rounded-2xl p-4">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-40 w-40 rounded-full opacity-80 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle, ${c.primary}55, transparent 68%)` }}
            />
            <div
              className="pointer-events-none absolute -bottom-16 -left-14 h-32 w-32 rounded-full opacity-50 blur-2xl transition-opacity duration-500 group-hover:opacity-70"
              style={{ background: `radial-gradient(circle, ${c.secondary}30, transparent 70%)` }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[2px] opacity-60"
              style={{ background: `linear-gradient(90deg, transparent, ${c.primary}, transparent)` }}
            />
            <div className="relative mb-3 flex items-center justify-between">
              <span className="text-xs font-medium text-text-secondary">{c.label}</span>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${c.primary}18`, boxShadow: `0 0 24px -4px ${c.primary}bb, inset 0 0 0 1px ${c.primary}44` }}>
                <Icon className="h-[18px] w-[18px]" style={{ color: c.primary }} />
              </div>
            </div>
            <div className="relative mb-1.5 truncate text-xl font-bold leading-tight tracking-tight text-text-primary">{c.value}</div>
            <div className="relative truncate text-[11px] text-text-muted">{c.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
