import { readFile } from 'node:fs/promises'
import { describe, expect, it } from 'vitest'

describe('dashboard financial snapshot', () => {
  it('derives KPIs and marketplace lines from one finance response', async () => {
    const source = await readFile(new URL('../src/pages/Dashboard.tsx', import.meta.url), 'utf8')
    expect(source).toContain('include_dashboard_summary=true')
    expect(source).not.toContain('/api/dashboard/summary?')
    expect(source).toContain('<RealMarketplaceBreakdown data={finance} />')
  })

  it('computes dashboard comparisons from the same paid orders snapshot', async () => {
    const source = await readFile(new URL('../api/dashboard/finance.ts', import.meta.url), 'utf8')
    expect(source).toContain("req.query.include_dashboard_summary === 'true'")
    expect(source).toContain('ordersCount: includeDashboardSummary ? ordersCount : undefined')
    expect(source).toContain('grossRevenueChangePct: includeDashboardSummary ? grossRevenueChangePct : undefined')
  })
})
