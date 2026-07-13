import { useMemo, useState, useCallback, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'
import { TODAY } from '@/lib/periods'

const channels: { key: 'mercadoLivre' | 'shopee' | 'amazon' | 'lojaPropria'; label: Marketplace }[] = [
  { key: 'mercadoLivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojaPropria', label: 'Loja Própria' },
]

type ChannelKey = typeof channels[number]['key']

interface DailyData {
  date: string
  label: string
  mercadoLivre: number
  shopee: number
  amazon: number
  lojaPropria: number
  total: number
}

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateDailyData(totalDays: number): DailyData[] {
  const data: DailyData[] = []
  const baselines = { mercadoLivre: 2800, shopee: 1600, amazon: 900, lojaPropria: 550 }
  const growthPerDay = { mercadoLivre: 3.5, shopee: 4.2, amazon: 2.8, lojaPropria: 1.8 }

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(TODAY)
    d.setDate(d.getDate() - i)
    const dayOfWeek = d.getDay()
    const weekendFactor = dayOfWeek === 0 ? 0.7 : dayOfWeek === 6 ? 0.85 : 1
    const dayIndex = totalDays - i
    const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()

    const entry: any = {
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
    }

    let total = 0
    for (const c of channels) {
      const base = baselines[c.key]
      const growth = growthPerDay[c.key] * dayIndex
      const variation = (seededRandom(seed + c.key.length) - 0.5) * base * 0.3
      const value = Math.round((base + growth + variation) * weekendFactor)
      entry[c.key] = Math.max(0, value)
      total += entry[c.key]
    }
    entry.total = total
    data.push(entry)
  }
  return data
}

// 400 days of history so any period plus its "previous window" comparison
// (up to 2x the selected range) always has data behind it.
const allDailyData = generateDailyData(400)
const dailyByDate = new Map(allDailyData.map((d) => [d.date, d]))

const compareOptions: { key: 'yesterday' | 'week' | 'month'; label: string; offsetDays: number }[] = [
  { key: 'yesterday', label: 'Ontem', offsetDays: 1 },
  { key: 'week', label: 'Semana passada', offsetDays: 7 },
  { key: 'month', label: 'Mês passado', offsetDays: 30 },
]

const brl = (v: number) => v.toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

/** Downsamples a daily slice so the chart stays readable on longer ranges. */
function resample(sliced: DailyData[], periodDays: number): DailyData[] {
  if (periodDays <= 15) return sliced
  const step = periodDays <= 30 ? 2 : periodDays <= 90 ? 3 : 7
  return sliced.filter((_, i) => i % step === 0 || i === sliced.length - 1)
}

function CustomTooltip({ active, payload, label, seriesLabel, compareLabel }: any) {
  if (!active || !payload?.length) return null
  const total = payload.find((p: any) => p.dataKey === 'total')?.value ?? 0
  const prev = payload.find((p: any) => p.dataKey === 'prevTotal')?.value
  const delta = prev > 0 ? ((total - prev) / prev) * 100 : 0
  return (
    <div className="rounded-xl border border-white/10 bg-[#0d1225]/95 px-4 py-3 shadow-2xl backdrop-blur-md">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">{label} · {seriesLabel}</p>
      <div className="flex items-center justify-between gap-4 py-0.5 text-[11.5px]">
        <span className="flex items-center gap-2 text-text-secondary">
          <span className="h-2 w-2 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 6px #4C82F766' }} />
          Hoje
        </span>
        <span className="font-mono font-semibold text-text-primary">R$ {brl(total)}</span>
      </div>
      {prev !== undefined && (
        <>
          <div className="flex items-center justify-between gap-4 py-0.5 text-[11.5px]">
            <span className="flex items-center gap-2 text-text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ background: '#6B7A9E' }} />
              {compareLabel}
            </span>
            <span className="font-mono text-text-secondary">R$ {brl(prev)}</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-white/10 pt-1.5 text-[11px]">
            <span className="font-medium text-text-muted">Variação</span>
            <span className={`font-mono text-[11px] font-semibold ${delta >= 0 ? 'text-accent-emerald' : 'text-accent-rose'}`}>
              {delta >= 0 ? '+' : ''}{pct(delta)}%
            </span>
          </div>
        </>
      )}
    </div>
  )
}

type ViewKey = 'total' | ChannelKey

export default function RevenueByChannelChart() {
  const { period } = usePeriod()
  // Which series feeds the "Hoje" line: sum of all channels, or a single one.
  const [viewChannel, setViewChannel] = useState<ViewKey>('total')
  // Offset (in days) used to look up the comparison line's values.
  const [compareKey, setCompareKey] = useState<'yesterday' | 'week' | 'month'>('week')

  // Keep "Comparar com" in sync with the topbar period so the two filters
  // never disagree: 1 day -> ontem, up to ~10 days -> semana passada,
  // longer ranges -> mês passado. User can still override manually; the
  // default just re-syncs whenever the topbar period itself changes.
  useEffect(() => {
    setCompareKey(period.days <= 1 ? 'yesterday' : period.days <= 10 ? 'week' : 'month')
  }, [period.key])

  const periodDays = period.days
  const compareOffset = compareOptions.find((o) => o.key === compareKey)!.offsetDays

  const valueFor = useCallback(
    (d: DailyData) => (viewChannel === 'total' ? d.total : (d as any)[viewChannel]),
    [viewChannel]
  )

  function shiftedDate(dateStr: string, offsetDays: number): DailyData | undefined {
    const d = new Date(dateStr)
    d.setDate(d.getDate() - offsetDays)
    return dailyByDate.get(d.toISOString().split('T')[0])
  }

  const filteredData = useMemo(() => {
    const current = resample(allDailyData.slice(-periodDays), periodDays)
    return current.map((entry) => {
      const prevEntry = shiftedDate(entry.date, compareOffset)
      return {
        ...entry,
        total: valueFor(entry),
        prevTotal: prevEntry ? valueFor(prevEntry) : undefined,
      }
    })
  }, [periodDays, valueFor, compareOffset])

  const channelSummary = useMemo(() => {
    const periodData = allDailyData.slice(-periodDays)
    const previousData = allDailyData.slice(-periodDays * 2, -periodDays)
    const totalAll = periodData.reduce((s, d) => s + d.total, 0)
    return channels
      .map((c) => {
        const total = periodData.reduce((s, d) => s + (d as any)[c.key], 0)
        const prevTotal = previousData.reduce((s, d) => s + (d as any)[c.key], 0)
        const growth = prevTotal > 0 ? ((total - prevTotal) / prevTotal) * 100 : 0
        const share = totalAll > 0 ? (total / totalAll) * 100 : 0
        return { ...c, total, growth, share }
      })
      .sort((a, b) => b.total - a.total)
  }, [periodDays])

  const totalRevenue = channelSummary.reduce((s, c) => s + c.total, 0)
  const seriesLabel = viewChannel === 'total' ? 'Todos os canais' : channels.find((c) => c.key === viewChannel)!.label
  const compareLabel = compareOptions.find((o) => o.key === compareKey)!.label

  return (
    <div className="overview-glass-elevated relative overflow-hidden rounded-[22px] p-4 sm:p-5">
      {/* Header */}
      <div className="relative mb-4">
        <h3 className="text-base font-semibold tracking-tight text-text-primary">Receita por Canal</h3>
        <p className="mt-0.5 text-xs text-text-muted">
          {period.label} · Total: <span className="font-mono font-semibold text-text-secondary">R$ {brl(totalRevenue)}</span>
        </p>
        <p className="mt-1 text-[11px] text-text-muted">
          Gráfico: <span className="font-medium text-text-secondary">{seriesLabel}</span> vs <span className="font-medium text-text-secondary">{compareLabel.toLowerCase()}</span>
        </p>
      </div>

      {/* Channel cards */}
      <div className="relative mb-5 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {channelSummary.map((c, idx) => {
          const brand = getMarketplaceColor(c.label)
          const positive = c.growth > 0.5
          const negative = c.growth < -0.5
          const isVisible = viewChannel === c.key
          return (
            <button
              key={c.key}
              onClick={() => setViewChannel((v) => (v === c.key ? 'total' : c.key))}
              title="Clique para ver este canal isolado no gráfico"
              className={`group relative cursor-pointer overflow-hidden rounded-2xl border text-left transition-all duration-300 ${
                isVisible
                  ? 'border-white/[0.08] bg-white/[0.03]'
                  : 'border-white/[0.04] bg-white/[0.01] opacity-50'
              }`}
              style={{
                boxShadow: isVisible ? `0 4px 24px -4px ${brand}15, inset 0 1px 0 ${brand}10` : 'none',
              }}
            >
              {/* Top glow line */}
              <div
                className="absolute inset-x-0 top-0 h-[2px] transition-opacity duration-300"
                style={{
                  background: `linear-gradient(90deg, transparent, ${brand}, transparent)`,
                  opacity: isVisible ? 0.8 : 0.2,
                }}
              />

              <div className="px-3.5 py-3">
                {/* Channel name + rank */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full transition-all duration-300"
                      style={{
                        background: brand,
                        boxShadow: isVisible ? `0 0 8px ${brand}88` : 'none',
                      }}
                    />
                    <span className="text-[11px] font-semibold text-text-secondary">{c.label}</span>
                  </div>
                  {idx === 0 && isVisible && (
                    <span className="rounded-full bg-accent-blue/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-accent-blue">
                      Líder
                    </span>
                  )}
                </div>

                {/* Value */}
                <div className="mt-2 font-mono text-lg font-bold leading-none tracking-tight text-text-primary sm:text-xl">
                  R$ {brl(c.total)}
                </div>

                {/* Growth + Share row */}
                <div className="mt-2 flex items-center justify-between">
                  <div className={`flex items-center gap-1 text-[11px] font-semibold ${
                    positive ? 'text-accent-emerald' : negative ? 'text-accent-rose' : 'text-text-muted'
                  }`}>
                    {positive ? <TrendingUp className="h-3 w-3" /> : negative ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                    {positive ? '+' : ''}{pct(c.growth)}%
                  </div>
                  <span className="text-[10px] font-medium text-text-muted">{pct(c.share)}% do total</span>
                </div>

                {/* Share bar */}
                <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${c.share}%`,
                      background: `linear-gradient(90deg, ${brand}, ${brand}88)`,
                      boxShadow: `0 0 8px ${brand}44`,
                    }}
                  />
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={filteredData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="fill-total" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4C82F7" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#4C82F7" stopOpacity={0.08} />
                <stop offset="100%" stopColor="#4C82F7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#6B7A9E', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#6B7A9E', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
              width={40}
            />
            <Tooltip content={<CustomTooltip seriesLabel={seriesLabel} compareLabel={compareLabel} />} cursor={{ stroke: 'rgba(255,255,255,0.12)', strokeDasharray: '4 4' }} />
            <Line
              type="monotone"
              dataKey="prevTotal"
              name={compareLabel}
              stroke="#6B7A9E"
              strokeWidth={1.5}
              strokeOpacity={0.7}
              strokeDasharray="3 3"
              dot={false}
              activeDot={{ r: 3, fill: '#6B7A9E', stroke: '#0d1225', strokeWidth: 1.5 }}
              animationDuration={600}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Hoje"
              stroke="#4C82F7"
              strokeWidth={2.5}
              fill="url(#fill-total)"
              dot={false}
              activeDot={{
                r: 4,
                strokeWidth: 2,
                stroke: '#0d1225',
                fill: '#4C82F7',
                style: { filter: 'drop-shadow(0 0 4px #4C82F788)' },
              }}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* View + compare controls */}
      <div className="relative mt-3 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Ver</span>
          <button
            onClick={() => setViewChannel('total')}
            className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${
              viewChannel === 'total'
                ? 'border-accent-blue/40 bg-accent-blue/15 text-accent-blue'
                : 'border-white/10 bg-white/[0.04] text-text-secondary hover:bg-white/[0.08]'
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-accent-blue" style={{ boxShadow: '0 0 6px #4C82F766' }} />
            Todos (soma)
          </button>
          {channels.map((c) => {
            const active = viewChannel === c.key
            return (
              <button
                key={c.key}
                onClick={() => setViewChannel(c.key)}
                className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                  active
                    ? 'border-white/20 bg-white/[0.08] text-text-primary'
                    : 'border-white/5 bg-transparent text-text-muted hover:opacity-80'
                }`}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: getMarketplaceColor(c.label), boxShadow: active ? `0 0 6px ${getMarketplaceColor(c.label)}66` : 'none' }} />
                {c.label}
              </button>
            )
          })}
        </div>

        <span className="hidden h-4 w-px bg-white/10 sm:block" />

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">Comparar com</span>
          {compareOptions.map((o) => (
            <button
              key={o.key}
              onClick={() => setCompareKey(o.key)}
              className={`cursor-pointer rounded-full border px-3 py-1.5 text-[11px] font-medium transition-all duration-200 ${
                compareKey === o.key
                  ? 'border-white/20 bg-white/[0.08] text-text-primary'
                  : 'border-white/5 bg-transparent text-text-muted hover:opacity-80'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
