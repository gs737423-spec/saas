import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Loader2, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import LoginField from '@/site/components/login/LoginField'
import LoginCommercialAction from '@/site/components/login/LoginCommercialAction'
import type { LoginBridge } from './expanding-login.types'

interface Props {
  bridge: LoginBridge
  emailRef: RefObject<HTMLInputElement | null>
  /** true quando o card está aberto/abrindo (controla foco e tabbing). */
  revealing: boolean
}

/**
 * Conteúdo do estado ABERTO: texto de apoio, formulário real (login ou
 * recuperação de senha), mensagem institucional, ação comercial e links
 * legais — tudo dentro do mesmo card. Não reimplementa nada de auth: consome
 * o `bridge` vindo de Login.tsx. Reaproveita `LoginField` e
 * `LoginCommercialAction` já existentes.
 *
 * `inert` quando o card está fechado, para não ficar tabbável nem visível a
 * leitores de tela antes da revelação.
 */
export default function ExpandedLoginContent({ bridge, emailRef, revealing }: Props) {
  const b = bridge
  // `inert` desliga foco/tabbing e esconde o bloco de leitores de tela enquanto
  // o card está fechado. Aplicado via spread para compatibilidade de tipos entre
  // versões do React (algumas ainda não declaram o atributo).
  const inertProps: Record<string, unknown> = revealing ? {} : { inert: true }
  return (
    <div className="lx-expanded" id="lx-expanded" {...inertProps}>
      {b.view === 'login' ? (
        <>
          <p className="lx-support">
            Acesse a MKTOnline e acompanhe marketplaces, pedidos, estoque e desempenho em uma única visão.
          </p>

          <button type="button" className="lx-google" disabled title="Login com Google em breve">
            <svg width="15" height="15" viewBox="0 0 18 18" aria-hidden="true">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33C2.44 15.98 5.48 18 9 18z" />
              <path fill="#FBBC05" d="M3.97 10.72c-.18-.54-.28-1.11-.28-1.72s.1-1.18.28-1.72V4.95H.96C.35 6.17 0 7.55 0 9s.35 2.83.96 4.05l3.01-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
            </svg>
            Continuar com Google
          </button>
          <div className="lx-divider"><span>ou</span></div>

          <form onSubmit={b.onSubmit} noValidate className="lx-form" data-error={b.error && !b.inCooldown ? 'true' : undefined}>
            <LoginField
              id="login-email"
              label="E-mail"
              type="email"
              value={b.email}
              onChange={b.setEmail}
              icon={Mail}
              autoComplete="username"
              inputMode="email"
              disabled={b.inCooldown}
              inputRef={emailRef}
              required
            />

            <LoginField
              id="login-password"
              label="Senha"
              type="password"
              revealable
              value={b.password}
              onChange={b.setPassword}
              icon={Lock}
              autoComplete="current-password"
              disabled={b.inCooldown}
              required
              inputRef={b.passwordRef}
              onKeyUp={b.onPasswordKey}
              onKeyDown={b.onPasswordKey}
              describedById={b.error ? 'login-error' : undefined}
              addon={
                b.capsLock ? (
                  <span className="login-capslock">
                    <AlertTriangle className="h-3 w-3" /> Caps Lock ativado
                  </span>
                ) : undefined
              }
            />

            <div className="login-links-row">
              <button type="button" onClick={() => b.setView('forgot')} className="login-link">
                Esqueci minha senha
              </button>
            </div>

            <div aria-live="polite">
              {b.error && !b.inCooldown && (
                <div id="login-error" className="login-alert login-alert--error">{b.error}</div>
              )}
              {b.inCooldown && (
                <div className="login-alert login-alert--warn">
                  Muitas tentativas. Aguarde {b.cooldownLeft}s antes de tentar novamente.
                </div>
              )}
            </div>

            <button type="submit" disabled={b.loading || b.inCooldown} className="login-submit">
              <span className="login-submit__label">{b.loading ? 'Entrando...' : 'Entrar'}</span>
              {b.loading ? (
                <Loader2 className="login-submit__icon h-4 w-4 animate-spin" />
              ) : (
                <span className="login-submit__icon" aria-hidden="true">→</span>
              )}
            </button>
          </form>

          <LoginCommercialAction />

          <div className="lx-legal">
            <Link to="/privacidade">Política de Privacidade</Link>
            <span aria-hidden="true">·</span>
            <Link to="/termos">Termos de Uso</Link>
          </div>
        </>
      ) : (
        <>
          <button
            type="button"
            onClick={() => { b.setView('login'); b.setForgotEmail('') }}
            className="login-back-link"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
          </button>

          <p className="lx-support">
            Informe seu e-mail. Se houver uma conta vinculada a ele, enviaremos as instruções de recuperação.
          </p>

          {b.forgotSent ? (
            <div className="login-alert login-alert--success" style={{ marginTop: 8 }}>
              Se existir uma conta vinculada a esse e-mail, você receberá as instruções de recuperação.
            </div>
          ) : (
            <form onSubmit={b.onForgotSubmit} noValidate className="lx-form">
              <LoginField
                id="forgot-email"
                label="E-mail"
                type="email"
                value={b.forgotEmail}
                onChange={b.setForgotEmail}
                icon={Mail}
                autoComplete="username"
                inputMode="email"
                disabled={b.forgotLoading}
                required
              />
              <button type="submit" disabled={b.forgotLoading} className="login-submit">
                <span className="login-submit__label">{b.forgotLoading ? 'Enviando...' : 'Enviar instruções'}</span>
                {b.forgotLoading && <Loader2 className="login-submit__icon h-4 w-4 animate-spin" />}
              </button>
            </form>
          )}

          {b.accessHelpUrl && (
            <a href={b.accessHelpUrl} target="_blank" rel="noopener noreferrer" className="login-support" style={{ marginTop: 12 }}>
              <MessageCircle className="h-4 w-4" /> Prefiro falar com o suporte
            </a>
          )}
        </>
      )}
    </div>
  )
}
