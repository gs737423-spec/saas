import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, Loader2, MessageCircle, ArrowLeft, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { whatsappAccessHelpUrl, whatsappDemoUrl } from '@/lib/whatsapp'
import '@/site/site.css'

// Limite de tentativas ANTES de um cooldown local. Isto é só fricção de UX
// contra reenvio acidental/repetido no mesmo dispositivo (reseta ao
// recarregar a página) — a proteção real contra força bruta é o rate limit
// do próprio Supabase Auth no servidor (ver AuthContext.tsx, tratamento do
// erro 429 em signIn).
const SOFT_ATTEMPT_LIMIT = 5
const SOFT_COOLDOWN_MS = 30_000

type View = 'login' | 'forgot'

// Mesmas 3 telas reais já usadas na seção Marketplaces do site institucional
// (ver src/site/sections/MarketplacesSection.tsx) — reaproveitadas aqui como
// pano de fundo decorativo, sem duplicar assets novos.
const PREVIEW_IMAGES = [
  '/site/platform-showcase/platform-overview.webp',
  '/site/platform-showcase/platform-marketplaces.webp',
  '/site/platform-showcase/platform-products.webp',
]
const PREVIEW_INTERVAL_MS = 4500

export default function Login() {
  const { signIn, resetPassword, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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

  const [previewIndex, setPreviewIndex] = useState(0)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  ).current

  useEffect(() => setMounted(true), [])

  // Alterna as telas do preview decorativo — para com reduced motion (fica
  // só na primeira imagem, estática).
  useEffect(() => {
    if (reducedMotion) return
    const id = window.setInterval(
      () => setPreviewIndex((i) => (i + 1) % PREVIEW_IMAGES.length),
      PREVIEW_INTERVAL_MS,
    )
    return () => window.clearInterval(id)
  }, [reducedMotion])

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
  const demoUrl = whatsappDemoUrl()

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-header__brand">Vintec</Link>
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

      <div className="login-layout">
        <section className="login-visual" aria-hidden="true">
          <span className="login-visual__eyebrow">ACESSO À PLATAFORMA VINTEC</span>
          <h1 className="login-visual__title">Sua operação organizada para sua equipe acompanhar e decidir.</h1>
          <p className="login-visual__text">
            Entre para acompanhar marketplaces, pedidos, estoque, produtos e resultados em uma única rotina de gestão.
          </p>
          <div className="login-visual__preview">
            {PREVIEW_IMAGES.map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                width={1200}
                height={713}
                className="login-visual__preview-img"
                data-active={i === previewIndex}
                loading={i === 0 ? 'eager' : 'lazy'}
                draggable={false}
              />
            ))}
          </div>
        </section>

        <div className={`login-card-wrap${mounted ? ' is-mounted' : ''}`}>
          <div className="login-card">
            {view === 'login' ? (
              <>
                <span className="login-card__label">ACESSO SEGURO</span>
                <h2 className="login-card__title">Acesse sua operação</h2>
                <p className="login-card__desc">Use as credenciais liberadas pela equipe Vintec.</p>

                <form onSubmit={handleSubmit} noValidate className="login-form">
                  <div className="login-field">
                    <label htmlFor="login-email">E-mail</label>
                    <div className="login-field__wrap">
                      <Mail className="login-field__icon" aria-hidden="true" />
                      <input
                        id="login-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="seu@empresa.com"
                        required
                        autoComplete="username"
                        inputMode="email"
                        disabled={inCooldown}
                        className="login-input"
                      />
                    </div>
                  </div>

                  <div className="login-field">
                    <div className="login-field__label-row">
                      <label htmlFor="login-password">Senha</label>
                      {capsLock && (
                        <span className="login-capslock">
                          <AlertTriangle className="h-3 w-3" /> Caps Lock ativado
                        </span>
                      )}
                    </div>
                    <div className="login-field__wrap">
                      <Lock className="login-field__icon" aria-hidden="true" />
                      <input
                        ref={passwordRef}
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyUp={handlePasswordKeyEvent}
                        onKeyDown={handlePasswordKeyEvent}
                        placeholder="Sua senha"
                        required
                        autoComplete="current-password"
                        disabled={inCooldown}
                        aria-describedby={error ? 'login-error' : undefined}
                        className="login-input login-input--password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="login-field__toggle"
                        aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        aria-pressed={showPassword}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

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
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {loading ? 'Entrando...' : 'Entrar na plataforma'}
                  </button>
                </form>

                {accessHelpUrl && (
                  <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="login-support">
                    <MessageCircle className="h-4 w-4" /> Precisa de ajuda? Fale com o suporte
                  </a>
                )}

                <p className="login-footnote">
                  Acesso exclusivo para clientes. Após a implantação, nossa equipe cria os usuários e envia as instruções de primeiro acesso.
                </p>

                {demoUrl && (
                  <div className="login-demo-row">
                    <span>Ainda não utiliza a Vintec?</span>
                    <a href={demoUrl} target="_blank" rel="noopener noreferrer" className="login-link">
                      Solicitar demonstração
                    </a>
                  </div>
                )}
              </>
            ) : (
              <>
                <button type="button" onClick={() => { setView('login'); setForgotSent(false); setForgotEmail('') }} className="login-back-link">
                  <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao login
                </button>

                <h2 className="login-card__title">Recuperar acesso</h2>
                <p className="login-card__desc">Informe seu e-mail. Se houver uma conta vinculada a ele, enviaremos as instruções.</p>

                {forgotSent ? (
                  <div className="login-alert login-alert--success" style={{ marginTop: 24 }}>
                    Se existir uma conta vinculada a esse e-mail, você receberá as instruções de recuperação.
                  </div>
                ) : (
                  <form onSubmit={handleForgotSubmit} noValidate className="login-form" style={{ marginTop: 20 }}>
                    <div className="login-field">
                      <label htmlFor="forgot-email">E-mail</label>
                      <div className="login-field__wrap">
                        <Mail className="login-field__icon" aria-hidden="true" />
                        <input
                          id="forgot-email"
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="seu@empresa.com"
                          required
                          autoComplete="username"
                          inputMode="email"
                          disabled={forgotLoading}
                          className="login-input"
                        />
                      </div>
                    </div>
                    <button type="submit" disabled={forgotLoading} className="login-submit">
                      {forgotLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                      {forgotLoading ? 'Enviando...' : 'Enviar instruções'}
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
