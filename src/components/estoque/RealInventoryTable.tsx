import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Search, ChevronDown, Check, Boxes, PauseCircle, RefreshCw, Crown, Wallet, Layers, ShieldAlert, AlertTriangle } from 'lucide-react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'
import type { AbcClass, DashboardInventoryItem } from '@/server/integrations/types'
import DataTableViewport from '@/components/common/DataTableViewport'

function relativeDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

const ABC_STYLE: Record<AbcClass, { color: string; bg: string }> = {
  A: { color: '#3BE38E', bg: 'rgba(43,214,160,0.14)' },
  B: { color: '#3A8DFF', bg: 'rgba(47,107,255,0.14)' },
  C: { color: '#6F829B', bg: 'rgba(111,130,155,0.16)' },
}

// Cobertura (dias de estoque no ritmo de venda atual) — derivada de campos
// já reais (availableQuantity/soldQuantity), sem nenhum dado novo inventado.
function coverageDays(item: DashboardInventoryItem): number | null {
  if (!item.soldQuantity || item.soldQuantity <= 0) return null
  const dailyRate = item.soldQuantity / 30
  return dailyRate > 0 ? item.availableQuantity / dailyRate : null
}

type GiroStatus = 'Saudável' | 'Normal' | 'Lento' | 'Parado' | 'Parado crítico'

function classifyGiro(item: DashboardInventoryItem, cov: number | null): GiroStatus {
  if ((item.soldQuantity ?? 0) === 0) return item.availableQuantity > 0 ? 'Parado crítico' : 'Parado'
  if (cov === null) return 'Normal'
  if (cov < 7) return 'Saudável'
  if (cov < 20) return 'Normal'
  if (cov < 45) return 'Lento'
  return 'Parado'
}

const GIRO_STYLE: Record<GiroStatus, { color: string; bg: string }> = {
  'Saudável': { color: '#3BE38E', bg: 'rgba(43,214,160,0.14)' },
  'Normal': { color: '#3A8DFF', bg: 'rgba(47,107,255,0.14)' },
  'Lento': { color: '#FFC95A', bg: 'rgba(255,201,90,0.14)' },
  'Parado': { color: '#9061F9', bg: 'rgba(144,97,249,0.14)' },
  'Parado crítico': { color: '#FF5E7D', bg: 'rgba(255,94,125,0.14)' },
}

function coverageLabel(cov: number | null): { color: string; label: string } {
  if (cov === null) return { color: '#6F829B', label: 'sem venda' }
  if (cov < 7) return { color: '#FF5E7D', label: 'Crítico' }
  if (cov < 15) return { color: '#FFC95A', label: 'Atenção' }
  if (cov < 45) return { color: '#3BE38E', label: 'Saudável' }
  return { color: '#46E5FF', label: 'Excesso' }
}

interface FilterState {
  abc: Set<AbcClass>
  onlyCritical: boolean
  onlyStalled: boolean
  marketplace: Marketplace | 'all'
  manufacturerSearch: string
  onlyLowCoverage: boolean
  onlyExcess: boolean
  onlyNoRecentEntry: boolean
}

const defaultFilters: FilterState = {
  abc: new Set(),
  onlyCritical: false,
  onlyStalled: false,
  marketplace: 'all',
  manufacturerSearch: '',
  onlyLowCoverage: false,
  onlyExcess: false,
  onlyNoRecentEntry: false,
}

function isDefault(f: FilterState): boolean {
  return f.abc.size === 0 && !f.onlyCritical && !f.onlyStalled && !f.onlyLowCoverage && !f.onlyExcess && !f.onlyNoRecentEntry && f.marketplace === 'all' && !f.manufacturerSearch
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`motion-chip cursor-pointer rounded-full border px-3 py-1.5 text-[11.5px] font-medium ${
        active ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue' : 'border-border-subtle bg-bg-primary/40 text-text-muted hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  )
}

const MARKETPLACES: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']

function MarketplaceDropdown({ value, onChange }: { value: Marketplace | 'all'; onChange: (v: Marketplace | 'all') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  const options: (Marketplace | 'all')[] = ['all', ...MARKETPLACES]
  const optionLabel = (v: Marketplace | 'all') => (v === 'all' ? 'Todos os canais' : v)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`motion-chip flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] font-medium ${
          open ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue' : 'border-border-subtle bg-bg-primary/40 text-text-secondary hover:text-text-primary'
        }`}
      >
        {optionLabel(value)}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full z-30 mt-1.5 min-w-[180px] overflow-hidden rounded-xl border border-border-subtle bg-bg-card shadow-2xl">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex w-full cursor-pointer items-center justify-between gap-2 px-3.5 py-2 text-left text-[12px] font-medium transition-colors ${
                value === opt ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
              }`}
            >
              {optionLabel(opt)}
              {value === opt && <Check className="h-3.5 w-3.5" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function RealInventoryTable({ items }: { items: DashboardInventoryItem[] }) {
  const [filters, setFilters] = useState<FilterState>(defaultFilters)
  const [sort, setSort] = useState<'revenue' | 'stock' | 'units30d' | 'coverage'>('revenue')

  const enriched = useMemo(() => items.map((item) => {
    const cov = coverageDays(item)
    const giro = classifyGiro(item, cov)
    return { item, cov, giro }
  }), [items])

  // Dados de fornecedor/NF só existem no Modo Demonstração (sem tabela de
  // purchase orders/NF real ainda — ver DashboardInventoryItem em types.ts).
  // Sync real do Mercado Livre nunca preenche esses 5 campos: em vez de
  // mostrar colunas inteiras de "—" (parece bug de sync pro cliente),
  // esconde a seção inteira quando nenhum item tem esse dado.
  const hasSupplierData = useMemo(
    () => items.some((i) => i.manufacturerCode != null || i.lastEntryAt != null || i.entryQty != null || i.lastInvoiceNumber != null || i.freightValue != null),
    [items]
  )

  const stalledCount = enriched.filter((e) => e.giro === 'Parado' || e.giro === 'Parado crítico').length
  const criticalCount = enriched.filter((e) => e.cov !== null && e.cov < 7).length
  const excessCount = enriched.filter((e) => e.cov !== null && e.cov > 45).length
  const curvaA = items.filter((i) => i.abcClass === 'A')
  const curvaARiskCount = enriched.filter((e) => e.item.abcClass === 'A' && e.cov !== null && e.cov < 15).length
  const totalValue = items.reduce((sum, i) => sum + (i.price ?? 0) * i.availableQuantity, 0)
  const turnoverValues = items.map((i) => i.turnoverRate).filter((t): t is number => t !== null)
  const avgTurnover = turnoverValues.length > 0 ? turnoverValues.reduce((s, t) => s + t, 0) / turnoverValues.length : null

  const filtered = enriched.filter(({ item, cov, giro }) => {
    if (filters.abc.size > 0 && (!item.abcClass || !filters.abc.has(item.abcClass))) return false
    if (filters.onlyCritical && !(cov !== null && cov < 7)) return false
    if (filters.onlyStalled && !(giro === 'Parado' || giro === 'Parado crítico')) return false
    if (filters.marketplace !== 'all' && item.marketplace !== filters.marketplace) return false
    if (filters.manufacturerSearch && !(item.manufacturerCode ?? '').toLowerCase().includes(filters.manufacturerSearch.toLowerCase())) return false
    if (filters.onlyLowCoverage && !(cov !== null && cov < 15)) return false
    if (filters.onlyExcess && !(cov !== null && cov > 45)) return false
    if (filters.onlyNoRecentEntry) {
      const daysSince = item.lastEntryAt ? (Date.now() - new Date(item.lastEntryAt).getTime()) / 86400000 : Infinity
      if (daysSince < 20) return false
    }
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'revenue') return b.item.revenue30d - a.item.revenue30d
    if (sort === 'stock') return b.item.availableQuantity - a.item.availableQuantity
    if (sort === 'units30d') return (b.item.soldQuantity ?? 0) - (a.item.soldQuantity ?? 0)
    return (b.cov ?? 0) - (a.cov ?? 0)
  })

  const totalRevenue = items.reduce((s, i) => s + i.revenue30d, 0)

  const kpis: { key: string; label: string; value: string; sub: string; icon: typeof Boxes; primary: string; onClick?: () => void; active?: boolean }[] = [
    { key: 'value', label: 'Valor Estimado em Estoque', value: `R$ ${Math.round(totalValue).toLocaleString('pt-BR')}`, sub: 'estoque × preço', icon: Wallet, primary: '#46E5FF' },
    { key: 'total', label: 'Total de SKUs', value: String(items.length), sub: 'produtos ativos · clique para limpar filtros', icon: Boxes, primary: '#3A8DFF', onClick: () => setFilters(defaultFilters), active: isDefault(filters) },
    { key: 'stalled', label: 'Produtos Parados', value: String(stalledCount), sub: 'sem giro relevante', icon: PauseCircle, primary: '#9061F9', onClick: () => setFilters((f) => ({ ...defaultFilters, onlyStalled: !f.onlyStalled })), active: filters.onlyStalled },
    { key: 'turnover', label: 'Giro Médio', value: avgTurnover !== null ? `${avgTurnover.toFixed(1)}x` : '—', sub: 'vendas ÷ estoque médio', icon: RefreshCw, primary: '#FFC95A' },
    { key: 'curveA', label: 'Produtos Curva A', value: String(curvaA.length), sub: 'maior share de faturamento', icon: Crown, primary: '#3BE38E', onClick: () => setFilters((f) => ({ ...defaultFilters, abc: f.abc.has('A') && f.abc.size === 1 ? new Set() : new Set<AbcClass>(['A']) })), active: filters.abc.has('A') && filters.abc.size === 1 && !filters.onlyLowCoverage },
    { key: 'curveARisk', label: 'Curva A em Risco', value: String(curvaARiskCount), sub: 'top faturamento, cobertura baixa', icon: ShieldAlert, primary: '#FF5E7D', onClick: () => setFilters((f) => (f.abc.has('A') && f.onlyLowCoverage ? defaultFilters : { ...defaultFilters, abc: new Set<AbcClass>(['A']), onlyLowCoverage: true })), active: filters.abc.has('A') && filters.abc.size === 1 && filters.onlyLowCoverage },
  ]

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {kpis.slice(0, 2).map((c) => (
          <KpiCard key={c.key} c={c} />
        ))}

        {/* Crítico / Excesso — 1 card, 2 metades clicáveis */}
        <div className="overview-glass overview-card-hover relative flex h-full min-h-[112px] min-w-0 flex-col overflow-hidden rounded-2xl p-2.5">
          <span className="mb-1.5 block min-h-[28px] text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">Crítico / Excesso</span>
          <div className="mt-auto grid grid-cols-2 divide-x divide-border-subtle">
            <button type="button" onClick={() => setFilters((f) => ({ ...defaultFilters, onlyCritical: !f.onlyCritical }))} className="cursor-pointer pr-2 text-left" style={filters.onlyCritical ? { boxShadow: 'inset 0 0 0 1.5px #FF5E7D99' } : undefined}>
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" style={{ color: '#FF5E7D' }} />
                <span className="font-mono text-[16px] font-bold leading-none text-text-primary">{criticalCount}</span>
              </div>
              <div className="mt-1 truncate text-[10px] text-text-muted">crítico · ruptura</div>
            </button>
            <button type="button" onClick={() => setFilters((f) => ({ ...defaultFilters, onlyExcess: !f.onlyExcess }))} className="cursor-pointer pl-2 text-left" style={filters.onlyExcess ? { boxShadow: 'inset 0 0 0 1.5px #46E5FF99' } : undefined}>
              <div className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" style={{ color: '#46E5FF' }} />
                <span className="font-mono text-[16px] font-bold leading-none text-text-primary">{excessCount}</span>
              </div>
              <div className="mt-1 truncate text-[10px] text-text-muted">excesso · &gt;45d</div>
            </button>
          </div>
        </div>

        {kpis.slice(2).map((c) => (
          <KpiCard key={c.key} c={c} />
        ))}
      </div>

      <div className="overview-glass-elevated motion-panel flex flex-col rounded-2xl p-4 sm:p-5">
        <div className="mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight text-text-primary">Estoque por Produto</h3>
            <p className="mt-0.5 text-xs text-text-muted">{sorted.length} de {items.length} produtos · inclui Curva ABC</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-border-subtle bg-bg-primary/40 p-0.5">
            <span className="px-1.5 text-[9px] font-medium uppercase tracking-wider text-text-muted">Ordenar</span>
            {[
              { key: 'revenue' as const, label: 'Faturamento' },
              { key: 'stock' as const, label: 'Estoque' },
              { key: 'units30d' as const, label: 'Vendas 30d' },
              { key: 'coverage' as const, label: 'Cobertura' },
            ].map((o) => (
              <button
                key={o.key}
                type="button"
                onClick={() => setSort(o.key)}
                className={`motion-chip cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium ${sort === o.key ? 'bg-accent-blue/15 text-accent-blue' : 'text-text-muted hover:text-text-secondary'}`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3.5 overview-glass motion-panel flex flex-wrap items-center gap-2 rounded-xl px-3.5 py-3">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Curva</span>
          {(['A', 'B', 'C'] as const).map((c) => (
            <Chip key={c} active={filters.abc.has(c)} onClick={() => setFilters((f) => { const next = new Set(f.abc); if (next.has(c)) next.delete(c); else next.add(c); return { ...f, abc: next } })}>{c}</Chip>
          ))}
          <span className="mx-1 h-4 w-px bg-border-subtle" />
          <Chip active={filters.onlyCritical} onClick={() => setFilters((f) => ({ ...f, onlyCritical: !f.onlyCritical }))}>Crítico</Chip>
          <Chip active={filters.onlyStalled} onClick={() => setFilters((f) => ({ ...f, onlyStalled: !f.onlyStalled }))}>Parado</Chip>
          <Chip active={filters.onlyLowCoverage} onClick={() => setFilters((f) => ({ ...f, onlyLowCoverage: !f.onlyLowCoverage }))}>Cobertura baixa</Chip>
          <Chip active={filters.onlyExcess} onClick={() => setFilters((f) => ({ ...f, onlyExcess: !f.onlyExcess }))}>Excesso</Chip>
          {hasSupplierData && (
            <Chip active={filters.onlyNoRecentEntry} onClick={() => setFilters((f) => ({ ...f, onlyNoRecentEntry: !f.onlyNoRecentEntry }))}>Sem entrada recente</Chip>
          )}
          <span className="mx-1 h-4 w-px bg-border-subtle" />
          <MarketplaceDropdown value={filters.marketplace} onChange={(v) => setFilters((f) => ({ ...f, marketplace: v }))} />
          {hasSupplierData && (
            <div className="motion-input flex min-w-[160px] flex-1 items-center gap-1.5 rounded-full border border-border-subtle bg-bg-primary/40 px-3 py-1.5 focus-within:border-accent-blue/50">
              <Search className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <input
                value={filters.manufacturerSearch}
                onChange={(e) => setFilters((f) => ({ ...f, manufacturerSearch: e.target.value }))}
                placeholder="Código fabricante..."
                className="w-full bg-transparent text-[11.5px] text-text-secondary placeholder:text-text-muted focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Mobile: stacked cards */}
        <div className="space-y-2.5 md:hidden">
          {sorted.map(({ item, cov, giro }) => {
            const mp = getMarketplaceColor(item.marketplace)
            const covStyle = coverageLabel(cov)
            return (
              <div key={`${item.marketplace}-${item.sku ?? item.title}`} className="overview-glass relative overflow-hidden rounded-xl p-3.5" style={{ boxShadow: `inset 3px 0 0 ${covStyle.color}` }}>
                <div className="mb-2 flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    {item.sku ? (
                      <Link to={`/app/produto/${item.sku}`} className="block truncate text-[13px] font-medium text-text-primary hover:text-accent-blue hover:underline">{item.title}</Link>
                    ) : (
                      <p className="truncate text-[13px] font-medium text-text-primary">{item.title}</p>
                    )}
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <span className="font-mono text-[10px] text-text-muted">{item.sku ?? '—'}</span>
                      <span className="text-text-muted">·</span>
                      <span className="text-[10px] font-medium" style={{ color: mp }}>{item.marketplace}</span>
                    </div>
                  </div>
                  {item.abcClass && <span className="shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold" style={{ color: ABC_STYLE[item.abcClass].color, background: ABC_STYLE[item.abcClass].bg }}>{item.abcClass}</span>}
                </div>
                <div className="grid grid-cols-3 gap-x-3 gap-y-2 border-t border-border-subtle/50 pt-2.5 text-[11px]">
                  <div><p className="text-text-muted">Estoque</p><p className="mt-0.5 font-mono text-text-primary">{item.availableQuantity}</p></div>
                  <div><p className="text-text-muted">Vendas 30d</p><p className="mt-0.5 font-mono text-text-secondary">{item.soldQuantity ?? '—'}</p></div>
                  <div><p className="text-text-muted">Cobertura</p><p className="mt-0.5 font-mono font-semibold" style={{ color: covStyle.color }}>{cov !== null ? `${Math.round(cov)}d` : '—'}</p></div>
                  <div><p className="text-text-muted">Valor em Estoque</p><p className="mt-0.5 font-mono text-text-secondary">R$ {brl((item.price ?? 0) * item.availableQuantity)}</p></div>
                  <div><p className="text-text-muted">Giro</p><p className="mt-0.5 font-semibold" style={{ color: GIRO_STYLE[giro].color }}>{giro}</p></div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Desktop: table com scroll próprio */}
        <div className="hidden md:block">
          <DataTableViewport size="large" ariaLabel="Estoque por produto. Role para visualizar mais itens." className="-mx-1 rounded-xl px-1">
            <table className="w-full min-w-[1040px] text-sm">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[10.5px] font-semibold uppercase tracking-wider text-text-muted">
                  <th className="pb-3 pr-2 pl-2 font-semibold">Código</th>
                  <th className="pb-3 pr-2 font-semibold">Descrição</th>
                  {hasSupplierData && <th className="hidden pb-3 pr-2 font-semibold xl:table-cell">Cód. Fabricante</th>}
                  <th className="pb-3 pr-2 text-center font-semibold">Estoque</th>
                  <th className="pb-3 pr-2 text-center font-semibold">Vendas 30d</th>
                  <th className="pb-3 pr-2 text-center font-semibold">Cobertura</th>
                  {hasSupplierData && <th className="hidden pb-3 pr-2 text-center font-semibold lg:table-cell">Últ. Entrada</th>}
                  {hasSupplierData && <th className="hidden pb-3 pr-2 text-center font-semibold xl:table-cell">Qtd. Entrada</th>}
                  {hasSupplierData && <th className="pb-3 pr-2 text-center font-semibold">Última NF</th>}
                  {hasSupplierData && <th className="hidden pb-3 pr-2 text-center font-semibold lg:table-cell">Valor Frete</th>}
                  <th className="pb-3 pr-2 text-center font-semibold">Valor em Estoque</th>
                  <th className="hidden pb-3 pr-2 text-center font-semibold xl:table-cell">Média</th>
                  <th className="pb-3 pr-2 text-center font-semibold">Share</th>
                  <th className="pb-3 pr-2 text-center font-semibold">ABC</th>
                  <th className="pb-3 pr-2 text-center font-semibold">Giro</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map(({ item, cov, giro }) => {
                  const covStyle = coverageLabel(cov)
                  const stockValue = (item.price ?? 0) * item.availableQuantity
                  const avgTicket = item.soldQuantity && item.soldQuantity > 0 ? item.revenue30d / item.soldQuantity : 0
                  const share = totalRevenue > 0 ? (item.revenue30d / totalRevenue) * 100 : 0
                  return (
                    <tr key={`${item.marketplace}-${item.sku ?? item.title}`} className="motion-row border-b border-border-subtle/50 hover:border-border-default/70 hover:bg-bg-card-hover/50">
                      <td className="max-w-[130px] truncate py-3 pr-2 pl-2 font-mono text-[11px] text-text-muted" title={item.sku ?? undefined}>{item.sku ?? '—'}</td>
                      <td className="max-w-[220px] py-3 pr-2">
                        {item.sku ? (
                          <Link to={`/app/produto/${item.sku}`} className="block truncate font-medium text-text-primary hover:text-accent-blue hover:underline" title={item.title}>{item.title}</Link>
                        ) : (
                          <span className="block truncate font-medium text-text-primary" title={item.title}>{item.title}</span>
                        )}
                      </td>
                      {hasSupplierData && <td className="hidden max-w-[110px] truncate py-3 pr-2 font-mono text-[11px] text-text-muted xl:table-cell" title={item.manufacturerCode ?? undefined}>{item.manufacturerCode ?? '—'}</td>}
                      <td className="py-3 pr-2 text-center font-mono text-text-secondary">{item.availableQuantity}</td>
                      <td className="py-3 pr-2 text-center font-mono text-text-secondary">{item.soldQuantity ?? '—'}</td>
                      <td className="py-3 pr-2 text-center">
                        <span className="rounded-md px-2 py-0.5 font-mono text-[11px] font-semibold" style={{ color: covStyle.color, background: `${covStyle.color}1F` }}>
                          {cov !== null ? `${Math.round(cov)}d · ${covStyle.label}` : covStyle.label}
                        </span>
                      </td>
                      {hasSupplierData && <td className="hidden py-3 pr-2 text-center font-mono text-[11px] text-text-secondary lg:table-cell">{relativeDate(item.lastEntryAt)}</td>}
                      {hasSupplierData && <td className="hidden py-3 pr-2 text-center font-mono text-text-secondary xl:table-cell">{item.entryQty ?? '—'}</td>}
                      {hasSupplierData && <td className="py-3 pr-2 text-center font-mono text-text-secondary">{item.lastInvoiceNumber ?? '—'}</td>}
                      {hasSupplierData && <td className="hidden py-3 pr-2 text-center font-mono text-text-secondary lg:table-cell">{item.freightValue != null ? `R$ ${brl2(item.freightValue)}` : '—'}</td>}
                      <td className="py-3 pr-2 text-center font-mono text-text-primary">R$ {brl(stockValue)}</td>
                      <td className="hidden py-3 pr-2 text-center font-mono text-text-secondary xl:table-cell">R$ {brl2(avgTicket)}</td>
                      <td className="py-3 pr-2 text-center font-mono text-text-secondary">{pct(share)}%</td>
                      <td className="py-3 pr-2 text-center">
                        {item.abcClass ? <span className="rounded-md px-2 py-0.5 text-[11px] font-bold" style={{ color: ABC_STYLE[item.abcClass].color, background: ABC_STYLE[item.abcClass].bg }}>{item.abcClass}</span> : <span className="text-text-muted">—</span>}
                      </td>
                      <td className="py-3 pr-2 text-center">
                        <span className="whitespace-nowrap rounded-md px-2 py-0.5 text-[10.5px] font-semibold" style={{ color: GIRO_STYLE[giro].color, background: GIRO_STYLE[giro].bg }}>{giro}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </DataTableViewport>
        </div>
      </div>
    </div>
  )
}

function KpiCard({ c }: { c: { label: string; value: string; sub: string; icon: typeof Boxes; primary: string; onClick?: () => void; active?: boolean } }) {
  const clickable = Boolean(c.onClick)
  return (
    <button
      type="button"
      onClick={c.onClick}
      disabled={!clickable}
      className={`overview-glass overview-card-hover relative flex h-full min-h-[112px] min-w-0 flex-col overflow-hidden rounded-2xl p-2.5 text-left ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
      style={c.active ? { boxShadow: `inset 0 0 0 1.5px ${c.primary}99, 0 0 20px -6px ${c.primary}66` } : undefined}
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full opacity-50 blur-2xl" style={{ background: `radial-gradient(circle, ${c.primary}33, transparent 68%)` }} />
      <div className="relative mb-1.5 flex min-h-[28px] items-start justify-between gap-1.5">
        <span className="min-w-0 text-[9.5px] font-medium uppercase leading-tight tracking-wider text-text-muted">{c.label}</span>
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c.primary}16`, boxShadow: `inset 0 0 0 1px ${c.primary}33` }}>
          <c.icon className="h-3.5 w-3.5" style={{ color: c.primary }} />
        </div>
      </div>
      <div className="relative mt-auto truncate font-mono text-[16px] font-bold leading-none tracking-tight text-text-primary">{c.value}</div>
      <div className="relative mt-1 truncate text-[10px] text-text-muted">{c.sub}</div>
    </button>
  )
}
