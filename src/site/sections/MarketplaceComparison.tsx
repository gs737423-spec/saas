import { Trophy, Percent, Receipt, AlertTriangle } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'

interface Row {
  name: string
  color: string
  faturamento: string
  pedidos: string
  ticket: string
  margem: string
  part: string
}

const rows: Row[] = [
  { name: 'Mercado Livre', color: '#F5C518', faturamento: 'R$ 119.500', pedidos: '892', ticket: 'R$ 133,90', margem: '33%', part: '42%' },
  { name: 'Shopee', color: '#EE4D2D', faturamento: 'R$ 62.600', pedidos: '634', ticket: 'R$ 98,70', margem: '38%', part: '22%' },
  { name: 'Loja Própria', color: '#4C82F7', faturamento: 'R$ 56.900', pedidos: '245', ticket: 'R$ 232,20', margem: '41%', part: '20%' },
  { name: 'Amazon', color: '#FF9900', faturamento: 'R$ 45.500', pedidos: '321', ticket: 'R$ 141,70', margem: '30%', part: '16%' },
]

const highlights = [
  { icon: Trophy, tone: '#4C82F7', label: 'Maior faturamento', value: 'Mercado Livre' },
  { icon: Percent, tone: '#12B981', label: 'Melhor margem', value: 'Loja Própria · 41%' },
  { icon: Receipt, tone: '#7C5CF6', label: 'Maior ticket médio', value: 'Loja Própria' },
  { icon: AlertTriangle, tone: '#E9A83A', label: 'Canal que merece atenção', value: 'Amazon · margem 30%' },
]

export default function MarketplaceComparison() {
  const cols: { key: keyof Row; label: string }[] = [
    { key: 'faturamento', label: 'Faturamento' },
    { key: 'pedidos', label: 'Pedidos' },
    { key: 'ticket', label: 'Ticket médio' },
    { key: 'margem', label: 'Margem' },
    { key: 'part', label: 'Participação' },
  ]
  return (
    <section id="comparacao" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader
          label="Comparação por canal"
          title="Descubra onde você vende mais — e onde realmente lucra."
          desc="Volume de vendas não é o único indicador de sucesso. Compare o desempenho financeiro de cada marketplace e identifique os canais mais eficientes."
        />

        <Reveal className="mt-12">
          {/* Tabela — scroll horizontal no mobile, sem overflow na página */}
          <div className="site-card overflow-hidden" style={{ borderRadius: 'var(--s-radius-card)' }}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left" style={{ minWidth: 640 }}>
                <thead>
                  <tr style={{ background: 'var(--s-bg-soft)' }}>
                    <th className="px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-muted)' }}>Canal</th>
                    {cols.map((c) => (
                      <th key={c.key} className="px-5 py-3.5 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-muted)' }}>{c.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.name} className="border-t" style={{ borderColor: 'var(--s-line)' }}>
                      <td className="px-5 py-4">
                        <span className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: r.color }} />
                          <span className="text-[14px] font-bold" style={{ color: 'var(--s-ink)' }}>{r.name}</span>
                        </span>
                      </td>
                      {cols.map((c) => (
                        <td key={c.key} className="px-5 py-4 text-[14px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>{r[c.key]}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Reveal>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 60}>
              <div className="site-card site-card-hover h-full p-5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: `${h.tone}18`, color: h.tone }}>
                  <h.icon className="h-[18px] w-[18px]" />
                </span>
                <div className="mt-3 text-[12px] font-semibold" style={{ color: 'var(--s-muted)' }}>{h.label}</div>
                <div className="mt-0.5 text-[15px] font-bold" style={{ color: 'var(--s-ink)' }}>{h.value}</div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
