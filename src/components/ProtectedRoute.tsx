import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

// Guarda de rota real: depende da sessão do Supabase Auth (via useAuth),
// nunca de um valor "criado à mão" em storage. Enquanto `loading` for true
// não decide nada — evita tanto mostrar o dashboard sem sessão confirmada
// quanto redirecionar cedo demais um usuário que na verdade está logado.
export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: '#06162B' }}>
        <div
          className="h-8 w-8 animate-spin rounded-full border-2"
          style={{ borderColor: 'rgba(98,183,255,0.25)', borderTopColor: '#3168FF' }}
          role="status"
          aria-label="Verificando sessão"
        />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
