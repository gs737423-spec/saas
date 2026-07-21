import { Users, CircleDollarSign, ShoppingCart, Activity, UserCheck, Layers, type LucideIcon } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import AnimatedMetric, { AnimatedMetricGroup } from '@/site/components/AnimatedMetric'
import { about, institutionalMetricsTitle } from '@/site/content'
import { siteMetrics } from '@/site/data/siteMetrics'

// Ordem fixa dos ícones — acompanha siteMetrics.ts (clientes, GMV, pedidos,
// disponibilidade, especialistas, marketplaces).
const metricIcons: LucideIcon[] = [Users, CircleDollarSign, ShoppingCart, Activity, UserCheck, Layers]

// "Quem Somos" (40%) + métricas (56%), fundo canvas. Número grande → linha de
// acento → ícone GRANDE abaixo + label (não card, leitura editorial).
// Números NÃO validados — ver src/site/data/siteMetrics.ts (verified:false).
export default function NumbersSection() {
  return (
    <section id="sobre" className="vt-light scroll-mt-24">
      <div className="site-container site-container--tight grid gap-14 py-14 md:py-16 lg:grid-cols-[40fr_56fr] lg:gap-24">
        <Reveal>
          <span className="mb-3 inline-block text-[13px] font-bold uppercase" style={{ color: 'var(--vintec-blue-700)', letterSpacing: '0.12em' }}>
            {about.label}
          </span>
          <h2 className="font-bold" style={{ color: 'var(--vintec-text)', fontSize: 'clamp(1.9rem, 3vw, 2.4rem)', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {about.title}
          </h2>
          <div className="mt-5 space-y-4" style={{ maxWidth: '58ch' }}>
            {about.paragraphs.map((p) => (
              <p key={p.slice(0, 24)} className="text-[16.5px]" style={{ color: 'var(--vintec-text-soft)', lineHeight: 1.65 }}>{p}</p>
            ))}
          </div>
        </Reveal>

        <Reveal delay={80}>
          <div className="mb-7 text-[13px] font-bold uppercase tracking-[0.14em]" style={{ color: 'var(--vintec-blue-700)' }}>
            {institutionalMetricsTitle}
          </div>
          <AnimatedMetricGroup>
            {(inView) => (
              <div className="grid grid-cols-2 gap-x-7 gap-y-8 sm:grid-cols-3">
                {siteMetrics.map((m, i) => {
                  const Icon = metricIcons[i]
                  return (
                    <div key={m.label} className="metric-item">
                      <div className="metric-item__value">
                        <AnimatedMetric metric={m} run={inView} />
                      </div>
                      <span className="metric-item__line" aria-hidden="true" data-run={inView} />
                      <div className="metric-item__row">
                        <Icon className="metric-item__icon" strokeWidth={2} />
                        <span className="metric-item__label">{m.label}</span>
                      </div>
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
