import { Outlet } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'

// Layout route que só existe pras rotas que realmente precisam de sessão
// (login, redefinição de senha, dashboard). Fica fora do chunk principal —
// carregado sob demanda junto com essas rotas, para o site institucional
// público (/, /privacidade, /termos) nunca baixar o SDK do Supabase.
export default function AuthArea() {
  return (
    <AuthProvider>
      <Outlet />
    </AuthProvider>
  )
}
