import type { ProcessStepItem } from '@/site/data/processSteps'

// Etapa da implantação — número, título+descrição, marcador "RESULTADO",
// resultado concreto. Divisor sutil, sem caixa, sem ícone, sem timeline.
export default function ProcessStep({ step, index }: { step: ProcessStepItem; index: number }) {
  return (
    <li className={`impl-step${index === 1 ? ' impl-step--mid' : ''}`}>
      <span className="impl-step__n">{step.n}</span>
      <div className="impl-step__body">
        <h3 className="impl-step__title">{step.title}</h3>
        <p className="impl-step__desc">{step.text}</p>
      </div>
      <div className="impl-step__result">
        <span className="impl-step__result-label">RESULTADO</span>
        <span className="impl-step__result-value">{step.result}</span>
      </div>
    </li>
  )
}
