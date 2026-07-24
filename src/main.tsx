import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SitePage from '@/site/SitePage'
import './index.css'

// Site institucional é a landing pública → carregado de imediato (LCP), sem
// AuthProvider nem SDK do Supabase (nenhuma dessas rotas chama useAuth).
// Dashboard, login e recuperação de senha entram sob demanda, cada um já
// dentro de AuthArea (layout route que traz o AuthProvider) — assim o
// visitante do site institucional nunca baixa o bundle do Supabase.
// ProtectedRoute também precisa ser lazy: ele importa useAuth (→ Supabase),
// então um import estático dele aqui puxaria o SDK de volta pro chunk
// principal mesmo com AuthArea lazy.
const App = lazy(() => import('./App'))
const Login = lazy(() => import('@/pages/Login'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const LegalPage = lazy(() => import('@/site/LegalPage'))
const AuthArea = lazy(() => import('@/AuthArea'))
const ProtectedRoute = lazy(() => import('@/components/ProtectedRoute'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Suspense fallback={null}>
        <Routes>
          {/* Site institucional público */}
          <Route path="/" element={<SitePage />} />
          <Route path="/privacidade" element={<LegalPage variant="privacidade" />} />
          <Route path="/termos" element={<LegalPage variant="termos" />} />
          {/* Rotas com sessão real do Supabase Auth — AuthProvider só carrega aqui */}
          <Route element={<AuthArea />}>
            <Route path="/login" element={<Login />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/app/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  </StrictMode>,
)
