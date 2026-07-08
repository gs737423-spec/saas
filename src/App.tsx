import { Routes, Route } from 'react-router-dom'
import SideRail from '@/components/layout/SideRail'
import BottomNav from '@/components/layout/BottomNav'
import TopNav from '@/components/layout/TopNav'
import Dashboard from '@/pages/Dashboard'
import Produtos from '@/pages/Produtos'
import Estoque from '@/pages/Estoque'
import Importacoes from '@/pages/Importacoes'
import Marketplaces from '@/pages/Marketplaces'
import Placeholder from '@/pages/Placeholder'

export default function App() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-bg-primary">
      <SideRail />
      <TopNav />
      <main className="pt-14 md:ml-16 md:pt-16">
        <div className="mx-auto max-w-[1600px] px-3 pb-24 pt-3 sm:px-6 sm:pt-4 md:pb-4 lg:px-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/produtos" element={<Produtos />} />
            <Route path="/marketplaces" element={<Marketplaces />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/importacoes" element={<Importacoes />} />
            <Route path="/financeiro" element={<Placeholder title="Financeiro" description="Fluxo de caixa, DRE simplificado, custos por marketplace e projeções financeiras consolidadas de todos os canais de venda." />} />
            <Route path="/marketing" element={<Placeholder title="Marketing" description="Desempenho de campanhas, ROI de anúncios patrocinados e recomendações de investimento por produto e canal." />} />
            <Route path="/avaliacoes" element={<Placeholder title="Avaliações" description="Monitoramento de reviews e reputação em todos os marketplaces, com alertas de avaliações negativas em tempo real." />} />
            <Route path="/relatorios" element={<Placeholder title="Relatórios" description="Relatórios customizáveis de vendas, produtos e performance, com exportação e agendamento automático." />} />
            <Route path="/configuracoes" element={<Placeholder title="Configurações" description="Preferências da conta, integrações de marketplace, permissões de equipe e configurações de notificação." />} />
          </Routes>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
