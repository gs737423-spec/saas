import { ctaLabels } from '@/site/content'

interface Step {
  label: string
  text: string
}

const steps: Step[] = [
  { label: 'CONVERSA ESTRATÉGICA', text: 'Conhecemos sua empresa, seus canais, objetivos e o momento atual da operação.' },
  { label: 'LEITURA DO CENÁRIO', text: 'Identificamos gargalos, riscos e oportunidades que podem estar passando despercebidos.' },
  { label: 'PRÓXIMOS PASSOS', text: 'Definimos prioridades claras e avaliamos como a MKTOnline pode apoiar a evolução do negócio.' },
]

// Como trabalhamos — convite comercial pra agendar uma conversa estratégica,
// não só uma explicação de processo. 3 etapas conectadas num único painel
// (numeração discreta, sem ícone genérico) + CTA próprio no fim, mais
// destacado que o resto, sem disputar atenção com o título.
// `id="como-funciona"` é âncora de compatibilidade sem caixa própria — o
// Footer ainda tem 2 links pra ela.
export default function ComoTrabalhamosSection() {
  return (
    <section id="como-trabalhamos" className="sec-cool trabalhamos-section scroll-mt-24">
      <span id="como-funciona" aria-hidden="true" className="trabalhamos-compat-anchor" />
      <div className="site-container site-container--tight trabalhamos-container" style={{ maxWidth: 1160 }}>
        <span className="trabalhamos-eyebrow">UMA CONVERSA SOBRE O SEU NEGÓCIO</span>
        <h2 className="trabalhamos-title">
          Seu negócio já chegou longe.<br />Agora vamos entender o que pode levá-lo ainda mais longe.
        </h2>
        <p className="trabalhamos-intro">
          Antes de recomendar qualquer solução, queremos conhecer sua operação, seus objetivos e os desafios que
          estão limitando o próximo passo. Em uma conversa estratégica, analisamos o cenário atual e identificamos
          onde nossa experiência pode gerar mais resultado.
        </p>

        <div className="trabalhamos-panel">
          <div className="trabalhamos-steps">
            {steps.map((s, i) => (
              <div key={s.label} className="trabalhamos-step">
                <span className="trabalhamos-step__index">{String(i + 1).padStart(2, '0')}</span>
                <span className="trabalhamos-step__label">{s.label}</span>
                <p className="trabalhamos-step__text">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="trabalhamos-panel__base">
            Você não recebe uma apresentação genérica. A conversa começa pela realidade da sua operação.
          </p>
        </div>

        <div className="trabalhamos-cta">
          <a href="#conversao" className="btn btn-primary trabalhamos-cta__btn">
            {ctaLabels.principal}
          </a>
          <span className="trabalhamos-cta-note">Cerca de 30 minutos, sem compromisso.</span>
        </div>
      </div>
    </section>
  )
}
