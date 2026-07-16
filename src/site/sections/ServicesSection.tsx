import { Network, Plug, LayoutGrid, LineChart, Boxes, Target, ArrowRight } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { services, specialistHref } from '@/site/content'

const icons = [Network, Plug, LayoutGrid, LineChart, Boxes, Target]

export default function ServicesSection() {
  const waHref = specialistHref('Olá! Quero entender melhor as soluções da Vintec para operações multicanal.')
  return (
    <section id="servicos" style={{ background: 'var(--s-bg)' }} className="scroll-mt-24">
      <div className="site-container py-8 md:py-11">
        <SectionHeader align="center" label="Soluções" title="O que você recebe com a Vintec." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = icons[i]
            return (
              <Reveal key={s.title} delay={(i % 3) * 70} className="site-card glow-on-hover p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl"
                  style={{ background: 'rgba(76,130,247,0.1)', border: '1px solid var(--s-line)', color: 'var(--s-blue)' }}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-[15.5px] font-bold" style={{ color: 'var(--s-ink)' }}>{s.title}</h3>
                <p className="mt-2 text-[13.5px]" style={{ color: 'var(--s-ink-soft)', lineHeight: 1.55 }}>{s.text}</p>
              </Reveal>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            Fale com um especialista <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
