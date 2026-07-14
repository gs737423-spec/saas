import { Link2, Layers, LineChart } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { howSteps, marketplaces, statusLabel, type IntegrationStatus } from '@/site/content'

const stepIcons = [Link2, Layers, LineChart]

const statusOrder: { status: IntegrationStatus; tone: string }[] = [
  { status: 'disponivel', tone: '#12B981' },
  { status: 'em-desenvolvimento', tone: '#4C82F7' },
  { status: 'em-breve', tone: '#E9A83A' },
]

// Como funciona (por API) + Integrações, em uma seção compacta.
export default function HowItWorks() {
  return (
    <section id="como-funciona" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-16 md:py-24">
        <SectionHeader
          label="Do dado à decisão"
          title="Dos canais à decisão, de forma automática."
          desc="Você conecta os marketplaces por API; a plataforma recebe, organiza e centraliza os dados da operação."
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

        {/* Integrações — bloco compacto, 3 status */}
        <div id="integracoes" className="mt-16 scroll-mt-24">
          <Reveal className="mb-6 flex items-baseline justify-between gap-4 border-t pt-10" style={{ borderColor: 'var(--s-line)' }}>
            <h3 className="site-h3" style={{ color: 'var(--s-ink)' }}>Integrações da plataforma</h3>
            <span className="text-[13px]" style={{ color: 'var(--s-muted)' }}>Conexões diretas por API</span>
          </Reveal>
          <div className="grid gap-4 lg:grid-cols-3">
            {statusOrder.map((g, gi) => {
              const list = marketplaces.filter((m) => m.status === g.status)
              return (
                <Reveal key={g.status} delay={gi * 80}>
                  <div className="site-card h-full p-5">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: g.tone }} />
                      <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--s-ink-soft)' }}>{statusLabel[g.status]}</span>
                    </div>
                    <ul className="space-y-2">
                      {list.map((m) => (
                        <li key={m.name} className="flex items-center justify-between gap-2 rounded-xl px-3 py-2"
                          style={{ background: 'var(--s-bg-soft)', border: '1px solid var(--s-line)' }}>
                          <span className="marquee-logo" style={{ filter: 'none', opacity: 1 }}><m.Logo /></span>
                          {g.status !== 'disponivel' && (
                            <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={{ background: `${g.tone}1e`, color: g.tone }}>{statusLabel[g.status]}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
