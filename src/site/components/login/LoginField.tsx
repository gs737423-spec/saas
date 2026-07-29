import { useState, type KeyboardEvent, type ReactNode, type Ref } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Eye, EyeOff } from 'lucide-react'

interface Props {
  id: string
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (value: string) => void
  icon: LucideIcon
  autoComplete?: string
  inputMode?: 'email' | 'text'
  disabled?: boolean
  required?: boolean
  inputRef?: Ref<HTMLInputElement>
  describedById?: string
  onKeyUp?: (e: KeyboardEvent<HTMLInputElement>) => void
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
  /** Mostra o botão de revelar senha (só para campos de senha). */
  revealable?: boolean
  /** Conteúdo extra ao lado do rótulo (ex.: aviso de Caps Lock). */
  addon?: ReactNode
  /** Marca o campo como inválido (borda/ícone vermelhos) após erro de login. */
  invalid?: boolean
}

/**
 * Campo de login reutilizável — remove a duplicação do markup de e-mail/senha.
 * Rótulo flutuante (sobe no foco/preenchido via CSS `:not(:placeholder-shown)`),
 * ícone à esquerda e botão opcional de revelar senha (estado interno, o valor
 * continua controlado pelo pai). Apenas apresentação: nenhuma lógica de auth
 * mora aqui.
 */
export default function LoginField({
  id,
  label,
  type,
  value,
  onChange,
  icon: Icon,
  autoComplete,
  inputMode,
  disabled,
  required,
  inputRef,
  describedById,
  onKeyUp,
  onKeyDown,
  revealable,
  addon,
  invalid,
}: Props) {
  const [reveal, setReveal] = useState(false)
  const effectiveType = revealable ? (reveal ? 'text' : 'password') : type

  return (
    <div className="login-field">
      <div className="login-field__wrap">
        <Icon className="login-field__icon" aria-hidden="true" />
        <input
          id={id}
          ref={inputRef}
          type={effectiveType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyUp={onKeyUp}
          onKeyDown={onKeyDown}
          placeholder=" "
          required={required}
          autoComplete={autoComplete}
          inputMode={inputMode}
          disabled={disabled}
          aria-describedby={describedById}
          aria-invalid={invalid || undefined}
          className={`login-input${revealable ? ' login-input--password' : ''}`}
        />
        <label htmlFor={id} className="login-field__label">
          {label}
        </label>
        {revealable && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="login-field__toggle"
            aria-label={reveal ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={reveal}
            tabIndex={-1}
          >
            {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {addon && <div className="login-field__addon">{addon}</div>}
    </div>
  )
}
