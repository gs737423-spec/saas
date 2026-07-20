import { Users, CircleDollarSign, ShoppingCart, Activity, UserCheck, Layers, type LucideIcon } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import AnimatedMetric, { AnimatedMetricGroup } from '@/site/components/AnimatedMetric'
import { about, institutionalMetricsTitle } from '@/site/content'
import { siteMetrics } from '@/site/data/siteMetrics'

// Ordem fixa dos ícones — acompanha siteMetrics.ts (clientes, GMV, pedidos,
// disponibilidade, especialistas, marketplaces).
const metricIcons: LucideIcon[] = [Users, CircleDollarSign, ShoppingCart, Activity, UserCheck, Layers]

// "Quem Somos" (40%) + alcance (56%), grid editorial 3×2, sem cards.
// Números NÃO validados — ver src/site/data/siteMetrics.ts (verified:false).
export default function NumbersSection() {
  return (
    <section id="sobre" className="vt-light scroll-mt-24">
      <div className="site-container site-container--tight grid gap-14 py-14 md:py-16 lg:grid-cols-[40fr_56fr] lg:gap-24">
        <Reveal>
          <span className="mb-3 inline-block text-[13px] font-bold uppercase" style={{ color: '#1F4BD8', letterSpacing: '0.12em' }}>
            Quem somos
          </span>
          <h2 className="font-bold" style={{ color: '#17324d', fontSize: 'clamp(1.9rem, 3vw, 2.4rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {about.title}
          </h2>
          <div className="mt-5 space-y-4" style={{ maxWidth: '58ch' }}>
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-[16.5px]" style={{ color: '#48566b', lineHeight: 1.65 }}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mb-7 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: '#1F4BD8' }}>
            {institutionalMetricsTitle}
          </div>
          <AnimatedMetricGroup>
            {(inView) => (
              <div className="grid grid-cols-2 gap-x-8 gap-y-9 sm:grid-cols-3">
                {siteMetrics.map((m, i) => {
                  const Icon = metricIcons[i]
                  return (
                    <div key={m.label}>
                      <Icon className="h-[18px] w-[18px]" style={{ color: '#1F4BD8' }} strokeWidth={2.2} />
                      <div className="mt-2.5 whitespace-nowrap font-bold leading-none tracking-tight" style={{ color: '#17324d', fontSize: 'clamp(2.1rem, 2.9vw, 2.9rem)' }}>
                        <AnimatedMetric metric={m} run={inView} />
                      </div>
                      <span className="metric-underline" aria-hidden="true" data-run={inView} />
                      <div className="mt-2 text-[14px] font-semibold" style={{ color: '#5a6b7e', lineHeight: 1.35 }}>{m.label}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </AnimatedMetricGroup>
        </Reveal>
      </div>
    </section>
  )
}
