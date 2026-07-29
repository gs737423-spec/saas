import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useReducedMotion } from '@/lib/motion'
import VintecSignature from './VintecSignature'
import CollapsedLoginIntro from './CollapsedLoginIntro'
import ExpandedLoginContent from './ExpandedLoginContent'
import type { LoginBridge, LoginCardState } from './expanding-login.types'

// Durações da máquina de estados (JS) — espelham os tokens CSS --lx-dur-*.
// Ao fim de cada transição trocamos de estado e movemos o foco.
const OPEN_MS = 580
const CLOSE_MS = 540

interface Props {
  bridge: LoginBridge
  /** Só permite fechar quando não há envio/erro/campos preenchidos (Login.tsx). */
  canClose: boolean
}

/**
 * Card "MKTOnline Expanding Access" — superfície única que abre do estado compacto
 * para o formulário. Orquestra apenas o VISUAL e o FOCO; a autenticação vem
 * pronta em `bridge`.
 *
 * Estados: collapsed → expanding → expanded → closing. A abertura é disparada
 * por click/Enter/Space no botão (nunca só hover). Escape recolhe, mas só
 * quando `canClose`. Em `prefers-reduced-motion`, a troca é seca (sem fases).
 */
export default function ExpandingLoginCard({ bridge, canClose }: Props) {
  const [state, setState] = useState<LoginCardState>('collapsed')
  const [tabHidden, setTabHidden] = useState(false)
  const reduced = useReducedMotion()

  const openBtnRef = useRef<HTMLButtonElement>(null)
  const emailRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)

  const open = useCallback(() => {
    setState((s) => {
      if (s !== 'collapsed') return s
      window.clearTimeout(timer.current)
      if (reduced) {
        // troca seca — foco no e-mail no próximo frame (já montado/visível)
        requestAnimationFrame(() => emailRef.current?.focus())
        return 'expanded'
      }
      timer.current = window.setTimeout(() => {
        setState('expanded')
        emailRef.current?.focus()
      }, OPEN_MS)
      return 'expanding'
    })
  }, [reduced])

  const close = useCallback(() => {
    setState((s) => {
      if (s !== 'expanded' || !canClose) return s
      window.clearTimeout(timer.current)
      if (reduced) {
        requestAnimationFrame(() => openBtnRef.current?.focus())
        return 'collapsed'
      }
      timer.current = window.setTimeout(() => {
        setState('collapsed')
        openBtnRef.current?.focus()
      }, CLOSE_MS)
      return 'closing'
    })
  }, [canClose, reduced])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Pausa a animação decorativa da assinatura quando a aba fica oculta.
  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [])

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') close()
  }

  const revealing = state === 'expanding' || state === 'expanded'

  return (
    <div className="lx-stage">
      <div
        className="lx-card"
        data-state={state}
        data-hidden={tabHidden ? 'true' : undefined}
        onKeyDown={onKeyDown}
      >
        <div className="lx-card__inner">
          {state === 'expanded' && canClose && (
            <button type="button" className="lx-close" onClick={close} aria-label="Recolher e voltar">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}

          <VintecSignature state={state} />
          <p className="lx-brand">MKTOnline</p>
          <h1 className="lx-headline">Clareza para conduzir sua operação.</h1>

          <CollapsedLoginIntro onOpen={open} expanded={revealing} buttonRef={openBtnRef} />

          <ExpandedLoginContent bridge={bridge} emailRef={emailRef} revealing={revealing} />
        </div>
      </div>
    </div>
  )
}
