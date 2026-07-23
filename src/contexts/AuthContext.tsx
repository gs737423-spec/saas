import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

interface AuthResult {
  error: string | null
}

interface AuthContextType {
  user: User | null
  session: Session | null
  isAuthenticated: boolean
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Mensagem sempre genérica — não revela se o e-mail existe, se a senha está
// errada, ou se a conta está desativada (evita enumeração de usuários).
const GENERIC_LOGIN_ERROR = 'Não foi possível entrar com as credenciais informadas.'
const GENERIC_NETWORK_ERROR = 'Não foi possível concluir o acesso agora. Verifique sua conexão e tente novamente.'
const RATE_LIMIT_ERROR = 'Muitas tentativas. Aguarde alguns instantes antes de tentar novamente.'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    // SIGNED_IN / SIGNED_OUT / TOKEN_REFRESHED / PASSWORD_RECOVERY — o SDK do
    // Supabase já assina e renova o token sozinho (autoRefreshToken: true em
    // supabaseClient.ts); aqui só refletimos a sessão atual no contexto.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!active) return
      setSession(newSession)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      })
      if (error) {
        // 429 = rate limit do próprio Supabase Auth (real, no servidor) —
        // distinguir isso da credencial errada não abre brecha de
        // enumeração, só informa que a tentativa foi limitada.
        if (error.status === 429) return { error: RATE_LIMIT_ERROR }
        return { error: GENERIC_LOGIN_ERROR }
      }
      return { error: null }
    } catch {
      return { error: GENERIC_NETWORK_ERROR }
    }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const resetPassword = useCallback(async (email: string): Promise<AuthResult> => {
    try {
      await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      // O Supabase já responde de forma genérica (não confirma existência de
      // conta) — repassamos a mesma mensagem neutra independentemente do
      // resultado real, para não abrir brecha de enumeração no futuro caso
      // essa API mude de comportamento.
      return { error: null }
    } catch {
      return { error: GENERIC_NETWORK_ERROR }
    }
  }, [])

  const value: AuthContextType = {
    user: session?.user ?? null,
    session,
    isAuthenticated: !!session,
    loading,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
