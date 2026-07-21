import type { LucideIcon } from 'lucide-react'
import type { ProcessStepItem } from '@/site/data/processSteps'

// Um passo da jornada — marcador grande numerado + ícone + título + texto +
// tag de resultado concreto. Sem card pesado.
export default function ProcessStep({ step, Icon, delay }: { step: ProcessStepItem; Icon: LucideIcon; delay: number }) {
  return (
    <li className="process-step" style={{ ['--reveal-delay' as string]: `${delay}ms` }}>
      <span className="process-step__marker" aria-hidden="true">{step.n}</span>
      <div className="process-step__head">
        <Icon className="process-step__icon" aria-hidden="true" />
        <h3 className="process-step__title">{step.title}</h3>
      </div>
      <p className="process-step__text">{step.text}</p>
      <span className="process-step__result">{step.result}</span>
    </li>
  )
}
