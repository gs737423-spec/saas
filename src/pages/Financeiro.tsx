import { useMemo, useState } from 'react'
import FinanceHeader from '@/components/financeiro/FinanceHeader'
import FinanceKPIs from '@/components/financeiro/FinanceKPIs'
import FinancialComposition from '@/components/financeiro/FinancialComposition'
import MarketplaceFinanceTable from '@/components/financeiro/MarketplaceFinanceTable'
import TransactionsLedger from '@/components/financeiro/TransactionsLedger'
import { marketplaceFinance, scaleMarketplaceFinance, buildFinanceOverview, financeTransactions } from '@/data/financeData'
import type { Marketplace } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'

export default function Financeiro() {
  const { period } = usePeriod()
  const [marketplaceFilter, setMarketplaceFilter] = useState<Marketplace | 'all'>('all')

  const scaled = useMemo(() => scaleMarketplaceFinance(marketplaceFinance, period), [period])
  const filtered = useMemo(
    () => (marketplaceFilter === 'all' ? scaled : scaled.filter((m) => m.marketplace === marketplaceFilter)),
    [scaled, marketplaceFilter]
  )
  const overview = useMemo(() => buildFinanceOverview(filtered), [filtered])
  const transactions = useMemo(
    () => (marketplaceFilter === 'all' ? financeTransactions : financeTransactions.filter((t) => t.marketplace === marketplaceFilter)),
    [marketplaceFilter]
  )

  return (
    <div className="space-y-2 sm:space-y-2.5">
      <FinanceHeader
        marketplaceFilter={marketplaceFilter}
        onMarketplaceFilterChange={setMarketplaceFilter}
        lastUpdated="há poucos minutos"
        isDemo={overview.source === 'demo'}
      />

      <div className="motion-block-in">
        <FinanceKPIs overview={overview} />
      </div>

      <p className="text-[11px] text-text-muted">
        Valor após os descontos dos canais de venda. Não representa lucro e não inclui impostos próprios, folha, aluguel, mídia, logística interna ou demais despesas da empresa.
      </p>

      <div className="motion-block-in motion-block-in-2">
        <FinancialComposition overview={overview} />
      </div>

      <div className="motion-block-in motion-block-in-3">
        <MarketplaceFinanceTable items={filtered} />
      </div>

      <TransactionsLedger transactions={transactions} />
    </div>
  )
}
