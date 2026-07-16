import Reveal from '@/site/components/Reveal'
import { about, numbers } from '@/site/content'

// "Quem é a Vintec" + números — só indicadores estruturais reais (ver
// content.tsx), nunca métricas de clientes/faturamento inventadas.
export default function NumbersSection() {
  return (
    <section id="sobre" style={{ background: 'var(--s-bg)' }} className="scroll-mt-24">
      <div className="site-container py-8 md:py-11">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <Reveal>
            <span className="site-label mb-3">{about.label}</span>
            <h2 className="site-h2" style={{ color: 'var(--s-ink)' }}>{about.title}</h2>
            <p className="site-lead mt-4">{about.text}</p>
          </Reveal>

          <Reveal delay={80} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {numbers.map((n) => (
              <div key={n.label} className="site-card p-5">
                <div className="text-[2.4rem] font-extrabold leading-none tracking-tight" style={{ color: 'var(--s-teal)' }}>{n.value}</div>
                <div className="mt-2 text-[14px] font-bold" style={{ color: 'var(--s-ink)' }}>{n.label}</div>
                <div className="mt-1 text-[12.5px]" style={{ color: 'var(--s-muted)' }}>{n.desc}</div>
              </div>
            ))}
          </Reveal>
        </div>
      </div>
    </section>
  )
}
