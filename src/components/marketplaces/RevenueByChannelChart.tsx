import { useEffect, useMemo, useState } from 'react'
import { Loader2, Minus, TrendingDown, TrendingUp } from 'lucide-react'
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
const pct = (value: number) => value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

export default function RevenueByChannelChart() {
  const { period } = usePeriod()
  const [compareKey, setCompareKey] = useState<CompareKey>('week')
  const [allDays, setAllDays] = useState<ComparisonDailyPoint[]>([])
  const [availableChannels, setAvailableChannels] = useState<Array<{ key: string; label: string }>>(fallbackChannels)
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

  if (loading) return <div className="overview-glass-elevated flex items-center gap-2 rounded-2xl p-4 text-xs text-text-muted"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Carregando receita diária...</div>
  if (totalRevenue === 0 && allDays.length === 0) return null

  return (
    <section className="overview-glass-elevated motion-panel workspace-marketplace-chart relative rounded-2xl p-3.5 sm:p-4">
      <div className="mb-2.5 flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Performance diária por Marketplace</h3>
          <p className="mt-0.5 text-[12.5px] text-text-secondary">{period.label} · Total <strong className="font-mono text-text-primary">{compactMoney.format(totalRevenue)}</strong></p>
          <div className="mt-1.5 flex items-center gap-3 text-[9.5px] font-medium text-text-muted" aria-label="Legenda da comparação">
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-1.5 rounded-[2px] bg-text-primary" /> Período atual</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2 rounded-[2px] bg-border-strong" /> Período anterior</span>
            <span className="hidden sm:inline">Escala independente por marketplace</span>
          </div>
        </div>
        <div className="flex items-center gap-1 self-start rounded-lg border border-border-subtle bg-bg-card p-1" aria-label="Comparar com">
          {compareOptions.map((option) => <button key={option.key} type="button" onClick={() => setCompareKey(option.key)} className={`motion-chip rounded-md px-2.5 py-1 text-[10.5px] font-semibold ${compareKey === option.key ? 'control-active' : 'control-inactive'}`} aria-pressed={compareKey === option.key}>{option.label}</button>)}
        </div>
      </div>

      <div className="grid gap-1.5" aria-label="Comparação de desempenho diário">
        {rows.map((row) => <PerformanceLane key={row.key} label={row.label} comparison={row.comparison} compareLabel={compare.label} />)}
      </div>
    </section>
  )
}

function PerformanceLane({ label, comparison, compareLabel }: { label: string; comparison: ChannelComparison; compareLabel: string }) {
  const color = getMarketplaceColor(label)
  const max = Math.max(...comparison.slots.flatMap((slot) => [slot.current, slot.previous ?? 0]), 1)
  const delta = comparison.deltaPct
  const positive = delta !== null && delta > 0.5
  const negative = delta !== null && delta < -0.5
  return (
    <div className="grid grid-cols-[94px_minmax(0,1fr)] items-center gap-x-2 rounded-lg border border-border-subtle bg-bg-card px-2.5 py-2 sm:grid-cols-[108px_minmax(0,1fr)_126px] sm:gap-x-3">
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 truncate text-[11.5px] font-semibold text-text-primary"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />{label}</p>
        <p className="mt-0.5 truncate font-mono text-[11.5px] font-bold text-text-primary">{compactMoney.format(comparison.currentTotal)}</p>
      </div>

      <div className="flex h-[58px] min-w-0 items-end gap-[2px]" aria-label={`Receita atual e anterior de ${label}`}>
        {comparison.slots.map((slot) => {
          const slotDelta = slot.previous === null ? null : safeDeltaPct(slot.current, slot.previous)
          const accessibleDelta = slotDelta === null ? 'sem base percentual' : `${slotDelta >= 0 ? 'mais' : 'menos'} ${pct(Math.abs(slotDelta))} por cento`
          return (
            <button
              key={slot.key}
              type="button"
              className="group relative h-full min-w-[4px] flex-1 cursor-default focus:outline-none"
              aria-label={`${slot.currentDateLabel}. Atual ${money.format(slot.current)}. Anterior ${slot.previous === null ? 'indisponível' : money.format(slot.previous)}. ${accessibleDelta}.`}
            >
              <span className="absolute bottom-[11px] left-0 right-0 h-px bg-border-subtle" />
              {slot.previous !== null && <span className="absolute bottom-3 left-0 w-full rounded-t-[3px] bg-border-strong transition-[height,opacity] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" style={{ height: slot.previous === 0 ? '2px' : `${Math.max(5, (slot.previous / max) * 78)}%`, opacity: 0.58 }} />}
              <span className="absolute bottom-3 left-[14%] w-[72%] rounded-t-[2px] transition-[height,opacity] duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none" style={{ height: slot.current === 0 ? '2px' : `${Math.max(5, (slot.current / max) * 78)}%`, background: color, opacity: 0.88 }} />
              <span className="pointer-events-none absolute bottom-[calc(100%+8px)] left-1/2 z-50 hidden w-44 -translate-x-1/2 rounded-lg border border-border-default bg-bg-elevated p-2.5 text-left shadow-2xl group-hover:block group-focus-visible:block">
                <strong className="block text-[10.5px] font-semibold text-text-primary">{slot.currentDateLabel}</strong>
                <span className="mt-1.5 flex justify-between gap-3 text-[10px] text-text-secondary"><span>Atual</span><b className="font-mono text-text-primary">{money.format(slot.current)}</b></span>
                <span className="mt-1 flex justify-between gap-3 text-[10px] text-text-secondary"><span>Anterior</span><b className="font-mono text-text-primary">{slot.previous === null ? '—' : money.format(slot.previous)}</b></span>
                <span className="mt-1 flex justify-between gap-3 text-[10px] text-text-secondary"><span>Variação</span><b className={`font-mono ${slotDelta !== null && slotDelta > 0 ? 'text-accent-emerald' : slotDelta !== null && slotDelta < 0 ? 'text-accent-rose' : 'text-text-muted'}`}>{slotDelta === null ? 'Sem base' : `${slotDelta >= 0 ? '+' : ''}${pct(slotDelta)}%`}</b></span>
                <span className="mt-1.5 block text-[8.5px] text-text-muted">Referência: {slot.previousDateLabel}</span>
              </span>
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-medium text-text-muted">{slot.label}</span>
            </button>
          )
        })}
      </div>

      <div className="col-span-2 mt-3 flex items-center justify-between gap-2 border-t border-border-subtle pt-1.5 text-[9.5px] sm:col-span-1 sm:mt-0 sm:block sm:border-0 sm:pt-0 sm:text-right">
        <div><p className="font-mono text-[11px] font-semibold text-text-primary">{compactMoney.format(comparison.currentTotal)}</p><p className="text-[8.5px] uppercase tracking-wider text-text-muted">Atual</p></div>
        <div><p className="font-mono text-[10px] text-text-secondary">{comparison.hasCompletePreviousRange ? compactMoney.format(comparison.previousTotal) : '—'}</p><p className="text-[8.5px] text-text-muted">Anterior</p></div>
        <div><p className={`inline-flex items-center gap-1 font-mono text-[10.5px] font-semibold ${positive ? 'text-accent-emerald' : negative ? 'text-accent-rose' : 'text-text-muted'}`}>{positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}{delta === null ? 'Sem base' : `${delta >= 0 ? '+' : ''}${pct(delta)}%`}</p><p className="text-[8.5px] text-text-muted">vs. {compareLabel.toLowerCase()}</p></div>
      </div>
    </div>
  )
}
