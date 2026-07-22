import type { LucideIcon } from 'lucide-react'

// Linha editorial numerada — sem pill, sem caixa completa, divisor horizontal.
// Reutilizada em fundo claro (diferenciais) e escuro (benefícios, via `dark`).
export default function DifferentialRow({
  item, Icon, dark,
}: {
  item: { n: string; title: string; text: string; result?: string }
  Icon: LucideIcon
  dark?: boolean
}) {
  return (
    <div className={`diff-row${dark ? ' diff-row--dark' : ''}`}>
      <span className="diff-row__n">{item.n}</span>
      <div>
        <div className="flex items-center gap-2.5">
          <Icon className="diff-row__icon h-4 w-4 shrink-0" aria-hidden="true" />
          <h3 className="diff-row__title">{item.title}</h3>
        </div>
        <p className="diff-row__text">{item.text}</p>
        {item.result && <p className="diff-row__result">Resultado: {item.result}</p>}
      </div>
    </div>
  )
}
