import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Lock, Eye, EyeOff, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import '@/site/site.css'

const MIN_LENGTH = 8

// Fluxo mínimo de redefinição: o link do e-mail de recuperação já estabelece
// uma sessão temporária no navegador (supabase-js com detectSessionInUrl,
// ver src/lib/supabaseClient.ts) — este componente só coleta a nova senha e
// chama supabase.auth.updateUser. Nenhum token é gerado ou lido manualmente.
export default function ResetPassword() {
  const { session, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (done) {
      const t = window.setTimeout(() => navigate('/login', { replace: true }), 2500)
      return () => window.clearTimeout(t)
    }
  }, [done, navigate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (submitting) return
    setError('')

    if (password.length < MIN_LENGTH) {
      setError(`A senha precisa ter pelo menos ${MIN_LENGTH} caracteres.`)
      return
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError('Não foi possível redefinir a senha agora. Tente novamente em instantes.')
        return
      }
      setDone(true)
    } catch {
      setError('Não foi possível concluir a operação agora. Verifique sua conexão e tente novamente.')
    } finally {
      setSubmitting(false)
    }
  }

  const linkInvalid = !authLoading && !session

  return (
    <div className="login-page">
      <header className="login-header">
        <Link to="/" className="login-header__brand">Vintec</Link>
      </header>

      <div className="login-layout" style={{ gridTemplateColumns: '1fr' }}>
        <div className="login-card-wrap is-mounted" style={{ gridColumn: '1 / -1' }}>
          <div className="login-card">
            {authLoading ? (
              <p className="login-card__desc">Verificando link de recuperação...</p>
            ) : linkInvalid ? (
              <>
                <h2 className="login-card__title">Link inválido ou expirado</h2>
                <p className="login-card__desc">
                  Solicite uma nova recuperação de senha na tela de login.
                </p>
                <Link to="/login" className="login-submit" style={{ marginTop: 20, textDecoration: 'none' }}>
                  Voltar ao login
                </Link>
              </>
            ) : done ? (
              <>
                <h2 className="login-card__title">Senha redefinida</h2>
                <p className="login-card__desc">
                  Sua senha foi atualizada. Você será levado ao login em instantes.
                </p>
              </>
            ) : (
              <>
                <span className="login-card__label">REDEFINIR SENHA</span>
                <h2 className="login-card__title">Escolha uma nova senha</h2>
                <p className="login-card__desc">Use pelo menos {MIN_LENGTH} caracteres.</p>

                <form onSubmit={handleSubmit} noValidate className="login-form">
                  <div className="login-field">
                    <label htmlFor="new-password">Nova senha</label>
                    <div className="login-field__wrap">
                      <Lock className="login-field__icon" aria-hidden="true" />
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Sua nova senha"
                        required
                        autoComplete="new-password"
                        disabled={submitting}
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

                  <div className="login-field">
                    <label htmlFor="confirm-password">Confirmar senha</label>
                    <div className="login-field__wrap">
                      <Lock className="login-field__icon" aria-hidden="true" />
                      <input
                        id="confirm-password"
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        required
                        autoComplete="new-password"
                        disabled={submitting}
                        className="login-input login-input--password"
                      />
                    </div>
                  </div>

                  {error && <div className="login-alert login-alert--error">{error}</div>}

                  <button type="submit" disabled={submitting} className="login-submit">
                    {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                    {submitting ? 'Salvando...' : 'Salvar nova senha'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
