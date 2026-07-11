import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { revenueData, getMarketplaceColor, type Marketplace } from '@/data/mockData'

const channels: { key: 'mercadoLivre' | 'shopee' | 'amazon' | 'lojaPropria'; label: Marketplace }[] = [
  { key: 'mercadoLivre', label: 'Mercado Livre' },
  { key: 'shopee', label: 'Shopee' },
  { key: 'amazon', label: 'Amazon' },
  { key: 'lojaPropria', label: 'Loja Própria' },
]

const brl = (v: number) => v.toLocaleString('pt-BR')
const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-border-subtle bg-bg-card px-3 py-2 shadow-xl">
      <p className="mb-1 text-[10px] font-semibold text-text-muted">{label}</p>
      {channels.map((c) => {
        const entry = payload.find((p: any) => p.dataKey === c.key)
        if (!entry) return null
        return (
          <div key={c.key} className="flex items-center justify-between gap-3 text-[11px]">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: getMarketplaceColor(c.label) }} />
              {c.label}
            </span>
            <span className="font-mono font-medium text-text-primary">R$ {brl(entry.value)}</span>
          </div>
        )
      })}
    </div>
  )
}

export default function RevenueByChannelChart() {
  const allMonths = revenueData.map((m) => m.month)
  const [fromIdx, setFromIdx] = useState(Math.max(0, allMonths.length - 6))
  const [toIdx, setToIdx] = useState(allMonths.length - 1)

  const months = useMemo(() => revenueData.slice(fromIdx, toIdx + 1), [fromIdx, toIdx])
  const totalRevenue = months.reduce((s, m) => s + m.total, 0)

  const channelSummary = useMemo(() => {
    return channels
      .map((c) => {
        const total = months.reduce((s, m) => s + m[c.key], 0)
        const first = months[0]?.[c.key] ?? 0
        const last = months[months.length - 1]?.[c.key] ?? 0
        const growth = first > 0 ? ((last - first) / first) * 100 : 0
        return { ...c, total, growth }
      })
      .sort((a, b) => b.total - a.total)
  }, [months])

  return (
    <div className="overview-glass-elevated relative overflow-hidden rounded-[22px] p-4 sm:p-5">
      <div className="relative mb-3.5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-text-primary">Receita por Canal</h3>
          <p className="mt-0.5 text-xs text-text-muted">Total do período: <span className="font-mono text-text-secondary">R$ {brl(totalRevenue)}</span></p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-lg border border-border-subtle bg-bg-primary/40 px-2.5 py-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">De</span>
          <select
            value={fromIdx}
            onChange={(e) => {
              const v = Number(e.target.value)
              setFromIdx(v)
              if (v > toIdx) setToIdx(v)
            }}
            className="cursor-pointer rounded-md border border-border-subtle bg-bg-card px-1.5 py-0.5 text-[11px] font-medium text-text-secondary"
          >
            {allMonths.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
          <span className="text-[10px] font-medium uppercase tracking-wider text-text-muted">até</span>
          <select
            value={toIdx}
            onChange={(e) => {
              const v = Number(e.target.value)
              setToIdx(v)
              if (v < fromIdx) setFromIdx(v)
            }}
            className="cursor-pointer rounded-md border border-border-subtle bg-bg-card px-1.5 py-0.5 text-[11px] font-medium text-text-secondary"
          >
            {allMonths.map((m, i) => (
              <option key={m} value={i}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Resposta imediata: quem lidera, quem cresce, quem cai */}
      <div className="relative mb-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {channelSummary.map((c) => {
          const brand = getMarketplaceColor(c.label)
          const positive = c.growth >= 0
          return (
            <div key={c.key} className="overview-glass relative overflow-hidden rounded-xl px-3 py-2.5">
              <div className="absolute inset-y-0 left-0 w-[3px]" style={{ background: brand }} />
              <div className="flex items-center gap-1.5 pl-1.5">
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                <span className="truncate text-[10.5px] font-medium text-text-secondary">{c.label}</span>
              </div>
              <div className="mt-1 pl-1.5 font-mono text-[15px] font-bold leading-none text-text-primary">R$ {brl(c.total)}</div>
              <div className={`mt-1 flex items-center gap-1 pl-1.5 text-[11px] font-semibold ${positive ? 'text-accent-emerald' : 'text-accent-rose'}`}>
                {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {positive ? '+' : ''}{pct(c.growth)}%
              </div>
            </div>
          )
        })}
      </div>

      <div className="h-52 sm:h-60">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={months} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
            <defs>
              {channels.map((c) => (
                <linearGradient key={c.key} id={`fill-${c.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={getMarketplaceColor(c.label)} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={getMarketplaceColor(c.label)} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="month" tick={{ fill: '#8593B8', fontSize: 10.5 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
            <YAxis
              tick={{ fill: '#8593B8', fontSize: 10.5 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${Math.round(v / 1000)}k`}
              width={36}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.18)', strokeDasharray: '3 3' }} />
            {channels.map((c) => (
              <Area
                key={c.key}
                type="monotone"
                dataKey={c.key}
                name={c.label}
                stroke={getMarketplaceColor(c.label)}
                strokeWidth={2}
                fill={`url(#fill-${c.key})`}
                dot={false}
                activeDot={{ r: 3.5, strokeWidth: 0 }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="relative mt-3 flex flex-wrap items-center gap-2">
        {channels.map((c) => (
          <span
            key={c.key}
            className="flex items-center gap-1.5 rounded-full border border-border-subtle bg-bg-card/40 px-2.5 py-1 text-[10.5px] font-medium text-text-secondary"
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: getMarketplaceColor(c.label) }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}
