import { Stethoscope } from 'lucide-react'
import { channelOverview, getMarketplaceColor } from '@/data/mockData'

const pct = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const brl = (v: number) => v.toLocaleString('pt-BR')
const brl2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface DiagnosticLine {
  text: string
  tone: 'neutral' | 'positive' | 'warning' | 'danger'
}

function buildDiagnostic(): DiagnosticLine[] {
  const byNet = [...channelOverview].sort((a, b) => b.netRevenue - a.netRevenue)
  const leader = byNet[0]
  const bestTicket = [...channelOverview].sort((a, b) => b.avgTicket - a.avgTicket)[0]
  const bestEfficiency = [...channelOverview].sort((a, b) => b.netEfficiencyPct - a.netEfficiencyPct)[0]
  const highestFee = [...channelOverview].sort((a, b) => b.feePct - a.feePct)[0]
  const growing = [...channelOverview].sort((a, b) => b.trend - a.trend)[0]
  const falling = [...channelOverview].filter((m) => m.trend < 0).sort((a, b) => a.trend - b.trend)[0]

  const lines: DiagnosticLine[] = []

  // Concentração
  lines.push({
    text: `${leader.marketplace} concentra ${pct(leader.netSharePct)}% do faturamento líquido estimado${leader.netSharePct > 45 ? ' — dependência alta de um único canal' : ''}.`,
    tone: leader.netSharePct > 45 ? 'warning' : 'neutral',
  })

  // Melhor ticket
  lines.push({
    text: `${bestTicket.marketplace} tem o melhor ticket médio (R$ ${brl2(bestTicket.avgTicket)}), mas apenas ${pct(bestTicket.sharePct)}% do volume — espaço para escalar.`,
    tone: 'neutral',
  })

  // Eficiência
  lines.push({
    text: `${bestEfficiency.marketplace} é o canal mais eficiente: ${pct(bestEfficiency.netEfficiencyPct)}% do bruto vira líquido (taxa de ${pct(bestEfficiency.feePct)}%).`,
    tone: 'positive',
  })

  // Taxas
  lines.push({
    text: `${highestFee.marketplace} tem o maior impacto de taxas: ${pct(highestFee.feePct)}% do bruto (R$ ${brl(highestFee.fees)} retidos no período).`,
    tone: 'warning',
  })

  // Crescimento
  if (growing.trend > 0) {
    lines.push({
      text: `${growing.marketplace} lidera crescimento com +${pct(growing.trend)}% no período — canal a priorizar.`,
      tone: 'positive',
    })
  }

  // Queda
  if (falling) {
    lines.push({
      text: `${falling.marketplace} caiu ${pct(Math.abs(falling.trend))}% — investigar mix de produtos e visibilidade.`,
      tone: 'danger',
    })
  }

  return lines
}

const toneDot: Record<string, string> = {
  neutral: '#4C82F7',
  positive: '#16C784',
  warning: '#F5C24B',
  danger: '#F4436C',
}

export default function ChannelDiagnostic() {
  const lines = buildDiagnostic()
  const leader = [...channelOverview].sort((a, b) => b.netRevenue - a.netRevenue)[0]
  const bestEfficiency = [...channelOverview].sort((a, b) => b.netEfficiencyPct - a.netEfficiencyPct)[0]
  const topVolume = [...channelOverview].sort((a, b) => b.orders - a.orders)[0]

  const highlights = [
    { label: 'Líder líquido', channel: leader.marketplace, value: `R$ ${brl(leader.netRevenue)}`, detail: `${pct(leader.netSharePct)}% share`, tone: '#16C784' },
    { label: 'Mais eficiente', channel: bestEfficiency.marketplace, value: `${pct(bestEfficiency.netEfficiencyPct)}%`, detail: `taxa ${pct(bestEfficiency.feePct)}%`, tone: '#22D3EE' },
    { label: 'Mais volume', channel: topVolume.marketplace, value: `${brl(topVolume.orders)} ped.`, detail: `ticket R$ ${brl2(topVolume.avgTicket)}`, tone: '#9061F9' },
  ]

  return (
    <div className="overview-glass-elevated flex h-full flex-col overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-violet/12" style={{ boxShadow: 'inset 0 0 0 1px rgba(144,97,249,0.25)' }}>
          <Stethoscope className="h-4 w-4 text-accent-violet" />
        </div>
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-text-primary">Diagnóstico Executivo</h3>
          <p className="text-[11px] text-text-muted">Leitura consultiva dos seus canais</p>
        </div>
      </div>

      <div className="space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <span className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: toneDot[l.tone], boxShadow: `0 0 7px ${toneDot[l.tone]}99` }} />
            <p className="text-[13px] leading-snug text-text-secondary">{l.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 border-t border-border-subtle pt-4">
        {highlights.map((h) => {
          const brand = getMarketplaceColor(h.channel as any)
          return (
            <div key={h.label} className="flex items-center justify-between gap-3 rounded-lg bg-bg-primary/30 px-3 py-2">
              <div className="min-w-0">
                <div className="text-[10px] font-medium uppercase tracking-wider text-text-muted">{h.label}</div>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: brand }} />
                  <span className="truncate text-[12px] font-semibold text-text-primary">{h.channel}</span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <div className="font-mono text-[13px] font-bold" style={{ color: h.tone }}>{h.value}</div>
                <div className="text-[9px] text-text-muted">{h.detail}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
