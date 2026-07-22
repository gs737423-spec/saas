import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ConnectionProvider } from '@/contexts/ConnectionContext'
import { PeriodProvider } from '@/contexts/PeriodContext'
import { InventorySettingsProvider } from '@/contexts/InventorySettingsContext'
import { useAuth } from '@/contexts/AuthContext'
import BottomNav from '@/components/layout/BottomNav'
import TopNav from '@/components/layout/TopNav'
import Dashboard from '@/pages/Dashboard'
import Produtos from '@/pages/Produtos'
import Estoque from '@/pages/Estoque'
import Importacoes from '@/pages/Importacoes'
import Marketplaces from '@/pages/Marketplaces'
import Financeiro from '@/pages/Financeiro'
import Placeholder from '@/pages/Placeholder'
import Configuracoes from '@/pages/Configuracoes'
import ProdutoDetalhe from '@/pages/ProdutoDetalhe'

// Shell autenticado da plataforma. Montado em `/app/*` (ver main.tsx). O site
// institucional público vive em `/` e não passa por aqui. Rotas filhas são
// relativas ao base `/app`.
export default function App() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return (
    <ConnectionProvider>
    <PeriodProvider>
    <InventorySettingsProvider>
    <div className="app-bg app-shell overflow-x-hidden">
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
        <div className="app-page-container pb-24 pt-2.5 md:pb-6 md:pt-3">
          <div key={location.pathname} className="page-transition">
            <Routes location={location}>
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="produto/:sku" element={<ProdutoDetalhe />} />
              <Route path="marketplaces" element={<Marketplaces />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="importacoes" element={<Importacoes />} />
              <Route path="financeiro" element={<Financeiro />} />
              <Route path="marketing" element={<Placeholder title="Marketing" description="Desempenho de campanhas, ROI de anúncios patrocinados e recomendações de investimento por produto e canal." />} />
              <Route path="avaliacoes" element={<Placeholder title="Avaliações" description="Monitoramento de reviews e reputação em todos os marketplaces, com alertas de avaliações negativas em tempo real." />} />
              <Route path="relatorios" element={<Placeholder title="Relatórios" description="Relatórios customizáveis de vendas, produtos e performance, com exportação e agendamento automático." />} />
              <Route path="configuracoes" element={<Configuracoes />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
    </InventorySettingsProvider>
    </PeriodProvider>
    </ConnectionProvider>
  )
}
