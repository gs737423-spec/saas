import { Link2, Layers, LineChart } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { howSteps } from '@/site/content'

const stepIcons = [Link2, Layers, LineChart]

// Como funciona — só as 3 etapas. Integrações e segurança viraram uma
// seção própria (IntegrationsSecurity.tsx) para não repetir conteúdo.
export default function HowItWorks() {
  return (
    <section id="como-funciona" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-8 md:py-11">
        <SectionHeader
          label="Como funciona"
          title="Conectar, normalizar, decidir."
          align="center"
        />

        <div className="relative mt-10">
          <div aria-hidden="true" className="absolute left-0 right-0 top-7 hidden lg:block"
            style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--s-line-strong) 12%, var(--s-line-strong) 88%, transparent)' }} />
          <ol className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {howSteps.map((s, i) => {
              const Icon = stepIcons[i]
              return (
                <Reveal as="li" key={s.n} delay={i * 90} className="relative flex flex-col items-center text-center lg:px-6">
                  <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', color: 'var(--s-blue)', boxShadow: '0 10px 26px -14px rgba(16,26,49,0.24)' }}>
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-4 text-[12px] font-bold tracking-wider" style={{ color: 'var(--s-blue-ink)' }}>ETAPA {s.n}</span>
                  <h3 className="mt-1 text-[18px] font-extrabold tracking-tight" style={{ color: 'var(--s-ink)' }}>{s.title}</h3>
                  <p className="mt-2 max-w-xs text-[14px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.5 }}>{s.text}</p>
                </Reveal>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
