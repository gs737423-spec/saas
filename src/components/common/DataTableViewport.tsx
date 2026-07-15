import type { ReactNode } from 'react'

interface Props {
  size?: 'small' | 'medium' | 'large'
  stickyHeader?: boolean
  ariaLabel: string
  className?: string
  children: ReactNode
}

/**
 * Wrapper de scroll interno reutilizável para tabelas/listas longas. Usa
 * max-height (nunca uma altura fixa) — poucas linhas ocupam só o espaço que
 * precisam, muitas linhas ativam scroll nativo dentro do container. Título,
 * descrição e filtros da seção ficam FORA deste wrapper (só cabeçalho +
 * linhas rolam).
 */
export default function DataTableViewport({ size = 'medium', stickyHeader = true, ariaLabel, className = '', children }: Props) {
  return (
    <div
      role="region"
      aria-label={ariaLabel}
      tabIndex={0}
      className={`data-table-viewport data-table-viewport--${size} ${stickyHeader ? 'data-table-viewport--sticky' : ''} ${className}`}
    >
      {children}
    </div>
  )
}
