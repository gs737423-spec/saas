import { Users, CircleDollarSign, ShoppingCart, Activity, UserCheck, Layers, type LucideIcon } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { about, institutionalMetrics, institutionalMetricsTitle } from '@/site/content'

// Ícones pequenos (teal), mesmo estilo em todas as métricas.
const metricIcons: Record<string, LucideIcon> = {
  users: Users,
  gmv: CircleDollarSign,
  orders: ShoppingCart,
  uptime: Activity,
  team: UserCheck,
  channels: Layers,
}

// Segunda seção — estrutura editorial da Petina: "Quem Somos" à esquerda (42%),
// métricas institucionais à direita (58%) em grid 3×2. Fundo off-white, sem
// cards/bordas/sombras. Números provisórios (ver institutionalMetrics).
export default function NumbersSection() {
  return (
    <section id="sobre" className="vt-light scroll-mt-24">
      <div className="site-container site-container--tight grid gap-14 py-14 md:py-16 lg:grid-cols-[42fr_58fr] lg:gap-24">
        {/* Esquerda — Quem Somos */}
        <Reveal>
          <h2 className="font-bold" style={{ color: '#17324d', fontSize: 'clamp(1.9rem, 3vw, 2.4rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {about.title}
          </h2>
          <div className="mt-5 space-y-4">
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-[16.5px]" style={{ color: '#48566b', lineHeight: 1.55 }}>{p}</p>
            ))}
          </div>
        </Reveal>

        {/* Direita — métricas institucionais 3×2 */}
        <Reveal delay={80}>
          <div className="mb-7 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: '#0F8A7C' }}>
            {institutionalMetricsTitle}
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-8 sm:grid-cols-3">
            {institutionalMetrics.map((m) => {
              const Icon = metricIcons[m.icon]
              return (
                <div key={m.desc}>
                  <Icon className="h-[18px] w-[18px]" style={{ color: '#1FA98F' }} strokeWidth={2.2} />
                  <div className="mt-2.5 whitespace-nowrap font-bold leading-none tracking-tight" style={{ color: '#17324d', fontSize: 'clamp(2.1rem, 2.9vw, 2.9rem)' }}>{m.value}</div>
                  <div className="mt-2 text-[14px] font-semibold" style={{ color: '#5a6b7e', lineHeight: 1.35 }}>{m.desc}</div>
                </div>
              )
            })}
          </div>
        </Reveal>
      </div>
    </section>
  )
}
