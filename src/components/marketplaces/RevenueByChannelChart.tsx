import { useEffect, useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react'
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'
import { motionTokens, useReducedMotion } from '@/lib/motion'
import { apiFetchJson } from '@/lib/apiFetch'

// Entrance timing — dentro da janela 450-750ms do token de motion, sem
// bounce (Recharts só aceita easing nomeado aqui).
const CHART_ENTER_MS = motionTokens.duration.slow + 150

const channels: { key: 'mercadolivre' | 'shopee' | 'amazon' | 'lojapropria'; label: Marketplace }[] = [
  { key: 'mercadolivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojapropria', label: 'Loja Própria' },
]

type ChannelKey = typeof channels[number]['key']

interface DailyPoint {
  date: string
  label: string
  mercadolivre: number
  shopee: number
  amazon: number
  lojapropria: number
  total: number
}

interface DailyApiResponse {
  ok: boolean
  source: string
  days: DailyPoint[]
}

const compareOptions: { key: 'yesterday' | 'week' | 'month'; label: string; offsetDays: number }[] = [
  { key: 'yesterday', label: 'Ontem', offsetDays: 1 },
  { key: 'week', label: 'Semana passada', offsetDays: 7 },
  { key: 'month', label: 'Mês passado', offsetDays: 30 },
]

const brl = (v: number) => v.toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

interface TooltipPayloadItem {
  dataKey: string
  value: number
}

function CustomTooltip({ active, payload, label, activeChannels, compareLabel }: {
  active?: boolean
  payload?: TooltipPayloadItem[]
  label?: string
  activeChannels: typeof channels
  compareLabel: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1225]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label} · vs {compareLabel.toLowerCase()}</p>
      {activeChannels.map((c) => {
        const cur = payload.find((p) => p.dataKey === c.key)?.value
        const prev = payload.find((p) => p.dataKey === `prev_${c.key}`)?.value
        if (cur === undefined) return null
        const delta = prev && prev > 0 ? ((cur - prev) / prev) * 100 : 0
        const brand = getMarketplaceColor(c.label)
        return (
          <div key={c.key} className="border-t border-white/5 py-1 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-4 text-[11.5px]">
              <span className="flex items-center gap-2 text-text-secondary">
                <span className="h-2 w-2 rounded-full" style={{ background: brand, boxShadow: `0 0 6px ${brand}66` }} />
                {c.label}
              </span>
              <span className="font-mono font-semibold text-text-primary">R$ {brl(cur)}</span>
            </div>
            {prev !== undefined && (
              <div className="mt-0.5 flex items-center justify-between gap-4 pl-4 text-[10.5px] text-text-muted">
                <span>anterior: R$ {brl(prev)}</span>
                <span className={`font-mono font-semibold ${delta >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                  {delta >= 0 ? '+' : ''}{pct(delta)}%
                </span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/** Downsamples a fatia diária pra manter o gráfico legível em períodos longos. */
function resample(sliced: DailyPoint[], periodDays: number): DailyPoint[] {
  if (periodDays <= 15) return sliced
  const step = periodDays <= 30 ? 2 : periodDays <= 90 ? 3 : 7
  return sliced.filter((_, i) => i % step === 0 || i === sliced.length - 1)
}

/** Receita diária real por marketplace, com linha tracejada de comparação
 *  (ontem/semana passada/mês passado) — /api/dashboard/finance-daily (ou
 *  ilustrativo em Modo Demonstração, mesmo endpoint, ver apiFetch.ts). */
export default function RevenueByChannelChart() {
  const { period } = usePeriod()
  const reducedMotion = useReducedMotion()
  const chartDuration = reducedMotion ? 0 : CHART_ENTER_MS
  const [selected, setSelected] = useState<Set<ChannelKey>>(new Set(channels.map((c) => c.key)))
  const [compareKey, setCompareKey] = useState<'yesterday' | 'week' | 'month'>('week')
  const [allDays, setAllDays] = useState<DailyPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setCompareKey(period.days <= 1 ? 'yesterday' : period.days <= 10 ? 'week' : 'month')
  }, [period.key])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<DailyApiResponse>(`/api/dashboard/finance-daily?days=${period.days}`).then((res) => {
      if (!cancelled) {
        setAllDays(res?.days ?? [])
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [period.days])

  const dailyByDate = useMemo(() => new Map(allDays.map((d) => [d.date, d])), [allDays])

  const toggleChannel = (key: ChannelKey) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        if (next.size > 1) next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const periodDays = period.days
  const compareOffset = compareOptions.find((o) => o.key === compareKey)!.offsetDays
  const activeChannels = channels.filter((c) => selected.has(c.key))

  function shiftedDate(dateStr: string, offsetDays: number): DailyPoint | undefined {
    const d = new Date(dateStr)
    d.setDate(d.getDate() - offsetDays)
    return dailyByDate.get(d.toISOString().slice(0, 10))
  }

  const filteredData = useMemo(() => {
    const current = resample(allDays.slice(-periodDays), periodDays)
    return current.map((entry) => {
      const prevEntry = shiftedDate(entry.date, compareOffset)
      const row: Record<string, string | number | undefined> = { label: entry.label, date: entry.date }
      for (const c of channels) {
        row[c.key] = entry[c.key]
        row[`prev_${c.key}`] = prevEntry ? prevEntry[c.key] : undefined
      }
      return row
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDays, periodDays, compareOffset])

  const channelSummary = useMemo(() => {
    const periodData = allDays.slice(-periodDays)
    const previousData = allDays.slice(-periodDays * 2, -periodDays)
    const totalAll = periodData.reduce((s, d) => s + d.total, 0)
    return channels
      .map((c) => {
        const total = periodData.reduce((s, d) => s + d[c.key], 0)
        const prevTotal = previousData.reduce((s, d) => s + d[c.key], 0)
        const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0
        const share = totalAll > 0 ? (total / totalAll) * 100 : 0
        return { ...c, total, growth, share }
      })
      .sort((a, b) => b.total - a.total)
  }, [allDays, periodDays])

  const totalRevenue = channelSummary.reduce((s, c) => s + c.total, 0)
  const compareLabel = compareOptions.find((o) => o.key === compareKey)!.label

  if (loading) {
    return (
      <div className="overview-glass-elevated flex items-center gap-2 rounded-2xl p-4 text-xs text-text-muted">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        Carregando receita diária...
      </div>
    )
  }

  if (totalRevenue === 0) {
    return null
  }

  return (
    <div className="overview-glass-elevated motion-panel workspace-marketplace-chart relative overflow-hidden rounded-2xl p-3.5 sm:p-4">
      <div className="workspace-chart-heading relative mb-2.5">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Receita por Marketplace</h3>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          {period.label} · Total: <span className="font-mono font-semibold text-text-primary">R$ {brl(totalRevenue)}</span>
        </p>
        <p className="mt-1 text-[11.5px] text-text-secondary">
          Comparando com <span className="font-medium text-text-secondary">{compareLabel.toLowerCase()}</span> (linha tracejada)
        </p>
      </div>

      <div className="workspace-channel-cards relative mb-3.5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {channelSummary.map((c, idx) => {
          const brand = getMarketplaceColor(c.label)
          const positive = c.growth > 0.5
          const negative = c.growth < -0.5
          const isVisible = selected.has(c.key)
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => toggleChannel(c.key)}
              title="Clique para mostrar/ocultar este canal no gráfico"
              className={`group relative cursor-pointer overflow-hidden rounded-sm border text-left transition-colors duration-200 ${
                isVisible ? 'border-border-default bg-bg-card' : 'border-border-subtle bg-transparent'
              }`}
            >
              <div className="px-3.5 py-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: brand }} />
                    <span className="text-[11px] font-semibold text-text-secondary">{c.label}</span>
                  </div>
                  {idx === 0 && isVisible && (
                    <span className="rounded-full bg-accent-blue/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-accent-blue">Líder</span>
                  )}
                </div>
                <div className="mt-1.5 font-mono text-lg font-bold leading-none tracking-tight text-text-primary sm:text-xl">R$ {brl(c.total)}</div>
                <div className="mt-1.5 flex items-center justify-between">
                  <div className={`flex items-center gap-1 text-[11px] font-semibold ${positive ? 'text-accent-emerald' : negative ? 'text-accent-rose' : 'text-text-muted'}`}>
                    {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {positive ? '+' : ''}{pct(c.growth)}%
                  </div>
                  <span className="text-[10px] font-medium text-text-muted">{pct(c.share)}% do total</span>
                </div>
                <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-border-subtle">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${c.share}%`, background: brand }} />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="workspace-chart-plot h-44 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {channels.map((c) => {
                const color = getMarketplaceColor(c.label)
                return (
                  <linearGradient key={c.key} id={`fill-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                    <stop offset="50%" stopColor={color} stopOpacity={0.06} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                )
              })}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-chart-grid)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: 'var(--color-chart-axis)', fontSize: 10 }} axisLine={{ stroke: 'var(--color-border-subtle)' }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: 'var(--color-chart-axis)', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} width={40} />
            <Tooltip
              content={<CustomTooltip activeChannels={activeChannels} compareLabel={compareLabel} />}
              cursor={{ stroke: 'var(--color-border-default)', strokeDasharray: '4 4' }}
              wrapperStyle={{ outline: 'none' }}
              animationDuration={motionTokens.duration.ultrafast}
              animationEasing="ease-out"
            />
            {activeChannels.map((c) => {
              const color = getMarketplaceColor(c.label)
              return (
                <Line
                  key={`prev-${c.key}`}
                  type="monotone"
                  dataKey={`prev_${c.key}`}
                  name={`${c.label} · ${compareLabel}`}
                  stroke={color}
                  strokeWidth={1.75}
                  strokeOpacity={0.55}
                  strokeDasharray="5 4"
                  dot={false}
                  activeDot={{ r: 3, fill: color, stroke: 'var(--color-bg-card)', strokeWidth: 1.5, fillOpacity: 0.7 }}
                  animationDuration={chartDuration}
                  animationEasing="ease-out"
                />
              )
            })}
            {activeChannels.map((c) => {
              const color = getMarketplaceColor(c.label)
              return (
                <Area
                  key={c.key}
                  type="monotone"
                  dataKey={c.key}
                  name={c.label}
                  stroke={color}
                  strokeWidth={2.5}
                  fill={`url(#fill-${c.key})`}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-bg-card)', fill: color }}
                  animationDuration={chartDuration}
                  animationEasing="ease-out"
                />
              )
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="relative mt-2 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Comparar com</span>
          {compareOptions.map((o) => (
            <button
              key={o.key}
              type="button"
              onClick={() => setCompareKey(o.key)}
              className={`cursor-pointer rounded-sm border px-3 py-1.5 text-[11px] font-medium transition-colors duration-200 ${
                compareKey === o.key ? 'border-accent-blue/30 bg-accent-blue/10 text-accent-blue' : 'border-border-subtle bg-transparent text-text-muted hover:text-text-secondary'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
        <span className="text-[10px] text-text-muted">Clique nos cards acima para comparar mais de um canal ao mesmo tempo.</span>
      </div>
    </div>
  )
}
