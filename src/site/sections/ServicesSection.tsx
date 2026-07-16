import { Network, Plug, LayoutGrid, LineChart, Boxes, Target, ArrowRight } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { services, specialistHref } from '@/site/content'

const icons = [Network, Plug, LayoutGrid, LineChart, Boxes, Target]

export default function ServicesSection() {
  const waHref = specialistHref('Olá! Quero entender melhor as soluções da Vintec para operações multicanal.')
  return (
    <section id="servicos" className="sec-deep scroll-mt-24">
      <div className="site-container py-14 md:py-20">
        <SectionHeader align="center" tone="dark" label="Soluções" title="O que você recebe com a Vintec." />
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const Icon = icons[i]
            return (
              <Reveal key={s.title} delay={(i % 3) * 70} className="vt-card p-6">
                <span className={i % 2 === 0 ? 'vt-ico' : 'vt-ico vt-ico--blue'}><Icon className="h-5 w-5" /></span>
                <h3 className="mt-4 text-[15.5px] font-bold vt-ink">{s.title}</h3>
                <p className="mt-2 text-[13.5px] vt-muted" style={{ lineHeight: 1.55 }}>{s.text}</p>
              </Reveal>
            )
          })}
        </div>

        <div className="mt-10 flex justify-center">
          <a href={waHref} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ padding: '0.85rem 1.5rem' }}>
            Fale com um especialista <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
