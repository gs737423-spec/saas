import { Check, ArrowRight } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import ProcessStep from '@/site/components/ProcessStep'
import { processSteps } from '@/site/data/processSteps'
import { specialistHref } from '@/site/content'

const trustPoints = [
  'Sem mudanças bruscas na rotina atual.',
  'Orientação durante a configuração e os primeiros dias.',
]

// Implantação — introdução + pontos de confiança à esquerda, uma única
// superfície elevada com 3 etapas editoriais à direita. Fundo azul-marinho.
export default function HowItWorks() {
  return (
    <section id="como-funciona" className="sec-implant scroll-mt-24">
      <div className="site-container site-container--tight" style={{ maxWidth: 1220, paddingTop: 104, paddingBottom: 104 }}>
        <div className="grid gap-14 lg:grid-cols-12 lg:items-center lg:gap-20">
          <Reveal className="lg:col-span-4">
            <span className="mb-3 inline-block text-[12.5px] font-bold uppercase" style={{ color: '#68C8FF', letterSpacing: '0.14em' }}>
              IMPLANTAÇÃO ACOMPANHADA
            </span>
            <h2 className="font-extrabold" style={{ color: '#F6F8FC', fontSize: 'clamp(1.9rem, 2.6vw, 2.5rem)', lineHeight: 1.18, letterSpacing: '-0.02em' }}>
              Da primeira conversa à rotina organizada.
            </h2>
            <p className="mt-4" style={{ color: '#AAB8CC', fontSize: '1.02rem', lineHeight: 1.6, maxWidth: '38ch' }}>
              Entendemos como sua equipe trabalha, configuramos os marketplaces disponíveis e acompanhamos os responsáveis durante os primeiros passos — sem interromper a operação atual.
            </p>

            <ul className="impl-trust">
              {trustPoints.map((t) => (
                <li key={t}>
                  <Check className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <a href={specialistHref('Olá! Quero entender como funciona a implantação da Vintec.')} target="_blank" rel="noopener noreferrer" className="impl-cta">
              Converse sobre sua operação <ArrowRight className="h-4 w-4" />
            </a>
          </Reveal>

          <Reveal delay={80} className="lg:col-span-7 lg:col-start-6">
            <ol className="impl-surface">
              {processSteps.map((s, i) => <ProcessStep key={s.n} step={s} index={i} />)}
            </ol>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
