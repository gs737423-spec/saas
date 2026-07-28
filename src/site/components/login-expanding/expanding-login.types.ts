import type { FormEvent, KeyboardEvent, RefObject } from 'react'

/**
 * Estados visuais do card de login (Vintec Expanding Access). São só de
 * apresentação — a lógica de autenticação vive em Login.tsx e não depende
 * destes estados.
 *
 *  collapsed  → card compacto, só marca + headline + botão "Entrar".
 *  expanding  → transição de abertura em curso (card cresce, conteúdo revela).
 *  expanded   → card aberto, formulário utilizável, foco no e-mail.
 *  closing    → transição de fechamento (só quando `canClose`).
 */
export type LoginCardState = 'collapsed' | 'expanding' | 'expanded' | 'closing'

/**
 * "Ponte" entre a lógica de auth (Login.tsx) e o conteúdo visual do card
 * (ExpandedLoginContent). Tudo que o formulário precisa chega por aqui —
 * nenhuma regra sensível é reimplementada nos componentes visuais.
 */
export interface LoginBridge {
  view: 'login' | 'forgot'
  setView: (v: 'login' | 'forgot') => void

  email: string
  setEmail: (v: string) => void
  password: string
  setPassword: (v: string) => void

  capsLock: boolean
  onPasswordKey: (e: KeyboardEvent<HTMLInputElement>) => void
  passwordRef: RefObject<HTMLInputElement | null>

  error: string
  inCooldown: boolean
  cooldownLeft: number
  loading: boolean
  onSubmit: (e: FormEvent) => void

  forgotEmail: string
  setForgotEmail: (v: string) => void
  forgotSent: boolean
  forgotLoading: boolean
  onForgotSubmit: (e: FormEvent) => void

  /** URL real de ajuda/suporte (WhatsApp) — `null` se não configurada. */
  accessHelpUrl: string | null
}
