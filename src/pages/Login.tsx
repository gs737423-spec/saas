import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { apiFetch } from '@/lib/apiFetch'
import { whatsappAccessHelpUrl } from '@/lib/whatsapp'
import ExpandingLoginCard from '@/site/components/login-expanding/ExpandingLoginCard'
import type { LoginBridge } from '@/site/components/login-expanding/expanding-login.types'
import '@/site/site.css'

// Limite de tentativas ANTES de um cooldown local. Isto é só fricção de UX
// contra reenvio acidental/repetido no mesmo dispositivo (reseta ao
// recarregar a página) — a proteção real contra força bruta é o rate limit
// do próprio Supabase Auth no servidor (ver AuthContext.tsx, tratamento do
// erro 429 em signIn).
const SOFT_ATTEMPT_LIMIT = 5
const SOFT_COOLDOWN_MS = 30_000

type View = 'login' | 'forgot'

/**
 * Página /login — "MKTOnline Expanding Access". A lógica de autenticação
 * (Supabase Auth, recuperação de senha, cooldown local, soft-limit, proteção
 * contra enumeração, loading, erro, redirecionamento) vive AQUI e é passada,
 * via `bridge`, para o card visual `ExpandingLoginCard`. O visual não
 * reimplementa nenhuma regra sensível.
 */
export default function Login() {
  const { signIn, resetPassword, isAuthenticated, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  // ProtectedRoute manda pra cá com state.from = a rota que o usuário
  // tentava acessar (ex: /app/admin) — sem isso, login sempre jogava todo
  // mundo em /app fixo, mesmo quem tinha digitado /app/admin direto.
  const explicitFrom = (location.state as { from?: string } | null)?.from
  const redirectTo = explicitFrom || '/app'

  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [capsLock, setCapsLock] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotLoading, setForgotLoading] = useState(false)

  const attemptsRef = useRef(0)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [cooldownLeft, setCooldownLeft] = useState(0)

  const passwordRef = useRef<HTMLInputElement>(null)

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
    return <Navigate to={redirectTo} replace />
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
        // Sem destino explícito (login direto, não deep-link): time interna
        // cai direto no painel admin, cliente cai no dashboard normal. Logo
        // após o signIn a sessão pode ainda não estar 100% propagada (cold
        // start da function) — 1 retry evita mandar admin de verdade pro
        // painel de cliente por causa de uma falha transitória isolada.
        if (!explicitFrom) {
          async function checkIsAdmin(attempt = 0): Promise<boolean> {
            try {
              const res = await apiFetch('/api/admin/companies')
              if (res.status === 403) return false
              if (res.ok) return true
              throw new Error('unexpected_status')
            } catch {
              if (attempt === 0) {
                await new Promise((r) => setTimeout(r, 600))
                return checkIsAdmin(1)
              }
              return false
            }
          }
          const isAdmin = await checkIsAdmin()
          navigate(isAdmin ? '/app/admin' : '/app', { replace: true })
        } else {
          navigate(redirectTo, { replace: true })
        }
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

  const bridge: LoginBridge = {
    view,
    setView,
    email,
    setEmail,
    password,
    setPassword,
    capsLock,
    onPasswordKey: handlePasswordKeyEvent,
    passwordRef,
    error,
    inCooldown,
    cooldownLeft,
    loading,
    onSubmit: handleSubmit,
    forgotEmail,
    setForgotEmail,
    forgotSent,
    forgotLoading,
    onForgotSubmit: handleForgotSubmit,
    accessHelpUrl,
  }

  return (
    <div className="lx-page">
      <div className="lx-topbar">
        <Link to="/" className="lx-back">
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar ao site
        </Link>
        {accessHelpUrl && (
          <a href={accessHelpUrl} target="_blank" rel="noopener noreferrer" className="lx-help">
            Ajuda
          </a>
        )}
      </div>

      <ExpandingLoginCard bridge={bridge} />
    </div>
  )
}
