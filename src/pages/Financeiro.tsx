import { useEffect, useMemo, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import FinanceHeader from '@/components/financeiro/FinanceHeader'
import FinanceKPIs from '@/components/financeiro/FinanceKPIs'
import FinancialComposition from '@/components/financeiro/FinancialComposition'
import MarketplaceFinanceTable from '@/components/financeiro/MarketplaceFinanceTable'
import TransactionsLedger from '@/components/financeiro/TransactionsLedger'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import { fillAllMarketplaces, type FinanceOverview, type MarketplaceFinance, type FinanceTransaction } from '@/data/financeShapes'
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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<FinanceApiResponse>(`/api/dashboard/finance?days=${period.days}`).then((data) => {
      if (!cancelled) {
        setReal(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.days])

  const filtered = useMemo(() => {
    // Sempre os 4 canais, na ordem canônica — canal sem pedido no período
    // vem zerado, nunca some da tela (ver decisão 2026-08-06).
    const source = fillAllMarketplaces(real?.byMarketplace ?? [])
    return marketplaceFilter === 'all' ? source : source.filter((m) => m.marketplace === marketplaceFilter)
  }, [real, marketplaceFilter])

  const transactions = useMemo(() => {
    const source = real?.transactions ?? []
    return marketplaceFilter === 'all' ? source : source.filter((t) => t.marketplace === marketplaceFilter)
  }, [real, marketplaceFilter])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-sm text-text-muted">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando...
      </div>
    )
  }

  if (!real || !real.ok || (real.overview.source !== 'real' && real.overview.source !== 'demo')) {
    return <ConnectMarketplacePrompt icon={Wallet} title="Conecte um marketplace pra ver o financeiro" description="Faturamento, estornos e extrato reais aparecem aqui assim que houver pedido pago sincronizado." />
  }

  return (
    <div className="enterprise-page">
      <FinanceHeader
        marketplaceFilter={marketplaceFilter}
        onMarketplaceFilterChange={setMarketplaceFilter}
        lastUpdated="há poucos minutos"
        isDemo={false}
      />

      <div className="motion-block-in">
        <FinanceKPIs overview={real.overview} />
      </div>

      <div className="motion-block-in motion-block-in-2">
        <FinancialComposition overview={real.overview} />
      </div>

      <div className="motion-block-in motion-block-in-3">
        <MarketplaceFinanceTable items={filtered} />
      </div>

      <TransactionsLedger transactions={transactions} />
    </div>
  )
}
