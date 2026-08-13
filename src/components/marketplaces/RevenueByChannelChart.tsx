import { useEffect, useMemo, useState } from 'react'
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'

const channels: { key: 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria'; label: Marketplace }[] = [
  { key: 'mercadolivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojapropria', label: 'Loja Própria' },
]

interface DailyPoint {
  date: string
  label: string
  mercadolivre: number
  shopee: number
  amazon: number
  lojapropria: number
  total: number
}

interface DailyApiResponse { ok: boolean; source: string; days: DailyPoint[] }

const compareOptions = [
  { key: 'yesterday' as const, label: 'Ontem', offsetDays: 1 },
  { key: 'week' as const, label: 'Semana passada', offsetDays: 7 },
  { key: 'month' as const, label: 'Mês passado', offsetDays: 30 },
]

const brl = (value: number) => value.toLocaleString('pt-BR')
const pct = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function resample(points: DailyPoint[], periodDays: number): DailyPoint[] {
  if (periodDays <= 15) return points
  const step = periodDays <= 30 ? 2 : periodDays <= 90 ? 3 : 7
  return points.filter((_, index) => index % step === 0 || index === points.length - 1)
}

export default function RevenueByChannelChart() {
  const { period } = usePeriod()
  const [compareKey, setCompareKey] = useState<'yesterday' | 'week' | 'month'>('week')
  const [allDays, setAllDays] = useState<DailyPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCompareKey(period.days <= 1 ? 'yesterday' : period.days <= 10 ? 'week' : 'month')
  }, [period.days])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<DailyApiResponse>(`/api/dashboard/finance-daily?days=${period.days}`).then((response) => {
      if (!cancelled) {
        setAllDays(response?.days ?? [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [period.days])

  const compare = compareOptions.find((option) => option.key === compareKey) ?? compareOptions[1]
  const dailyByDate = useMemo(() => new Map(allDays.map((point) => [point.date, point])), [allDays])
  const currentPoints = useMemo(() => resample(allDays.slice(-period.days), period.days), [allDays, period.days])

  const rows = useMemo(() => channels.map((channel) => {
    const total = currentPoints.reduce((sum, point) => sum + point[channel.key], 0)
    const previousTotal = currentPoints.reduce((sum, point) => {
      const shifted = new Date(`${point.date}T12:00:00`)
      shifted.setDate(shifted.getDate() - compare.offsetDays)
      return sum + (dailyByDate.get(shifted.toISOString().slice(0, 10))?.[channel.key] ?? 0)
    }, 0)
    const delta = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null
    return { ...channel, total, delta, values: currentPoints.map((point) => ({ date: point.label, value: point[channel.key] })) }
  }), [compare.offsetDays, currentPoints, dailyByDate])

  const totalRevenue = rows.reduce((sum, row) => sum + row.total, 0)

  if (loading) return <div className="overview-glass-elevated flex items-center gap-2 rounded-2xl p-4 text-xs text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando receita diária...</div>
  if (totalRevenue === 0) return null

  return (
    <section className="overview-glass-elevated motion-panel workspace-marketplace-chart relative rounded-2xl p-3.5 sm:p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Performance diária por Marketplace</h3>
          <p className="mt-0.5 text-[12.5px] text-text-secondary">{period.label} · Total <strong className="font-mono text-text-primary">R$ {brl(totalRevenue)}</strong></p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border-subtle bg-bg-card p-1" aria-label="Comparar com">
          {compareOptions.map((option) => <button key={option.key} type="button" onClick={() => setCompareKey(option.key)} className={`motion-chip rounded-md px-2.5 py-1 text-[10.5px] font-semibold ${compareKey === option.key ? 'control-active' : 'control-inactive'}`} aria-pressed={compareKey === option.key}>{option.label}</button>)}
        </div>
      </div>

      <div className="grid gap-2" aria-label="Matriz de desempenho diário">
        {rows.map((row) => <PerformanceLane key={row.key} row={row} compareLabel={compare.label} />)}
      </div>
    </section>
  )
}

function PerformanceLane({ row, compareLabel }: { row: { key: string; label: Marketplace; total: number; delta: number | null; values: { date: string; value: number }[] }; compareLabel: string }) {
  const color = getMarketplaceColor(row.label)
  const max = Math.max(...row.values.map((point) => point.value), 1)
  const positive = row.delta !== null && row.delta > 0.5
  const negative = row.delta !== null && row.delta < -0.5
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)_112px] items-center gap-3 rounded-lg border border-border-subtle bg-bg-card px-3 py-2.5">
      <div className="min-w-0"><p className="flex items-center gap-2 truncate text-[12px] font-semibold text-text-primary"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />{row.label}</p><p className="mt-1 font-mono text-[12px] font-bold text-text-primary">R$ {brl(row.total)}</p></div>
      <div className="flex h-12 min-w-0 items-end gap-[3px] border-b border-border-subtle px-1" aria-label={`Receita diária de ${row.label}`}>
        {row.values.map((point, index) => <span key={`${point.date}-${index}`} className="min-w-[3px] flex-1 rounded-t-[2px]" style={{ height: `${Math.max(8, (point.value / max) * 100)}%`, background: color, opacity: point.value > 0 ? 0.82 : 0.16 }} title={`${point.date}: R$ ${brl(point.value)}`} />)}
      </div>
      <div className="text-right"><p className={`inline-flex items-center gap-1 text-[11px] font-semibold ${positive ? 'text-accent-emerald' : negative ? 'text-accent-rose' : 'text-text-muted'}`}>{positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{row.delta === null ? 'Sem base' : `${row.delta >= 0 ? '+' : ''}${pct(row.delta)}%`}</p><p className="mt-1 text-[9.5px] text-text-muted">vs. {compareLabel.toLowerCase()}</p></div>
    </div>
  )
}
