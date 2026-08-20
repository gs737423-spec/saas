import { useEffect, useMemo, useState } from 'react'
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getMarketplaceColor } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'
import { buildChannelComparison, safeDeltaPct, type ChannelComparison, type ComparisonChannelKey, type ComparisonDailyPoint } from '@/lib/marketplaceComparison'

const fallbackChannels: { key: ComparisonChannelKey; label: string }[] = [
  { key: 'mercadolivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojapropria', label: 'Loja Própria' },
]

interface DailyApiResponse { ok: boolean; source: string; days: ComparisonDailyPoint[]; channels?: Array<{ key: string; label: string }> }

const compareOptions = [
  { key: 'yesterday' as const, label: 'Ontem', offsetDays: 1 },
  { key: 'week' as const, label: 'Semana passada', offsetDays: 7 },
  { key: 'month' as const, label: 'Mês passado', offsetDays: 30 },
]

type CompareKey = (typeof compareOptions)[number]['key']
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const compactMoney = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
const axisMoney = new Intl.NumberFormat('pt-BR', { notation: 'compact', maximumFractionDigits: 1 })
const pct = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function RevenueByChannelChart() {
  const { period } = usePeriod()
  const [compareKey, setCompareKey] = useState<CompareKey>('week')
  const [allDays, setAllDays] = useState<ComparisonDailyPoint[]>([])
  const [availableChannels, setAvailableChannels] = useState<Array<{ key: string; label: string }>>(fallbackChannels)
  const [loading, setLoading] = useState(true)
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  useEffect(() => {
    setCompareKey(period.days <= 1 ? 'yesterday' : period.days <= 10 ? 'week' : 'month')
  }, [period.days])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<DailyApiResponse>(`/api/dashboard/finance-daily?days=${period.days}`).then((response) => {
      if (!cancelled) {
        setAllDays(response?.days ?? [])
        setAvailableChannels(response?.channels?.length ? response.channels : fallbackChannels)
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [period.days])

  const compare = compareOptions.find((option) => option.key === compareKey) ?? compareOptions[1]
  const rows = useMemo(() => {
    const currentDays = allDays.slice(-period.days)
    const totals = new Map(availableChannels.map((channel) => [channel.key, currentDays.reduce((sum, point) => {
      const dynamic = point.channels?.[channel.key]
      const legacy = (point as unknown as Record<string, unknown>)[channel.key]
      return sum + (typeof dynamic === 'number' ? dynamic : typeof legacy === 'number' ? legacy : 0)
    }, 0)]))
    const ranked = [...availableChannels].sort((a, b) => (totals.get(b.key) ?? 0) - (totals.get(a.key) ?? 0))
    let comparisonDays = allDays
    let visible = ranked
    if (ranked.length > 4) {
      const otherKeys = ranked.slice(3).map((channel) => channel.key)
      comparisonDays = allDays.map((point) => ({
        ...point,
        channels: {
          ...(point.channels ?? {}),
          other_channels: otherKeys.reduce((sum, key) => sum + Number(point.channels?.[key] ?? 0), 0),
        },
      }))
      visible = [...ranked.slice(0, 3), { key: 'other_channels', label: 'Outros canais' }]
    }
    return visible.map((channel) => ({
      ...channel,
      comparison: buildChannelComparison(comparisonDays, period.days, compare.offsetDays, channel.key),
    }))
  }, [allDays, availableChannels, compare.offsetDays, period.days])
  const totalRevenue = rows.reduce((sum, row) => sum + row.comparison.currentTotal, 0)
  const selectedRow = rows.find((row) => row.key === selectedKey) ?? rows[0]

  if (loading) return <div className="overview-glass-elevated flex items-center gap-2 rounded-2xl p-4 text-xs text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando receita diária...</div>
  if (totalRevenue === 0 && allDays.length === 0) return null

  return (
    <section className="overview-glass-elevated motion-panel workspace-marketplace-chart relative rounded-2xl p-4 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Evolução de receita</h3>
          <p className="mt-0.5 text-[12px] text-text-secondary">{period.label} · Receita consolidada <strong className="font-mono text-text-primary">{compactMoney.format(totalRevenue)}</strong></p>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-border-subtle bg-bg-card p-1" aria-label="Comparar com">
          {compareOptions.map((option) => <button key={option.key} type="button" onClick={() => setCompareKey(option.key)} className={`motion-chip rounded-md px-2.5 py-1 text-[10.5px] font-semibold ${compareKey === option.key ? 'control-active' : 'control-inactive'}`} aria-pressed={compareKey === option.key}>{option.label}</button>)}
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4" aria-label="Selecionar canal">
        {rows.map((row) => <ChannelSelector key={row.key} label={row.label} comparison={row.comparison} selected={row.key === selectedRow?.key} onSelect={() => setSelectedKey(row.key)} />)}
      </div>

      {selectedRow && <FocusedPerformanceChart label={selectedRow.label} comparison={selectedRow.comparison} compareLabel={compare.label} />}
    </section>
  )
}

function ChannelSelector({ label, comparison, selected, onSelect }: { label: string; comparison: ChannelComparison; selected: boolean; onSelect: () => void }) {
  const color = getMarketplaceColor(label)
  const delta = comparison.deltaPct
  const positive = delta !== null && delta > 0.5
  const negative = delta !== null && delta < -0.5

  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={`rounded-xl border px-3.5 py-3 text-left transition-colors ${selected ? 'bg-bg-card-hover' : 'border-border-subtle bg-bg-card/60 hover:border-border-default hover:bg-bg-card'}`} style={selected ? { borderColor: `${color}80`, boxShadow: `inset 0 2px 0 ${color}` } : undefined}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 truncate text-[11px] font-semibold text-text-secondary"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />{label}</span>
        <span className={`inline-flex items-center gap-1 font-mono text-[10px] font-semibold ${positive ? 'text-accent-emerald' : negative ? 'text-accent-rose' : 'text-text-muted'}`}>{positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{delta === null ? 'Sem base' : `${delta >= 0 ? '+' : ''}${pct(delta)}%`}</span>
      </div>
      <p className="mt-2 font-mono text-base font-bold tracking-tight text-text-primary">{compactMoney.format(comparison.currentTotal)}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-text-muted">Receita no período</p>
    </button>
  )
}

function FocusedPerformanceChart({ label, comparison, compareLabel }: { label: string; comparison: ChannelComparison; compareLabel: string }) {
  const color = getMarketplaceColor(label)
  const chartData = comparison.slots.map((slot) => ({ label: slot.label, Atual: slot.current, Anterior: slot.previous }))
  const delta = comparison.deltaPct

  return (
    <div className="mt-4 rounded-xl border border-border-subtle bg-bg-card/40 px-3 py-3 sm:px-4 sm:py-4">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-[12px] font-semibold text-text-primary"><span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />{label}</p>
          <p className="mt-1 text-[10px] text-text-muted">Receita diária · comparação com {compareLabel.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-5 text-right">
          <div><p className="font-mono text-sm font-semibold text-text-primary">{compactMoney.format(comparison.currentTotal)}</p><p className="text-[8.5px] uppercase tracking-wider text-text-muted">Atual</p></div>
          <div><p className="font-mono text-sm text-text-secondary">{comparison.hasCompletePreviousRange ? compactMoney.format(comparison.previousTotal) : '—'}</p><p className="text-[8.5px] uppercase tracking-wider text-text-muted">Anterior</p></div>
          <div><p className={`font-mono text-sm font-semibold ${delta !== null && delta > 0.5 ? 'text-accent-emerald' : delta !== null && delta < -0.5 ? 'text-accent-rose' : 'text-text-muted'}`}>{delta === null ? 'Sem base' : `${delta >= 0 ? '+' : ''}${pct(delta)}%`}</p><p className="text-[8.5px] uppercase tracking-wider text-text-muted">Variação</p></div>
        </div>
      </div>

      <div className="h-[240px] w-full" aria-label={`Evolução diária de receita de ${label}`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-border-subtle)" strokeDasharray="3 5" />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} dy={8} />
            <YAxis axisLine={false} tickLine={false} width={62} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} tickFormatter={(value: number) => `R$ ${axisMoney.format(value)}`} />
            <Tooltip formatter={(value, name) => [money.format(Number(value ?? 0)), name]} contentStyle={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border-default)', borderRadius: 10, boxShadow: '0 16px 40px rgba(0,0,0,.24)', fontSize: 11 }} labelStyle={{ color: 'var(--color-text-primary)', fontWeight: 600, marginBottom: 6 }} itemStyle={{ color: 'var(--color-text-secondary)', padding: '2px 0' }} />
            <Line type="monotone" dataKey="Anterior" stroke="var(--color-text-muted)" strokeWidth={1.5} strokeDasharray="5 5" dot={false} connectNulls />
            <Line type="monotone" dataKey="Atual" stroke={color} strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: color, stroke: 'var(--color-bg-elevated)', strokeWidth: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 flex items-center gap-4 border-t border-border-subtle pt-3 text-[9.5px] text-text-muted">
        <span className="inline-flex items-center gap-1.5"><span className="h-0.5 w-5 rounded-full" style={{ background: color }} />Período atual</span>
        <span className="inline-flex items-center gap-1.5"><span className="w-5 border-t border-dashed border-text-muted" />Período anterior</span>
      </div>
    </div>
  )
}
