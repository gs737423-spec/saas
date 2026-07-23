import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import SitePage from '@/site/SitePage'
import './index.css'

// Site institucional é a landing pública → carregado de imediato (LCP).
// Dashboard (recharts + páginas) e demais rotas entram sob demanda, para o
// visitante do site não baixar o bundle pesado da plataforma.
const App = lazy(() => import('./App'))
const Login = lazy(() => import('@/pages/Login'))
const ResetPassword = lazy(() => import('@/pages/ResetPassword'))
const LegalPage = lazy(() => import('@/site/LegalPage'))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={null}>
          <Routes>
            {/* Site institucional público */}
            <Route path="/" element={<SitePage />} />
            <Route path="/privacidade" element={<LegalPage variant="privacidade" />} />
            <Route path="/termos" element={<LegalPage variant="termos" />} />
            {/* Login da plataforma */}
            <Route path="/login" element={<Login />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            {/* Área autenticada (dashboard e subrotas) — sessão real do Supabase Auth */}
            <Route path="/app/*" element={<ProtectedRoute><App /></ProtectedRoute>} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
