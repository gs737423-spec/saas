import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Loader2, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { whatsappAccessHelpUrl } from '@/lib/whatsapp'
import { staggerDelays } from '@/lib/motion'
import LoginMotionHeader from '@/site/components/login-motion/LoginMotionHeader'
import LoginField from '@/site/components/login/LoginField'
import LoginCommercialAction from '@/site/components/login/LoginCommercialAction'
import '@/site/site.css'

// Limite de tentativas ANTES de um cooldown local. Isto é só fricção de UX
// contra reenvio acidental/repetido no mesmo dispositivo (reseta ao
// recarregar a página) — a proteção real contra força bruta é o rate limit
// do próprio Supabase Auth no servidor (ver AuthContext.tsx, tratamento do
// erro 429 em signIn).
const SOFT_ATTEMPT_LIMIT = 5
const SOFT_COOLDOWN_MS = 30_000

type View = 'login' | 'forgot'

// Delays de entrada em stagger para os blocos do painel de autenticação
// (marca → headline → apoio → campos → botão → ação comercial). Curto o
// bastante para não atrasar o uso do formulário.
const ENTER_DELAYS = staggerDelays(6, 70)
const enterStyle = (i: number): CSSProperties => ({ transitionDelay: `${ENTER_DELAYS[i]}ms` })

export default function Login() {
  const { signIn, resetPassword, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const attemptsRef = useRef(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => setMounted(true), [])

  // Contagem regressiva do cooldown local
  useEffect(() => {
    if (!cooldownUntil) return
    const tick = () => {
      const left = Math.max(0, Math.ceil((cooldownUntil - Date.now()) / 1000))
      setCooldownLeft(left)
      if (left <= 0) {
        setCooldownUntil(null)
        attemptsRef.current = 0
      }
    }
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [cooldownUntil])

  // Enquanto a sessão inicial ainda está sendo verificada, não renderiza nada
  // — evita tanto mostrar o formulário para quem já está logado quanto
  // redirecionar cedo demais (flash em qualquer uma das direções).
  if (authLoading) return null

  if (isAuthenticated) {
    return <Navigate to="/app" replace />
  }

  const inCooldown = cooldownUntil !== null && cooldownLeft > 0

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (loading || inCooldown) return
    setError('')
    setLoading(true)

    try {
      const { error: signInError } = await signIn(email, password)
      if (!signInError) {
        attemptsRef.current = 0
        navigate('/app', { replace: true })
        return
      }

      setError(signInError)
      attemptsRef.current += 1
      if (attemptsRef.current >= SOFT_ATTEMPT_LIMIT) {
        setCooldownUntil(Date.now() + SOFT_COOLDOWN_MS)
      }
      passwordRef.current?.focus()
      passwordRef.current?.select()
    } finally {
      setLoading(false)
    }
  }

  function handlePasswordKeyEvent(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLock(e.getModifierState?.('CapsLock') ?? false)
  }

  async function handleForgotSubmit(e: FormEvent) {
    e.preventDefault()
    if (forgotLoading) return
    setForgotLoading(true)
    try {
      await resetPassword(forgotEmail)
    } finally {
      // Resposta sempre a mesma, exista ou não a conta — evita enumeração.
      setForgotLoading(false)
      setForgotSent(true)
    }
  }

  const accessHelpUrl = whatsappAccessHelpUrl()

  return (
    <div className="login-page">
      <header className="login-header">
        <span aria-hidden="true" />
        <div className="login-header__actions">
          <Link to="/" className="login-header__back">
            <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
          </Link>
          {accessHelpUrl && (
            <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="login-header__help">
              Ajuda
            </a>
          )}
        </div>
      </header>

      {/* Vintec Motion Card — card vertical único: faixa animada no topo +
          formulário abaixo. Uma só peça (separação só por gradiente/iluminação). */}
      <div className="login-stage">
        <div className={`login-card${mounted ? ' is-mounted' : ''}`}>
          <LoginMotionHeader />
          <div className="login-body">
            {view === 'login' ? (
            <>
              <div className="login-enter login-brand" style={enterStyle(0)}>
                <span className="login-brand__mark">Vintec</span>
              </div>

              <h1 className="login-enter login-title" style={enterStyle(1)}>
                Controle começa com uma visão clara.
              </h1>
              <p className="login-enter login-subtitle" style={enterStyle(2)}>
                Acesse sua operação centralizada na Vintec.
              </p>

              <form onSubmit={handleSubmit} noValidate className="login-form login-enter" style={enterStyle(3)}>
                <LoginField
                  id="login-email"
                  label="E-mail"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  icon={Mail}
                  autoComplete="username"
                  inputMode="email"
                  disabled={inCooldown}
                  required
                />

                <LoginField
                  id="login-password"
                  label="Senha"
                  type="password"
                  revealable
                  value={password}
                  onChange={setPassword}
                  icon={Lock}
                  autoComplete="current-password"
                  disabled={inCooldown}
                  required
                  inputRef={passwordRef}
                  onKeyUp={handlePasswordKeyEvent}
                  onKeyDown={handlePasswordKeyEvent}
                  describedById={error ? 'login-error' : undefined}
                  addon={
                    capsLock ? (
                      <span className="login-capslock">
                        <AlertTriangle className="h-3 w-3" /> Caps Lock ativado
                      </span>
                    ) : undefined
                  }
                />

                <div className="login-links-row">
                  <button type="button" onClick={() => setView('forgot')} className="login-link">
                    Esqueci minha senha
                  </button>
                </div>

                <div aria-live="polite">
                  {error && !inCooldown && (
                    <div id="login-error" className="login-alert login-alert--error">{error}</div>
                  )}
                  {inCooldown && (
                    <div className="login-alert login-alert--warn">
                      Muitas tentativas. Aguarde {cooldownLeft}s antes de tentar novamente.
                    </div>
                  )}
                </div>

                <button type="submit" disabled={loading || inCooldown} className="login-submit">
                  <span className="login-submit__label">{loading ? 'Entrando...' : 'Entrar'}</span>
                  {loading ? (
                    <Loader2 className="login-submit__icon h-4 w-4 animate-spin" />
                  ) : (
                    <span className="login-submit__icon" aria-hidden="true">→</span>
                  )}
                </button>
              </form>

              <div className="login-enter" style={enterStyle(4)}>
                {accessHelpUrl && (
                  <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="login-support">
                    <MessageCircle className="h-4 w-4" /> Precisa de ajuda? Fale com o suporte
                  </a>
                )}

                <p className="login-footnote">
                  Acesso exclusivo para clientes. Após a implantação, nossa equipe cria os usuários e envia as instruções de primeiro acesso.
                </p>
              </div>

              <div className="login-enter" style={enterStyle(5)}>
                <LoginCommercialAction />
              </div>
            </>
          ) : (
            <>
              <button type="button" onClick={() => { setView('login'); setForgotSent(false); setForgotEmail('') }} className="login-back-link">
                <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
              </button>

              <h1 className="login-title">Recuperar acesso</h1>
              <p className="login-subtitle">Informe seu e-mail. Se houver uma conta vinculada a ele, enviaremos as instruções.</p>

              {forgotSent ? (
                <div className="login-alert login-alert--success" style={{ marginTop: 24 }}>
                  Se existir uma conta vinculada a esse e-mail, você receberá as instruções de recuperação.
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} noValidate className="login-form" style={{ marginTop: 20 }}>
                  <LoginField
                    id="forgot-email"
                    label="E-mail"
                    type="email"
                    value={forgotEmail}
                    onChange={setForgotEmail}
                    icon={Mail}
                    autoComplete="username"
                    inputMode="email"
                    disabled={forgotLoading}
                    required
                  />
                  <button type="submit" disabled={forgotLoading} className="login-submit">
                    <span className="login-submit__label">{forgotLoading ? 'Enviando...' : 'Enviar instruções'}</span>
                    {forgotLoading && <Loader2 className="login-submit__icon h-4 w-4 animate-spin" />}
                  </button>
                </form>
              )}

              {accessHelpUrl && (
                <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="login-support" style={{ marginTop: 20 }}>
                  <MessageCircle className="h-4 w-4" /> Prefiro falar com o suporte
                </a>
              )}
            </>
          )}
          </div>
        </div>
      </div>

      <div className="login-footer">
        <Link to="/privacidade">Política de Privacidade</Link>
        <Link to="/termos">Termos de Uso</Link>
        {accessHelpUrl && <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer">Suporte</a>}
        <span>&copy; {new Date().getFullYear()} Vintec</span>
      </div>
    </div>
  )
}
