import type { ReactNode } from 'react'
import Reveal from '@/site/components/Reveal'

interface Props {
  label?: string
  title: ReactNode
  desc?: ReactNode
  align?: 'left' | 'center'
  tone?: 'light' | 'dark'
  className?: string
}

// Cabeçalho de seção padronizado: label pequeno + título forte + descrição.
export default function SectionHeader({ label, title, desc, align = 'left', tone = 'light', className = '' }: Props) {
  const isCenter = align === 'center'
  return (
    <Reveal
      className={`${isCenter ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}
    >
      {label && (
        <span
          className="site-label mb-3"
          style={tone === 'dark' ? { color: '#4FD9C9' } : undefined}
        >
          <span
            aria-hidden="true"
            style={{
              width: 22,
              height: 2,
              borderRadius: 2,
              background: 'currentColor',
              display: 'inline-block',
              opacity: 0.7,
            }}
          />
          {label}
        </span>
      )}
      <h2 className="site-h2" style={tone === 'dark' ? { color: 'var(--s-dark-ink)' } : { color: 'var(--s-ink)' }}>
        {title}
      </h2>
      {desc && (
        <p className="site-lead mt-4" style={tone === 'dark' ? { color: 'var(--s-dark-muted)' } : undefined}>
          {desc}
        </p>
      )}
    </Reveal>
  )
}
