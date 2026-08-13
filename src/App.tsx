import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ConnectionProvider } from '@/contexts/ConnectionContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { PeriodProvider } from '@/contexts/PeriodContext'
import { InventorySettingsProvider } from '@/contexts/InventorySettingsContext'
import { DemoModeProvider } from '@/contexts/DemoModeContext'
import { ToastProvider } from '@/contexts/ToastContext'
import { ViewAsProvider } from '@/contexts/ViewAsContext'
import BottomNav from '@/components/layout/BottomNav'
import TopNav from '@/components/layout/TopNav'
import Dashboard from '@/pages/Dashboard'
import Produtos from '@/pages/Produtos'
import Estoque from '@/pages/Estoque'
import Importacoes from '@/pages/Importacoes'
import Marketplaces from '@/pages/Marketplaces'
import Financeiro from '@/pages/Financeiro'
import Relatorios from '@/pages/Relatorios'
import Configuracoes from '@/pages/Configuracoes'
import ProdutoDetalhe from '@/pages/ProdutoDetalhe'
import Suporte from '@/pages/Suporte'
import Admin from '@/pages/Admin'
import AdminLeads from '@/pages/AdminLeads'
import AdminClients from '@/pages/AdminClients'
import AdminCompany from '@/pages/AdminCompany'
import AdminSupport from '@/pages/AdminSupport'
import AdminSecurity from '@/pages/AdminSecurity'
import { useIdleLogout } from '@/hooks/useIdleLogout'
import ErrorBoundary from '@/components/common/ErrorBoundary'

// Shell autenticado da plataforma. Montado em `/app/*` sob <ProtectedRoute>
// (ver main.tsx) — a guarda de sessão real já aconteceu lá, este componente
// não precisa (e não deve) checar autenticação de novo. O site institucional
// público vive em `/` e não passa por aqui. Rotas filhas são relativas ao
// base `/app`.
export default function App() {
  const location = useLocation()
  const isDesktopWorkspaceRoute = ['/app', '/app/marketplaces', '/app/produtos', '/app/estoque'].includes(location.pathname)
  useIdleLogout()

  return (
    <ThemeProvider>
    <ToastProvider>
    <ViewAsProvider>
    <DemoModeProvider>
    <ConnectionProvider>
    <PeriodProvider>
    <InventorySettingsProvider>
    <div className={`app-bg app-shell overflow-x-hidden ${isDesktopWorkspaceRoute ? 'app-shell--workspace' : ''}`}>
      {/* Fundo ambiente — 1 base estática + 1 grid estático + 3 glows (só 1 anima). Ver index.css .app-bg-subtle. */}
      <div className="app-bg-subtle" aria-hidden="true">
        <div className="bg-glow bg-glow-static" />
        <div className="bg-glow bg-glow-accent" />
        <div className="bg-glow bg-glow-moving" />
      </div>
      <TopNav />
      {/* Offset via var(--app-header-height) — sempre igual à altura real do
          TopNav (mesmo token dos dois lados), nunca um valor fixo duplicado
          por página. Ver §21: header height token. */}
      <main className="app-main" style={{ paddingTop: 'var(--app-header-height)' }}>
        <div className={`app-page-container pb-24 pt-2.5 md:pb-6 md:pt-3 ${isDesktopWorkspaceRoute ? 'app-page-container--workspace' : ''}`}>
          <div key={location.pathname} className={`page-transition ${isDesktopWorkspaceRoute ? 'page-transition--workspace' : ''}`}>
            <ErrorBoundary key={location.pathname}>
              <Routes location={location}>
                <Route index element={<Dashboard />} />
                <Route path="produtos" element={<Produtos />} />
                <Route path="produto/:sku" element={<ProdutoDetalhe />} />
                <Route path="marketplaces" element={<Marketplaces />} />
                <Route path="estoque" element={<Estoque />} />
                <Route path="importacoes" element={<Importacoes />} />
                <Route path="financeiro" element={<Financeiro />} />
                <Route path="relatorios" element={<Relatorios />} />
                <Route path="configuracoes" element={<Configuracoes />} />
                <Route path="suporte" element={<Suporte />} />
                <Route path="admin" element={<Admin />} />
                <Route path="admin/solicitacoes" element={<AdminLeads />} />
                <Route path="admin/clientes" element={<AdminClients />} />
                <Route path="admin/empresa/:id" element={<AdminCompany />} />
                <Route path="admin/suporte" element={<AdminSupport />} />
                <Route path="admin/seguranca" element={<AdminSecurity />} />
                <Route path="*" element={<Navigate to="/app" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
    </InventorySettingsProvider>
    </PeriodProvider>
    </ConnectionProvider>
    </DemoModeProvider>
    </ViewAsProvider>
    </ToastProvider>
    </ThemeProvider>
  )
}
