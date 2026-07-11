import { Boxes, AlertTriangle, PauseCircle, Clock, Crown, Wallet, Layers, ShieldAlert } from 'lucide-react'
import { inventoryItems, getEstimatedInventoryValue } from '@/data/mockData'

const totalSkus = inventoryItems.length
const critical = inventoryItems.filter((i) => i.status === 'critical').length
const stalled = inventoryItems.filter((i) => i.turnoverStatus === 'Parado' || i.turnoverStatus === 'Parado crítico').length
const avgCoverage = Math.round(inventoryItems.reduce((s, i) => s + i.coverageDays, 0) / inventoryItems.length)
const curveA = inventoryItems.filter((i) => i.abcClass === 'A').length
const estimatedValue = getEstimatedInventoryValue()
const excess = inventoryItems.filter((i) => i.coverageDays > 45).length
const curveARisk = inventoryItems.filter((i) => i.abcClass === 'A' && i.coverageDays <= 20).length

const cards = [
  { label: 'Total de SKUs', value: String(totalSkus), sub: 'produtos ativos', icon: Boxes, primary: '#4C82F7', secondary: '#22D3EE' },
  { label: 'Estoque Crítico', value: String(critical), sub: 'ruptura iminente', icon: AlertTriangle, primary: '#F4436C', secondary: '#F9603C' },
  { label: 'Produtos Parados', value: String(stalled), sub: 'sem giro relevante', icon: PauseCircle, primary: '#9061F9', secondary: '#8B2942' },
  { label: 'Cobertura Média', value: `${avgCoverage} dias`, sub: 'estimativa de duração', icon: Clock, primary: '#F5A524', secondary: '#F5C24B' },
  { label: 'Produtos Curva A', value: String(curveA), sub: 'maior share de faturamento', icon: Crown, primary: '#16C784', secondary: '#22D3EE' },
  { label: 'Valor Estimado em Estoque', value: `R$ ${estimatedValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`, sub: 'estoque × custo unitário', icon: Wallet, primary: '#22D3EE', secondary: '#4C82F7' },
  { label: 'Excesso de Estoque', value: String(excess), sub: 'cobertura acima de 45 dias', icon: Layers, primary: '#22D3EE', secondary: '#4C82F7' },
  { label: 'Curva A em Risco', value: String(curveARisk), sub: 'top faturamento, cobertura baixa', icon: ShieldAlert, primary: '#F4436C', secondary: '#F5A524' },
]

export default function InventoryKPIs() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.label} className="overview-glass overview-card-hover relative overflow-hidden rounded-[18px] p-3.5">
            <div
              className="pointer-events-none absolute -right-12 -top-14 h-32 w-32 rounded-full opacity-50 blur-2xl"
              style={{ background: `radial-gradient(circle, ${c.primary}33, transparent 68%)` }}
            />
            <div className="relative mb-2 flex items-center justify-between">
              <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{c.label}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c.primary}16`, boxShadow: `inset 0 0 0 1px ${c.primary}33` }}>
                <Icon className="h-4 w-4" style={{ color: c.primary }} />
              </div>
            </div>
            <div className="relative truncate font-mono text-[19px] font-bold leading-none tracking-tight text-text-primary">{c.value}</div>
            <div className="relative mt-1.5 truncate text-[10.5px] text-text-muted">{c.sub}</div>
          </div>
        )
      })}
    </div>
  )
}
