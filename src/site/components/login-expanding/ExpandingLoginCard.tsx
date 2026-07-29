import { useRef } from 'react'
import LoginAtmosphereBackground from './LoginAtmosphereBackground'
import ExpandedLoginContent from './ExpandedLoginContent'
import type { LoginBridge } from './expanding-login.types'

interface Props {
  bridge: LoginBridge
}

/**
 * Card "MKTOnline" — superfície estática única, formulário sempre visível
 * (sem estado collapsed/expanding — abolido a pedido: o card abre direto no
 * formulário, como referência de login centralizado). Orquestra só o VISUAL;
 * a autenticação vem pronta em `bridge`.
 */
export default function ExpandingLoginCard({ bridge }: Props) {
  const emailRef = useRef<HTMLInputElement>(null)

  return (
    <div className="lx-stage">
      <LoginAtmosphereBackground />
      <div className="lx-card lx-card--static" data-state="expanded">
        <div className="lx-card__inner">
          <p className="lx-brand lx-brand--centered">MKTOnline</p>

          <ExpandedLoginContent bridge={bridge} emailRef={emailRef} revealing />
        </div>
      </div>
    </div>
  )
}
