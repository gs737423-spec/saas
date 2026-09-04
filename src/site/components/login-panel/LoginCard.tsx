import { useEffect, useRef, useState } from 'react'
import './login-panel.css'
import VisualPanel from './VisualPanel'
import AccessForm from './AccessForm'
import type { LoginCardProps } from './login-panel.types'

// Peça única: painel institucional à esquerda, acesso à direita. A curva de
// transição entre os dois vive no CSS (pseudo-elemento do painel esquerdo),
// para que o card não leia como dois retângulos colados.
export default function LoginCard(props: LoginCardProps) {
  const [mounted, setMounted] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  useEffect(() => setMounted(true), [])

  return (
    <div className={`login-card${mounted ? ' is-mounted' : ''}`}>
      <VisualPanel />
      <AccessForm bridge={props.bridge} emailRef={emailRef} />
    </div>
  )
}
