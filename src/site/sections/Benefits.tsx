import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import BrowserFrame from '@/site/components/BrowserFrame'
import { benefits } from '@/site/content'

export default function Benefits() {
  return (
    <section id="beneficios" style={{ background: 'var(--s-surface)', borderTop: '1px solid var(--s-line)' }}>
      <div className="site-container py-20 md:py-28">
        <div className="grid gap-12 lg:grid-cols-[1fr_0.92fr] lg:gap-16">
          <div>
            <SectionHeader
              label="Benefícios para a operação"
              title={
                <>
                  Menos tempo organizando informações.
                  <br />
                  Mais clareza para decidir.
                </>
              }
            />
            <ol className="mt-10 grid gap-x-8 gap-y-1 sm:grid-cols-2">
              {benefits.map((b, i) => (
                <Reveal as="li" key={b} delay={(i % 2) * 60} className="flex items-start gap-3 border-b py-3.5" style={{ borderColor: 'var(--s-line)' }}>
                  <span className="mt-0.5 font-mono text-[12px] font-bold" style={{ color: 'var(--s-blue)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[14.5px] font-medium" style={{ color: 'var(--s-ink)' }}>{b}</span>
                </Reveal>
              ))}
            </ol>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <BrowserFrame
                src="/site/dashboard-kpis.webp"
                alt="Indicadores executivos centralizados na Visão Geral"
                caption="Indicadores executivos centralizados"
              />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
