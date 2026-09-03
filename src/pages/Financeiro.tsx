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
import type { MarketplaceOption } from '@/components/financeiro/FinanceHeader'

interface FinanceApiResponse {
  ok: boolean
  overview: FinanceOverview
  byMarketplace: MarketplaceFinance[]
  transactions: FinanceTransaction[]
  lastSyncAt: string | null
}

interface TransactionsApiResponse {
  ok: boolean
  transactions: FinanceTransaction[]
  pagination: { page: number; pageSize: number; totalOrders: number; totalPages: number }
}

const EMPTY_LEDGER: TransactionsApiResponse = {
  ok: true,
  transactions: [],
  pagination: { page: 1, pageSize: 100, totalOrders: 0, totalPages: 0 },
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
  const [ledger, setLedger] = useState<TransactionsApiResponse>(EMPTY_LEDGER)
  const [transactionPage, setTransactionPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [ledgerLoading, setLedgerLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    apiFetchJson<FinanceApiResponse>(`/api/dashboard/finance?${period.query}&include_transactions=false`).then((data) => {
      if (!cancelled) {
        setReal(data)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.query])

  const marketplaceOptions = useMemo<MarketplaceOption[]>(() => (real?.byMarketplace ?? [])
    .map((row) => ({ value: row.channel ?? row.marketplace, label: row.marketplace }))
    .sort((a, b) => a.label.localeCompare(b.label, 'pt-BR')), [real])

  useEffect(() => {
    if (marketplaceFilter !== 'all' && !marketplaceOptions.some((option) => option.value === marketplaceFilter)) setMarketplaceFilter('all')
  }, [marketplaceFilter, marketplaceOptions])

  useEffect(() => {
    setTransactionPage(1)
  }, [period.query, marketplaceFilter])

  useEffect(() => {
    let cancelled = false
    setLedgerLoading(true)
    const query = new URLSearchParams(period.query)
    query.set('page', String(transactionPage))
    query.set('page_size', '100')
    if (marketplaceFilter !== 'all') query.set('channel', marketplaceFilter)
    apiFetchJson<TransactionsApiResponse>(`/api/dashboard/finance-transactions?${query.toString()}`).then((data) => {
      if (!cancelled) {
        setLedger(data?.ok ? data : EMPTY_LEDGER)
        setLedgerLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [period.query, marketplaceFilter, transactionPage])

  const filtered = useMemo(() => {
    const source = fillAllMarketplaces(real?.byMarketplace ?? [])
    return marketplaceFilter === 'all' ? source : source.filter((m) => (m.channel ?? m.marketplace) === marketplaceFilter)
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
    return <ConnectMarketplacePrompt icon={Wallet} title="Conecte um marketplace pra ver o financeiro" description="Faturamento e extrato aparecem após a sincronização; reembolsos só são exibidos quando a origem os informa explicitamente." />
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

      <TransactionsLedger
        transactions={ledger.transactions}
        pagination={ledger.pagination}
        loading={ledgerLoading}
        onPageChange={setTransactionPage}
      />
    </div>
  )
}
