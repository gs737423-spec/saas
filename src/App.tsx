import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { ConnectionProvider } from '@/contexts/ConnectionContext'
import { PeriodProvider } from '@/contexts/PeriodContext'
import { useAuth } from '@/contexts/AuthContext'
import BottomNav from '@/components/layout/BottomNav'
import TopNav from '@/components/layout/TopNav'
import Dashboard from '@/pages/Dashboard'
import Produtos from '@/pages/Produtos'
import Estoque from '@/pages/Estoque'
import Importacoes from '@/pages/Importacoes'
import Marketplaces from '@/pages/Marketplaces'
import Placeholder from '@/pages/Placeholder'
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
    <div className="app-bg min-h-screen overflow-x-hidden">
      {/* Orbs — fundo vivo */}
      <div className="app-bg-orbs">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
      </div>
      {/* Linha de dados — fundo vivo, camada 2 */}
      <div className="app-bg-lines" aria-hidden="true">
        <div className="bg-line bg-line-1" />
      </div>
      <TopNav />
      <main className="pt-14 md:pt-16">
        <div className="mx-auto max-w-[1920px] px-3 pb-24 pt-2.5 sm:px-6 md:pb-6 md:pt-3 lg:px-8 xl:px-10">
          <div key={location.pathname} className="page-transition">
            <Routes location={location}>
              <Route index element={<Dashboard />} />
              <Route path="produtos" element={<Produtos />} />
              <Route path="produto/:sku" element={<ProdutoDetalhe />} />
              <Route path="marketplaces" element={<Marketplaces />} />
              <Route path="estoque" element={<Estoque />} />
              <Route path="importacoes" element={<Importacoes />} />
              <Route path="financeiro" element={<Placeholder title="Financeiro" description="Fluxo de caixa, DRE simplificado, custos por marketplace e projeções financeiras consolidadas de todos os canais de venda." />} />
              <Route path="marketing" element={<Placeholder title="Marketing" description="Desempenho de campanhas, ROI de anúncios patrocinados e recomendações de investimento por produto e canal." />} />
              <Route path="avaliacoes" element={<Placeholder title="Avaliações" description="Monitoramento de reviews e reputação em todos os marketplaces, com alertas de avaliações negativas em tempo real." />} />
              <Route path="relatorios" element={<Placeholder title="Relatórios" description="Relatórios customizáveis de vendas, produtos e performance, com exportação e agendamento automático." />} />
              <Route path="configuracoes" element={<Placeholder title="Configurações" description="Preferências da conta, integrações de marketplace, permissões de equipe e configurações de notificação." />} />
              <Route path="*" element={<Navigate to="/app" replace />} />
            </Routes>
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
    </PeriodProvider>
    </ConnectionProvider>
  )
}
