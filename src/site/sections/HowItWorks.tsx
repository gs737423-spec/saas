import { Link2, Layers, LineChart } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { howSteps, marketplaces } from '@/site/content'

const stepIcons = [Link2, Layers, LineChart]

// Como funciona (fluxo por API) + grade de integrações disponíveis, em uma
// única seção compacta.
export default function HowItWorks() {
  return (
    <section id="como-funciona" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-16 md:py-24">
        <SectionHeader
          label="Do dado à decisão"
          title="Dos canais à decisão, de forma automática."
          desc="Conecte seus marketplaces por API. A plataforma recebe, organiza e centraliza os dados da operação."
          align="center"
        />

        {/* Fluxo de 3 etapas */}
        <div className="relative mt-14">
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

        {/* Integrações — grade única premium, todas disponíveis por API */}
        <div id="integracoes" className="mt-16 border-t pt-10" style={{ borderColor: 'var(--s-line)' }}>
          <Reveal className="mb-7 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <h3 className="site-h3" style={{ color: 'var(--s-ink)' }}>Integrações disponíveis por API</h3>
              <p className="mt-1.5 text-[14px]" style={{ color: 'var(--s-ink-soft)' }}>
                Conecte os principais canais da sua operação e centralize os dados automaticamente.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {marketplaces.map((m, i) => (
              <Reveal key={m.name} delay={(i % 4) * 50}>
                <div
                  className="site-card site-card-hover flex h-full flex-col justify-between gap-3 p-4"
                  style={{ minHeight: 104, cursor: 'default' }}
                >
                  <span className="marquee-logo" style={{ opacity: 1, filter: 'none' }}><m.Logo /></span>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-bold leading-tight" style={{ color: 'var(--s-ink)' }}>{m.name}</span>
                    <span className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-wide"
                      style={{ background: 'rgba(18,185,129,0.12)', color: '#0E8F63' }}>
                      <span style={{ width: 5, height: 5, borderRadius: 999, background: '#12B981', display: 'inline-block' }} />
                      API
                    </span>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
