import type { CSSProperties, ElementType, ReactNode } from 'react'
import { useReveal } from '@/site/hooks'

interface RevealProps {
  children: ReactNode
  className?: string
  /** Atraso escalonado, em ms */
  delay?: number
  /** Elemento raiz (default div) */
  as?: ElementType
  style?: CSSProperties
}

// Wrapper de revelação no scroll. Uma vez só, deslocamento pequeno.
export default function Reveal({ children, className = '', delay = 0, as, style }: RevealProps) {
  const ref = useReveal<HTMLElement>()
  const Tag = (as ?? 'div') as ElementType
  const merged: CSSProperties | undefined =
    delay || style ? { ...(style ?? {}), ...(delay ? { ['--reveal-delay']: `${delay}ms` } : {}) } : undefined
  return (
    <Tag ref={ref} className={`reveal ${className}`} style={merged}>
      {children}
    </Tag>
  )
}
