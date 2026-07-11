import { Boxes, AlertTriangle, PauseCircle, Clock, Crown, Wallet, Layers, ShieldAlert } from 'lucide-react'
import { inventoryItems, getEstimatedInventoryValue } from '@/data/mockData'
import { defaultInventoryFilters, type InventoryFilterState } from './InventoryFilters'

const totalSkus = inventoryItems.length
const critical = inventoryItems.filter((i) => i.status === 'critical').length
const stalled = inventoryItems.filter((i) => i.turnoverStatus === 'Parado' || i.turnoverStatus === 'Parado crítico').length
const avgCoverage = Math.round(inventoryItems.reduce((s, i) => s + i.coverageDays, 0) / inventoryItems.length)
const curveA = inventoryItems.filter((i) => i.abcClass === 'A').length
const estimatedValue = getEstimatedInventoryValue()
const excess = inventoryItems.filter((i) => i.coverageDays > 45).length
const curveARisk = inventoryItems.filter((i) => i.abcClass === 'A' && i.coverageDays <= 20).length

interface Props {
  filters: InventoryFilterState
  onChange: (next: InventoryFilterState) => void
}

interface CardDef {
  key: string
  label: string
  value: string
  sub: string
  icon: typeof Boxes
  primary: string
  secondary: string
  /** undefined = card is an aggregate stat, not clickable as a filter */
  apply?: (f: InventoryFilterState) => InventoryFilterState
  isActive?: (f: InventoryFilterState) => boolean
}

const cards: CardDef[] = [
  {
    key: 'total',
    label: 'Total de SKUs',
    value: String(totalSkus),
    sub: 'produtos ativos · clique para limpar filtros',
    icon: Boxes,
    primary: '#4C82F7',
    secondary: '#22D3EE',
    apply: () => ({ ...defaultInventoryFilters, abc: new Set() }),
    isActive: (f) => f.abc.size === 0 && !f.onlyCritical && !f.onlyStalled && !f.onlyLowCoverage && !f.onlyExcess && !f.onlyNoRecentEntry && f.marketplace === 'all' && !f.manufacturerSearch,
  },
  {
    key: 'critical',
    label: 'Estoque Crítico',
    value: String(critical),
    sub: 'ruptura iminente',
    icon: AlertTriangle,
    primary: '#F4436C',
    secondary: '#F9603C',
    apply: (f) => ({ ...defaultInventoryFilters, onlyCritical: !f.onlyCritical }),
    isActive: (f) => f.onlyCritical,
  },
  {
    key: 'stalled',
    label: 'Produtos Parados',
    value: String(stalled),
    sub: 'sem giro relevante',
    icon: PauseCircle,
    primary: '#9061F9',
    secondary: '#8B2942',
    apply: (f) => ({ ...defaultInventoryFilters, onlyStalled: !f.onlyStalled }),
    isActive: (f) => f.onlyStalled,
  },
  {
    key: 'coverage',
    label: 'Cobertura Média',
    value: `${avgCoverage} dias`,
    sub: 'estimativa de duração',
    icon: Clock,
    primary: '#F5A524',
    secondary: '#F5C24B',
  },
  {
    key: 'curveA',
    label: 'Produtos Curva A',
    value: String(curveA),
    sub: 'maior share de faturamento',
    icon: Crown,
    primary: '#16C784',
    secondary: '#22D3EE',
    apply: (f) => ({ ...defaultInventoryFilters, abc: f.abc.has('A') && f.abc.size === 1 ? new Set() : new Set(['A' as const]) }),
    isActive: (f) => f.abc.has('A') && f.abc.size === 1 && !f.onlyLowCoverage,
  },
  {
    key: 'value',
    label: 'Valor Estimado em Estoque',
    value: `R$ ${estimatedValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`,
    sub: 'estoque × custo unitário',
    icon: Wallet,
    primary: '#22D3EE',
    secondary: '#4C82F7',
  },
  {
    key: 'excess',
    label: 'Excesso de Estoque',
    value: String(excess),
    sub: 'cobertura acima de 45 dias',
    icon: Layers,
    primary: '#22D3EE',
    secondary: '#4C82F7',
    apply: (f) => ({ ...defaultInventoryFilters, onlyExcess: !f.onlyExcess }),
    isActive: (f) => f.onlyExcess,
  },
  {
    key: 'curveARisk',
    label: 'Curva A em Risco',
    value: String(curveARisk),
    sub: 'top faturamento, cobertura baixa',
    icon: ShieldAlert,
    primary: '#F4436C',
    secondary: '#F5A524',
    apply: (f) => (f.abc.has('A') && f.onlyLowCoverage ? { ...defaultInventoryFilters } : { ...defaultInventoryFilters, abc: new Set(['A' as const]), onlyLowCoverage: true }),
    isActive: (f) => f.abc.has('A') && f.abc.size === 1 && f.onlyLowCoverage,
  },
]

export default function InventoryKPIs({ filters, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        const clickable = !!c.apply
        const active = c.isActive?.(filters) ?? false
        return (
          <button
            key={c.key}
            onClick={clickable ? () => onChange(c.apply!(filters)) : undefined}
            className={`overview-glass overview-card-hover relative overflow-hidden rounded-[18px] p-3.5 text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
            style={active ? { boxShadow: `inset 0 0 0 1.5px ${c.primary}99, 0 0 20px -6px ${c.primary}66` } : undefined}
          >
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
          </button>
        )
      })}
    </div>
  )
}
