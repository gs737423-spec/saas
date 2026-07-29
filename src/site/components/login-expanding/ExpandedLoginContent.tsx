import type { RefObject } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Lock, Loader2, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import LoginField from '@/site/components/login/LoginField'
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
