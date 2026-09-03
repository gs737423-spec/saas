import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('financial transaction ledger pagination', () => {
  it('reads only one tenant-scoped paid-orders page instead of the entire history', async () => {
    const source = await readFile(new URL('../api/dashboard/finance-transactions.ts', import.meta.url), 'utf8')
    expect(source).toContain(".eq('company_id', auth.companyId)")
    expect(source).toContain(".eq('status', 'paid')")
    expect(source).toContain(".eq('analytics_included', true)")
    expect(source).toContain(".range(offset, offset + pageSize - 1)")
    expect(source).not.toContain('fetchAllRows')
  })

  it('keeps the marketplace filter server-side and exposes explicit page totals', async () => {
    const [endpoint, page, ledger] = await Promise.all([
      readFile(new URL('../api/dashboard/finance-transactions.ts', import.meta.url), 'utf8'),
      readFile(new URL('../src/pages/Financeiro.tsx', import.meta.url), 'utf8'),
      readFile(new URL('../src/components/financeiro/TransactionsLedger.tsx', import.meta.url), 'utf8'),
    ])
    expect(endpoint).toContain("firstQueryValue(req.query.channel)")
    expect(page).toContain('/api/dashboard/finance-transactions?')
    expect(page).toContain("query.set('channel', marketplaceFilter)")
    expect(ledger).toContain('pedidos confirmados')
    expect(ledger).toContain('onPageChange')
  })
})
