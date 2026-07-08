import EstoqueKPIs from '@/components/estoque/EstoqueKPIs'
import EstoqueTable from '@/components/estoque/EstoqueTable'
import EstoqueAlerts from '@/components/estoque/EstoqueAlerts'
import GiroEstoqueChart from '@/components/estoque/GiroEstoqueChart'
import ReposicaoRecomendacoes from '@/components/estoque/ReposicaoRecomendacoes'

export default function Estoque() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <EstoqueKPIs />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
        <EstoqueTable />
        <div className="flex flex-col gap-4">
          <EstoqueAlerts />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <GiroEstoqueChart />
        <ReposicaoRecomendacoes />
      </div>
    </div>
  )
}
