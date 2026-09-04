import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, MessageCircle, ShieldCheck } from 'lucide-react'
import LoginField from '@/site/components/login/LoginField'
import type { AccessFormProps } from './login-panel.types'

export default function AccessForm({ bridge: b, emailRef }: AccessFormProps) {
  const isLogin = b.view === 'login'
  const isForgot = b.view === 'forgot'

  return (
    <div className="login-form-panel">
      <div className="login-form-panel__inner">
        {b.view !== 'mfa' && (
          <div className="login-segment" role="tablist" aria-label="Tipo de acesso" data-tab={isForgot ? 'reset' : 'login'}>
            <span className="login-segment__thumb" aria-hidden="true" />
            <button type="button" role="tab" id="tab-login" aria-selected={isLogin} aria-controls="panel-login" tabIndex={isLogin ? 0 : -1} className="login-segment__btn" onClick={() => b.setView('login')}>
              Entrar
            </button>
            <button type="button" role="tab" id="tab-reset" aria-selected={isForgot} aria-controls="panel-reset" tabIndex={isForgot ? 0 : -1} className="login-segment__btn" onClick={() => b.setView('forgot')}>
              Recuperar
            </button>
          </div>
        )}

        {b.view === 'mfa' ? (
          <section id="panel-mfa" className="login-pane" aria-labelledby="mfa-title">
            <ShieldCheck className="login-pane__security-icon" aria-hidden="true" />
            <h1 id="mfa-title" className="login-pane__title">Verifique sua identidade</h1>
            <p className="login-pane__sub">Digite o código de 6 dígitos do seu aplicativo autenticador.</p>
            <form onSubmit={b.onMfaSubmit} noValidate>
              <LoginField id="login-mfa-code" label="Código de verificação" type="text" value={b.mfaCode} onChange={(value) => b.setMfaCode(value.replace(/[^0-9]/g, '').slice(0, 6))} icon={ShieldCheck} autoComplete="one-time-code" inputMode="numeric" disabled={b.mfaLoading} required invalid={!!b.mfaError} describedById={b.mfaError ? 'login-mfa-error' : undefined} />
              <div aria-live="polite">{b.mfaError && <div id="login-mfa-error" className="login-alert login-alert--error">{b.mfaError}</div>}</div>
              <button type="submit" disabled={b.mfaLoading || b.mfaCode.trim().length < 6} className="login-submit">
                {b.mfaLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{b.mfaLoading ? 'Verificando...' : 'Verificar'}</span>
                {!b.mfaLoading && <ArrowRight className="login-submit__arrow h-4 w-4" aria-hidden="true" />}
              </button>
            </form>
          </section>
        ) : isLogin ? (
          <section id="panel-login" role="tabpanel" aria-labelledby="tab-login" className="login-pane">
            <h1 className="login-pane__title">Acesse sua conta</h1>
            <p className="login-pane__sub">Use as credenciais criadas durante a implantação.</p>
            <form onSubmit={b.onSubmit} noValidate>
              <LoginField id="login-email" label="E-mail" type="email" value={b.email} onChange={b.setEmail} icon={Mail} autoComplete="username" inputMode="email" disabled={b.inCooldown || b.loading} inputRef={emailRef} required invalid={!!b.error && !b.inCooldown} />
              <LoginField id="login-password" label="Senha" type="password" revealable value={b.password} onChange={b.setPassword} icon={Lock} autoComplete="current-password" disabled={b.inCooldown || b.loading} required inputRef={b.passwordRef} onKeyUp={b.onPasswordKey} onKeyDown={b.onPasswordKey} describedById={b.error ? 'login-error' : undefined} invalid={!!b.error && !b.inCooldown} addon={b.capsLock ? <span className="login-capslock">Caps Lock ativado</span> : undefined} />
              <button type="button" className="login-forgot" onClick={() => b.setView('forgot')}>Esqueci minha senha</button>
              <div aria-live="polite">
                {b.error && !b.inCooldown && <div id="login-error" className="login-alert login-alert--error">{b.error}</div>}
                {b.inCooldown && <div className="login-alert login-alert--warn">Muitas tentativas. Aguarde {b.cooldownLeft}s antes de tentar novamente.</div>}
              </div>
              <button type="submit" disabled={b.loading || b.inCooldown} className="login-submit">
                {b.loading && <Loader2 className="h-4 w-4 animate-spin" />}
                <span>{b.loading ? 'Entrando...' : 'Entrar'}</span>
                {!b.loading && <ArrowRight className="login-submit__arrow h-4 w-4" aria-hidden="true" />}
              </button>
            </form>
          </section>
        ) : (
          <section id="panel-reset" role="tabpanel" aria-labelledby="tab-reset" className="login-pane">
            <button type="button" className="login-back-link" onClick={() => { b.setView('login'); b.setForgotEmail('') }}><ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login</button>
            <h1 className="login-pane__title">Recuperar acesso</h1>
            <p className="login-pane__sub">Informe o e-mail cadastrado. Se houver conta vinculada, enviaremos o link de redefinição.</p>
            {b.forgotSent ? (
              <div className="login-alert login-alert--success login-alert--standalone" role="status">Se existir uma conta vinculada a esse e-mail, você receberá as instruções de recuperação.</div>
            ) : (
              <form onSubmit={b.onForgotSubmit} noValidate>
                <LoginField id="forgot-email" label="E-mail cadastrado" type="email" value={b.forgotEmail} onChange={b.setForgotEmail} icon={Mail} autoComplete="username" inputMode="email" disabled={b.forgotLoading} required />
                <button type="submit" disabled={b.forgotLoading} className="login-submit login-submit--spaced">
                  {b.forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>{b.forgotLoading ? 'Enviando...' : 'Enviar instruções'}</span>
                  {!b.forgotLoading && <ArrowRight className="login-submit__arrow h-4 w-4" aria-hidden="true" />}
                </button>
              </form>
            )}
            {b.accessHelpUrl && <a href={b.accessHelpUrl} target="_blank" rel="noopener noreferrer" className="login-support"><MessageCircle className="h-4 w-4" /> Prefiro falar com o suporte</a>}
          </section>
        )}

        <div className="login-form__legal">
          <Link to="/privacidade">Política de Privacidade</Link><span aria-hidden="true"> · </span><Link to="/termos">Termos de Uso</Link>
        </div>
      </div>
    </div>
  )
}
