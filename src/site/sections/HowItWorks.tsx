import { Plug, Layers, LineChart } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { howSteps } from '@/site/content'

const icons = [Plug, Layers, LineChart]

export default function HowItWorks() {
  return (
    <section id="como-funciona" style={{ background: 'var(--s-bg)' }}>
      <div className="site-container py-20 md:py-28">
        <SectionHeader
          label="Do dado à decisão"
          title="Uma operação mais clara em três etapas."
          align="center"
        />

        <div className="relative mt-14">
          {/* Linha conectora — horizontal no desktop */}
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-7 hidden lg:block"
            style={{ height: 2, background: 'linear-gradient(90deg, transparent, var(--s-line-strong) 12%, var(--s-line-strong) 88%, transparent)' }}
          />
          <ol className="grid gap-8 lg:grid-cols-3 lg:gap-6">
            {howSteps.map((s, i) => {
              const Icon = icons[i]
              return (
                <Reveal as="li" key={s.n} delay={i * 90} className="relative flex flex-col items-center text-center lg:px-6">
                  <span
                    className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl"
                    style={{ background: 'var(--s-surface)', border: '1px solid var(--s-line)', color: 'var(--s-blue)', boxShadow: '0 10px 26px -14px rgba(16,26,49,0.24)' }}
                  >
                    <Icon className="h-6 w-6" />
                  </span>
                  <span className="mt-4 text-[12px] font-bold tracking-wider" style={{ color: 'var(--s-blue-ink)' }}>ETAPA {s.n}</span>
                  <h3 className="mt-1 text-[19px] font-extrabold tracking-tight" style={{ color: 'var(--s-ink)' }}>{s.title}</h3>
                  <p className="mt-2 max-w-xs text-[14.5px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.5 }}>{s.text}</p>
                </Reveal>
              )
            })}
          </ol>
        </div>
      </div>
    </section>
  )
}
