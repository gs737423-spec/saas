import { Boxes, Link2, Compass, UserCheck } from 'lucide-react'
import SectionHeader from '@/site/components/SectionHeader'
import Reveal from '@/site/components/Reveal'
import { mainService, complementaryServices } from '@/site/data/services'

const complementaryIcons = [Link2, Compass, UserCheck]

// Benefícios e soluções — "o que muda na rotina". Seção ESCURA flat
// (ink-900) — um bloco principal + três complementares dark-850.
export default function ServicesSection() {
  return (
    <section id="servicos" className="sec-dark-flat scroll-mt-24">
      <div className="site-container site-container--tight py-14 md:py-16">
        <SectionHeader
          tone="dark"
          label="O que muda na rotina"
          title="Sua equipe deixa de procurar informações e passa a trabalhar com prioridades."
          desc="Pedidos, estoque, vendas e resultados ficam reunidos para que a equipe saiba o que aconteceu e onde precisa agir."
        />

        <div className="mt-10 grid gap-6 lg:grid-cols-12">
          {/* Bloco principal — 7 colunas */}
          <Reveal className="lg:col-span-7">
            <div className="svc-main">
              <Boxes className="svc-main__bgicon" aria-hidden="true" strokeWidth={1.4} />
              <span className="svc-main__amber" aria-hidden="true" />
              <span className="svc-main__icon">
                <Boxes className="h-6 w-6" style={{ color: '#A8E0FC' }} />
              </span>
              <h3 className="svc-main__title">{mainService.title}</h3>
              <p className="svc-main__desc">{mainService.description}</p>
              <ul className="svc-main__list">
                {mainService.benefits.map((b) => (
                  <li key={b}>
                    <span aria-hidden="true" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          {/* Complementares — 5 colunas, empilhados, superfície dark-850 */}
          <div className="flex flex-col gap-5 lg:col-span-5">
            {complementaryServices.map((s, i) => {
              const Icon = complementaryIcons[i]
              return (
                <Reveal key={s.id} delay={(i + 1) * 80} className="flex-1">
                  <div className="svc-card">
                    <span className="svc-card__icon-tile">
                      <Icon className="h-5 w-5" style={{ color: '#A8E0FC' }} />
                    </span>
                    <h3 className="svc-card__title">{s.title}</h3>
                    <p className="svc-card__desc">{s.description}</p>
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
