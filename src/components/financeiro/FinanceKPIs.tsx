import { DollarSign, RotateCcw, Wallet } from 'lucide-react'
import type { FinanceOverview } from '@/data/financeShapes'
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
      // Neutro/azul institucional, não semântico — faturamento bruto não é
      // "positivo" nem "negativo" por si, é o dado principal (spec: ícone
      // decorativo usa azul institucional, não uma cor por KPI).
      tone: '#356FE8',
    },
    {
      key: 'refunds',
      label: 'Estornos e Devoluções',
      raw: overview.refunds,
      format: (v) => `R$ ${brl(v)}`,
      context: 'Vendas canceladas ou devolvidas',
      icon: RotateCcw,
      tone: '#FF5E7D',
    },
    {
      key: 'net',
      label: 'Valor Líquido Estimado',
      raw: overview.netValue,
      format: (v) => `R$ ${brl(v)}`,
      context: 'Após deduções operacionais',
      icon: Wallet,
      tone: '#138A63',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div key={c.key} className="enterprise-kpi overview-glass overview-card-hover relative flex h-full flex-col overflow-hidden rounded-md">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">{c.label}</span>
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${c.tone}14`, boxShadow: `inset 0 0 0 1px ${c.tone}2b` }}>
                <Icon className="h-4 w-4" style={{ color: c.tone }} />
              </div>
            </div>
            <div className="mt-1.5 font-mono text-[24px] font-bold leading-none tracking-tight text-text-primary">
              <AnimatedNumber value={c.raw} format={c.format} />
            </div>
            <div className="mt-auto pt-1.5 text-[11px] text-text-muted">{c.context}</div>
          </div>
        )
      })}
    </div>
  )
}
