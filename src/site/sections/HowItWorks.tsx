import { Link2, Layers, LineChart, Target } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { howSteps } from '@/site/content'

const stepIcons = [Link2, Layers, LineChart, Target]

// Como funciona — 4 etapas, sempre API. Dark, com linha de conexão teal.
export default function HowItWorks() {
  return (
    <section id="como-funciona" className="sec-deep scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <SectionHeader
          tone="dark"
          label="Como funciona"
          title="Conectar, organizar, acompanhar, decidir."
          align="center"
        />

        <div className="relative mt-12">
          <div aria-hidden="true" className="absolute left-0 right-0 top-7 hidden lg:block"
            style={{ height: 2, background: 'linear-gradient(90deg, transparent, rgba(39, 93, 255,0.4) 12%, rgba(39, 93, 255,0.4) 88%, transparent)' }} />
          <ol className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
            {howSteps.map((s, i) => {
              const Icon = stepIcons[i]
              return (
                <Reveal as="li" key={s.n} delay={i * 90} className="relative flex flex-col items-center text-center lg:px-6">
                  <span className="vt-ico relative z-10" style={{ width: 56, height: 56, background: 'linear-gradient(180deg, #0C3B45, #082A34)' }}>
                    <Icon className="h-6 w-6" style={{ color: '#6EC8FF' }} />
                  </span>
                  <span className="mt-4 text-[12px] font-bold tracking-wider" style={{ color: '#6EC8FF' }}>ETAPA {s.n}</span>
                  <h3 className="mt-1 text-[18px] font-extrabold tracking-tight vt-ink">{s.title}</h3>
                  <p className="mt-2 max-w-xs text-[14px] vt-muted" style={{ lineHeight: 1.5 }}>{s.text}</p>
                </Reveal>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
