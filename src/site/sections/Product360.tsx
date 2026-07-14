import { BarChart3, ShoppingCart, Receipt, Percent, TrendingUp, Boxes, PieChart, LineChart } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import BrowserFrame from '@/site/components/BrowserFrame'

const highlights = [
  { icon: BarChart3, label: 'Faturamento', tone: '#4C82F7' },
  { icon: ShoppingCart, label: 'Pedidos', tone: '#7C5CF6' },
  { icon: Receipt, label: 'Ticket médio', tone: '#12B981' },
  { icon: Percent, label: 'Margem', tone: '#12B981' },
  { icon: TrendingUp, label: 'Tendência', tone: '#4C82F7' },
  { icon: Boxes, label: 'Estoque', tone: '#E9A83A' },
  { icon: PieChart, label: 'Participação por canal', tone: '#7C5CF6' },
  { icon: LineChart, label: 'Evolução por período', tone: '#4C82F7' },
]

export default function Product360() {
  return (
    <section id="produto-360" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader
          label="Produto 360"
          title="Do desempenho geral aos detalhes de cada item."
          desc="Entenda como cada produto se comporta ao longo do tempo e nos diferentes canais da operação."
          align="center"
        />

        <Reveal className="mt-12">
          <div className="relative mx-auto max-w-4xl">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -inset-6 -z-10"
              style={{ background: 'radial-gradient(600px 260px at 50% 0%, rgba(76,130,247,0.14), transparent 65%)' }}
            />
            <BrowserFrame
              src="/site/product-360.webp"
              alt="Tela Produto 360 com histórico individual, tendência e participação por canal"
              caption="Produto 360 — histórico individual, tendência e participação por canal"
            />
          </div>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {highlights.map((h, i) => (
            <Reveal key={h.label} delay={i * 45}>
              <div className="site-card site-card-hover flex items-center gap-2.5 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${h.tone}18`, color: h.tone }}>
                  <h.icon className="h-4 w-4" />
                </span>
                <span className="text-[13px] font-semibold" style={{ color: 'var(--s-ink-soft)' }}>{h.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
