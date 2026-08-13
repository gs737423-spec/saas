import { useRef } from 'react'
import LoginAtmosphereBackground from './LoginAtmosphereBackground'
import ExpandedLoginContent from './ExpandedLoginContent'
import MKTOnlineLogo from '@/components/brand/MKTOnlineLogo'
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
    <>
      <LoginAtmosphereBackground />
      <main className="access-stage">
        <section className="access-card" aria-label="Acesso ao MKTOnline">
          <div className="access-card__inner">
            <div className="access-brand">
            <MKTOnlineLogo mode="symbol" size="lg" />
              <p className="access-brand__name">MKTOnline</p>
            </div>

            <ExpandedLoginContent bridge={bridge} emailRef={emailRef} revealing />
          </div>
        </section>
      </main>
    </>
  )
}
