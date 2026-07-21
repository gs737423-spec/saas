import { DollarSign, Percent, RotateCcw, Wallet } from 'lucide-react'
import type { FinanceOverview } from '@/data/financeData'
import AnimatedNumber from '@/components/common/AnimatedNumber'

const brl = (v: number) => Math.round(v).toLocaleString('pt-BR')

interface CardDef {
  key: string
  label: string
  raw: number
  format: (v: number) => string
  context: string
  icon: typeof DollarSign
  tone: string
}

export default function FinanceKPIs({ overview }: { overview: FinanceOverview }) {
  const cards: CardDef[] = [
    {
      key: 'gross',
      label: 'Faturamento Bruto',
      raw: overview.grossRevenue,
      format: (v) => `R$ ${brl(v)}`,
      context: 'Total vendido no período',
      icon: DollarSign,
      tone: '#73C6FA',
    },
    {
      key: 'fees',
      label: 'Comissão',
      raw: overview.fees,
      format: (v) => `R$ ${brl(v)}`,
      context: 'Retido pelos canais de venda',
      icon: Percent,
      tone: '#F3B65D',
    },
    {
      key: 'refunds',
      label: 'Estornos e Devoluções',
      raw: overview.refunds,
      format: (v) => `R$ ${brl(v)}`,
      context: 'Vendas canceladas ou devolvidas',
      icon: RotateCcw,
      tone: '#F4436C',
    },
    {
      key: 'net',
      label: 'Valor Líquido Estimado',
      raw: overview.netValue,
      format: (v) => `R$ ${brl(v)}`,
      context: 'Bruto menos comissão e estornos',
      icon: Wallet,
      tone: '#16C784',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.key} className="overview-glass overview-card-hover relative flex h-full min-h-[128px] flex-col overflow-hidden rounded-2xl p-3.5">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${c.tone}66, transparent)` }} />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{c.label}</span>
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c.tone}16`, boxShadow: `inset 0 0 0 1px ${c.tone}33` }}>
                <Icon className="h-4 w-4" style={{ color: c.tone }} />
              </div>
            </div>
            <div className="mt-2.5 font-mono text-[26px] font-bold leading-none tracking-tight text-text-primary">
              <AnimatedNumber value={c.raw} format={c.format} />
            </div>
            <div className="mt-auto pt-2.5 text-xs text-text-muted">{c.context}</div>
          </div>
        )
      })}
    </div>
  )
}
