import type { FormEvent, KeyboardEvent, RefObject } from 'react'

/**
 * Estados visuais do card de login (MKTOnline Expanding Access). São só de
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
  view: 'login' | 'forgot' | 'mfa'
  setView: (v: 'login' | 'forgot' | 'mfa') => void

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

  /** Verificação de MFA (TOTP) — só entra em jogo pra conta que ativou 2FA
   *  em Configurações de Segurança (hoje, na prática, só platform_admins).
   *  Senha já validada nesse ponto; falta só o código do app autenticador. */
  mfaCode: string
  setMfaCode: (v: string) => void
  mfaError: string
  mfaLoading: boolean
  onMfaSubmit: (e: FormEvent) => void
}
