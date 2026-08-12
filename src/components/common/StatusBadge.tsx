export type StatusBadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral'

const VARIANT_STYLE: Record<StatusBadgeVariant, { color: string; bg: string; border: string }> = {
  success: { color: 'text-accent-emerald', bg: 'bg-accent-emerald/10', border: 'border-accent-emerald/20' },
  warning: { color: 'text-accent-amber', bg: 'bg-accent-amber/10', border: 'border-accent-amber/20' },
  danger: { color: 'text-accent-rose', bg: 'bg-accent-rose/10', border: 'border-accent-rose/20' },
  info: { color: 'text-accent-primary', bg: 'bg-accent-primary/10', border: 'border-accent-primary/20' },
  neutral: { color: 'text-text-muted', bg: 'bg-bg-primary/60', border: 'border-border-subtle' },
}

interface Props {
  variant: StatusBadgeVariant
  label: string
  dot?: boolean
  bordered?: boolean
  className?: string
}

// Pílula de status central — mesmo padrão de cor de acento translúcido já
// usado (duplicado) em AdminCompany.tsx, AdminClients.tsx, Importacoes.tsx
// e ProdutoDetalhe.tsx. Um só lugar pra manter.
export default function StatusBadge({ variant, label, dot = true, bordered = false, className = '' }: Props) {
  const s = VARIANT_STYLE[variant]
  return (
    <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${s.color} ${s.bg} ${bordered ? `border ${s.border}` : ''} ${className}`}>
      {dot && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />}
      {label}
    </span>
  )
}
