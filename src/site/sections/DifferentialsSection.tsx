import { CheckCircle2 } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { differentials } from '@/site/content'

export default function DifferentialsSection() {
  return (
    <section id="diferenciais" className="site-dark scroll-mt-24">
      <div className="site-container py-8 md:py-11">
        <SectionHeader align="center" tone="dark" label="Diferenciais" title="Por que escolher a Vintec." />
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {differentials.map((d, i) => (
            <Reveal key={d} delay={(i % 4) * 60} className="site-dark-card flex items-center gap-3 px-4 py-3.5">
              <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: 'var(--s-teal-bright)' }} />
              <span className="text-[14px] font-medium" style={{ color: 'var(--s-dark-ink)' }}>{d}</span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
