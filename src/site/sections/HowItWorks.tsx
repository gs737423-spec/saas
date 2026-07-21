import { ArrowRight, Check } from 'lucide-react'
import Reveal from '@/site/components/Reveal'
import { processIntro, processSteps } from '@/site/content'

// "Como começamos" — composição editorial assimétrica de implantação
// acompanhada: painel azul-marinho (âncora institucional) à esquerda +
// lista contínua de 3 etapas em superfície clara à direita, formando um
// único bloco conectado (não duas colunas soltas). Fundo geral claro
// (off-white/soft-blue), reutiliza os tokens já usados no hero/CTA.
export default function HowItWorks() {
  return (
    <section id="como-funciona" className="process-section scroll-mt-24">
      <div className="process-section__container">
        <div className="process-panel">
          <Reveal as="div" className="process-intro">
            <span className="process-intro__eyebrow">{processIntro.eyebrow}</span>
            <h2 className="process-intro__title">{processIntro.title}</h2>
            <p className="process-intro__text">{processIntro.text}</p>
            <ul className="process-intro__reassurances">
              {processIntro.reassurances.map((r) => (
                <li key={r}><Check className="h-[13px] w-[13px]" strokeWidth={2.5} /> {r}</li>
              ))}
            </ul>
            <a href={processIntro.ctaHref} className="process-intro__cta">
              {processIntro.ctaLabel} <ArrowRight className="h-[15px] w-[15px]" />
            </a>
            <span className="process-intro__accent" aria-hidden="true" />
          </Reveal>

          <ol className="vintec-process-steps">
            {processSteps.map((s, i) => (
              <Reveal as="li" key={s.n} delay={i * 60} className="vintec-process-step">
                <span className="vintec-process-step__number">{s.n}</span>
                <div className="vintec-process-step__body">
                  <h3 className="vintec-process-step__title">{s.title}</h3>
                  <p className="vintec-process-step__text">{s.text}</p>
                </div>
                <div className="vintec-process-step__result">
                  <span className="vintec-process-step__result-label">Resultado</span>
                  <span className="vintec-process-step__result-value">{s.delivery}</span>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
