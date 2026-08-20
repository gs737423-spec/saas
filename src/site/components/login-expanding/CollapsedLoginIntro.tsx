import type { RefObject } from 'react'

interface Props {
  onOpen: () => void
  /** true quando o card já abriu/está abrindo (botão vira inativo e não focável). */
  expanded: boolean
  buttonRef: RefObject<HTMLButtonElement | null>
}

/**
 * Estado fechado do card — apenas o botão "Entrar" que dispara a expansão.
 * A marca e a headline são renderizadas pelo card (compartilhadas com o estado
 * aberto, para dar a sensação de "mesma superfície"). Este botão é o controle
 * semântico da revelação (aria-expanded / aria-controls).
 *
 * A abertura acontece por click/Enter/Space (comportamento nativo de <button>);
 * nunca só por hover.
 */
export default function CollapsedLoginIntro({ onOpen, expanded, buttonRef }: Props) {
  return (
    <div className="lx-collapsed">
      <button
        ref={buttonRef}
        type="button"
        className="lx-open"
        onClick={onOpen}
        disabled={expanded}
        aria-expanded={expanded}
        aria-controls="lx-expanded"
      >
        <span className="lx-open__label">Entrar</span>
        <span className="lx-open__arrow" aria-hidden="true">→</span>
      </button>
    </div>
  )
}
