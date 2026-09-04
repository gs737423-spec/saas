import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('dashboard financial snapshot', () => {
  it('derives KPIs and marketplace lines from one finance response', async () => {
    const [dashboard, breakdown] = await Promise.all([
      readFile(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/dashboard/RealMarketplaceBreakdown.tsx', import.meta.url), 'utf8'),
    ])
    expect(dashboard).toContain('include_dashboard_summary=true')
    expect(dashboard).not.toContain('/api/dashboard/summary?')
    expect(dashboard).toContain('<RealMarketplaceBreakdown data={finance} />')
    expect(breakdown).toContain('const data = suppliedData !== undefined ? suppliedData : fetchedData')
    expect(breakdown).not.toContain('setData(suppliedData)')
  })

  it('computes dashboard comparisons from the same paid orders snapshot', async () => {
    const source = await readFile(new URL('../api/dashboard/finance.ts', import.meta.url), 'utf8')
    expect(source).toContain("req.query.include_dashboard_summary === 'true'")
    expect(source).toContain('ordersCount: includeDashboardSummary ? ordersCount : undefined')
    expect(source).toContain('grossRevenueChangePct: includeDashboardSummary ? grossRevenueChangePct : undefined')
  })

  it('uses the compact SQL aggregate whenever the transaction ledger is not requested', async () => {
    const [source, migration] = await Promise.all([
      readFile(new URL('../api/dashboard/finance.ts', import.meta.url), 'utf8'),
      readFile(new URL('../supabase/migrations/032_dashboard_finance_aggregate_and_log_index.sql', import.meta.url), 'utf8'),
    ])
    expect(source).toContain("rpc('dashboard_finance_aggregate'")
    expect(source).toContain('if (!includeTransactions)')
    expect(migration).toContain('create or replace function public.dashboard_finance_aggregate')
    expect(migration).toContain('orders_company_connection_paid_analytics_ordered_idx')
    expect(migration).toContain('sync_logs_company_created_at_idx')
  })

  it('uses only closed days for marketplace comparisons', async () => {
    const source = await readFile(new URL('../api/dashboard/finance.ts', import.meta.url), 'utf8')
    expect(source).toContain('[1, 2, 8, 31, 366]')
    expect(source).toContain('const latestClosedDayKey = saoPauloDaysAgoKey(1)')
  })

  it('does not rescale real financial KPIs with the selected period', async () => {
    const dashboard = await readFile(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8')
    const kpiCards = await readFile(new URL('../src/components/dashboard/KPICards.tsx', import.meta.url), 'utf8')
    expect(dashboard).toContain('isReal: true')
    expect(kpiCards).toContain('if (kpi.isReal)')
  })
})
