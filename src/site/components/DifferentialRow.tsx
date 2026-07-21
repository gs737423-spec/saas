import type { LucideIcon } from 'lucide-react'
import type { DifferentialItem } from '@/site/data/differentials'

// Linha editorial numerada — sem pill, sem caixa completa, divisor horizontal.
export default function DifferentialRow({ item, Icon }: { item: DifferentialItem; Icon: LucideIcon }) {
  return (
    <div className="diff-row">
      <span className="diff-row__n">{item.n}</span>
      <div>
        <div className="flex items-center gap-2.5">
          <Icon className="diff-row__icon h-4 w-4 shrink-0" style={{ color: 'var(--vintec-blue-600)' }} />
          <h3 className="diff-row__title">{item.title}</h3>
        </div>
        <p className="diff-row__text">{item.text}</p>
      </div>
    </div>
  )
}
