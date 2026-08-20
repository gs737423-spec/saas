import { useEffect, useMemo, useState } from 'react'
import { Loader2, Wallet } from 'lucide-react'
import FinanceHeader from '@/components/financeiro/FinanceHeader'
import FinanceKPIs from '@/components/financeiro/FinanceKPIs'
import FinancialComposition from '@/components/financeiro/FinancialComposition'
import MarketplaceFinanceTable from '@/components/financeiro/MarketplaceFinanceTable'
import TransactionsLedger from '@/components/financeiro/TransactionsLedger'
import ConnectMarketplacePrompt from '@/components/common/ConnectMarketplacePrompt'
import { fillAllMarketplaces, type FinanceOverview, type MarketplaceFinance, type FinanceTransaction } from '@/data/financeShapes'
import { usePeriod } from '@/contexts/PeriodContext'
import { apiFetchJson } from '@/lib/apiFetch'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
  transactions: FinanceTransaction[]
  lastSyncAt: string | null
}

function freshnessLabel(response: FinanceApiResponse): string {
  if (response.overview.source === 'demo') return 'dados demonstrativos'
  if (!response.lastSyncAt) return 'sem sincronização registrada'
  const value = new Date(response.lastSyncAt)
  if (Number.isNaN(value.getTime())) return 'em horário indisponível'
  return `em ${value.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`
}

export default function Financeiro() {
  const { period } = usePeriod()
  const [marketplaceFilter, setMarketplaceFilter] = useState<string | 'all'>('all')
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

  const marketplaceOptions = useMemo(() => [...new Set([
    ...(real?.byMarketplace ?? []).map((row) => row.marketplace),
    ...(real?.transactions ?? []).map((row) => row.marketplace),
  ])].sort((a, b) => a.localeCompare(b, 'pt-BR')), [real])

  useEffect(() => {
    if (marketplaceFilter !== 'all' && !marketplaceOptions.includes(marketplaceFilter)) setMarketplaceFilter('all')
  }, [marketplaceFilter, marketplaceOptions])

  const filtered = useMemo(() => {
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
        marketplaceOptions={marketplaceOptions}
        onMarketplaceFilterChange={setMarketplaceFilter}
        lastUpdated={freshnessLabel(real)}
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
