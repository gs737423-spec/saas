import { Boxes, AlertTriangle, PauseCircle, RefreshCw, Crown, Wallet, Layers, ShieldAlert } from 'lucide-react'
import { inventoryItems, getEstimatedInventoryValue } from '@/data/mockData'
import { defaultInventoryFilters, type InventoryFilterState } from './InventoryFilters'
import { useInventorySettings } from '@/contexts/InventorySettingsContext'

const totalSkus = inventoryItems.length
const critical = inventoryItems.filter((i) => i.status === 'critical').length
const avgTurnover = inventoryItems.reduce((s, i) => s + i.turnover, 0) / inventoryItems.length
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

function buildCards(stalled: number): CardDef[] {
  return [
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
      key: 'turnover',
      label: 'Giro Médio',
      value: `${avgTurnover.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}x`,
      sub: 'vendas ÷ estoque médio',
      icon: RefreshCw,
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
}

function RiskExtremesCard({ filters, onChange }: Props) {
  const criticalActive = filters.onlyCritical
  const excessActive = filters.onlyExcess
  return (
    <div className="overview-glass overview-card-hover relative flex flex-col overflow-hidden rounded-2xl p-2.5">
      <span className="mb-1.5 block min-h-[28px] text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">Crítico / Excesso</span>
      <div className="mt-auto grid grid-cols-2 divide-x divide-border-subtle">
        <button
          type="button"
          onClick={() => onChange({ ...defaultInventoryFilters, onlyCritical: !filters.onlyCritical })}
          className="cursor-pointer pr-2 text-left"
          style={criticalActive ? { boxShadow: `inset 0 0 0 1.5px #F4436C99` } : undefined}
        >
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#F4436C' }} />
            <span className="font-mono text-[16px] font-bold leading-none text-text-primary">{critical}</span>
          </div>
          <div className="mt-1 truncate text-[10px] text-text-muted">crítico · ruptura</div>
        </button>
        <button
          type="button"
          onClick={() => onChange({ ...defaultInventoryFilters, onlyExcess: !filters.onlyExcess })}
          className="cursor-pointer pl-2 text-left"
          style={excessActive ? { boxShadow: `inset 0 0 0 1.5px #22D3EE99` } : undefined}
        >
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5" style={{ color: '#22D3EE' }} />
            <span className="font-mono text-[16px] font-bold leading-none text-text-primary">{excess}</span>
          </div>
          <div className="mt-1 truncate text-[10px] text-text-muted">excesso · &gt;45d</div>
        </button>
      </div>
    </div>
  )
}

function Card({ c, filters, onChange }: { c: CardDef } & Props) {
  const Icon = c.icon
  const clickable = !!c.apply
  const active = c.isActive?.(filters) ?? false
  return (
    <button
      onClick={clickable ? () => onChange(c.apply!(filters)) : undefined}
      className={`overview-glass overview-card-hover relative flex flex-col overflow-hidden rounded-2xl p-2.5 text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      style={active ? { boxShadow: `inset 0 0 0 1.5px ${c.primary}99, 0 0 20px -6px ${c.primary}66` } : undefined}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-50 blur-2xl"
        style={{ background: `radial-gradient(circle, ${c.primary}33, transparent 68%)` }}
      />
      <div className="relative mb-1.5 flex min-h-[28px] items-start justify-between gap-1.5">
        <span className="text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">{c.label}</span>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c.primary}16`, boxShadow: `inset 0 0 0 1px ${c.primary}33` }}>
          <Icon className="h-3.5 w-3.5" style={{ color: c.primary }} />
        </div>
      </div>
      <div className="relative mt-auto truncate font-mono text-[16px] font-bold leading-none tracking-tight text-text-primary">{c.value}</div>
      <div className="relative mt-1 truncate text-[10px] text-text-muted">{c.sub}</div>
    </button>
  )
}

export default function InventoryKPIs({ filters, onChange }: Props) {
  const { classifyTurnover } = useInventorySettings()
  const stalled = inventoryItems.filter((i) => {
    const st = classifyTurnover(i.turnover)
    return st === 'Parado' || st === 'Parado crítico'
  }).length
  const cards = buildCards(stalled)

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {cards.slice(0, 2).map((c) => (
        <Card key={c.key} c={c} filters={filters} onChange={onChange} />
      ))}
      <RiskExtremesCard filters={filters} onChange={onChange} />
      {cards.slice(2).map((c) => (
        <Card key={c.key} c={c} filters={filters} onChange={onChange} />
      ))}
    </div>
  )
}
