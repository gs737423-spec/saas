import { useEffect, useMemo, useState } from 'react'
import FinanceHeader from '@/components/financeiro/FinanceHeader'
import FinanceKPIs from '@/components/financeiro/FinanceKPIs'
import FinancialComposition from '@/components/financeiro/FinancialComposition'
import MarketplaceFinanceTable from '@/components/financeiro/MarketplaceFinanceTable'
import TransactionsLedger from '@/components/financeiro/TransactionsLedger'
import { marketplaceFinance, scaleMarketplaceFinance, buildFinanceOverview, financeTransactions } from '@/data/financeData'
import type { FinanceOverview, MarketplaceFinance, FinanceTransaction } from '@/data/financeShapes'
import type { Marketplace } from '@/data/mockData'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
  transactions: FinanceTransaction[]
}

export default function Financeiro() {
  const { period } = usePeriod()
  const [marketplaceFilter, setMarketplaceFilter] = useState<Marketplace | 'all'>('all')
  const [real, setReal] = useState<FinanceApiResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    apiFetchJson<FinanceApiResponse>(`/api/dashboard/finance?days=${period.days}`).then((data) => {
      if (!cancelled) setReal(data)
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  const isReal = real?.ok && real.overview.source === 'real'

  const scaledDemo = useMemo(() => scaleMarketplaceFinance(marketplaceFinance, period), [period])

  const filtered = useMemo(() => {
    const source = isReal ? real!.byMarketplace : scaledDemo
    return marketplaceFilter === 'all' ? source : source.filter((m) => m.marketplace === marketplaceFilter)
  }, [isReal, real, scaledDemo, marketplaceFilter])

  const overview = useMemo(() => {
    if (isReal) return real!.overview
    return buildFinanceOverview(filtered)
  }, [isReal, real, filtered])

  const transactions = useMemo(() => {
    const source = isReal ? real!.transactions : financeTransactions
    return marketplaceFilter === 'all' ? source : source.filter((t) => t.marketplace === marketplaceFilter)
  }, [isReal, real, marketplaceFilter])

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
