import { describe, expect, it } from 'vitest'
import { summarizeFeeCoverage } from '../src/server/analytics/feeQuality'
import { hasKnownNetValue } from '../src/data/financeShapes'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('summarizeFeeCoverage', () => {
  it('never treats unknown fees as a known zero', () => {
    expect(summarizeFeeCoverage([
      { fee_amount: 0, fee_status: 'unknown' },
      { fee_amount: null, fee_status: 'unknown' },
    ])).toEqual({ status: 'unknown', total: 0, knownOrders: 0, totalOrders: 2 })
  })

  it('marks mixed coverage as partial and sums only informed amounts', () => {
    expect(summarizeFeeCoverage([
      { fee_amount: 12.5, fee_status: 'known' },
      { fee_amount: 0, fee_status: 'unknown' },
    ])).toEqual({ status: 'partial', total: 12.5, knownOrders: 1, totalOrders: 2 })
  })

  it('marks complete coverage as known, including a legitimate zero fee', () => {
    expect(summarizeFeeCoverage([
      { fee_amount: 0, fee_status: 'known' },
      { fee_amount: '8.40', fee_status: 'known' },
    ])).toEqual({ status: 'known', total: 8.4, knownOrders: 2, totalOrders: 2 })
  })

  it('propagates fee_status from storage into both financial APIs', () => {
    const summary = readFileSync(resolve(__dirname, '../api/dashboard/summary.ts'), 'utf8')
    const finance = readFileSync(resolve(__dirname, '../api/dashboard/finance.ts'), 'utf8')
    expect(summary).toContain("fee_amount, fee_status")
    expect(finance).toContain("fee_amount, fee_status")
    expect(summary).toContain('feeDataStatus: feeCoverage.status')
    expect(finance).toContain('feeDataStatus: feeCoverage.status')
  })

  it('does not render unknown transaction fees or net values as currency', () => {
    const ledger = readFileSync(resolve(__dirname, '../src/components/financeiro/TransactionsLedger.tsx'), 'utf8')
    expect(ledger).toContain("t.feeDataStatus === 'known' ? `R$ ${brl(t.discount)}` : '—'")
    expect(ledger).toContain("t.feeDataStatus === 'known' ? `R$ ${brl(t.net)}` : 'Indisponível'")
  })

  it('requires complete fee and refund coverage before presenting net value', () => {
    expect(hasKnownNetValue({ feeDataStatus: 'known', refundDataStatus: 'known' })).toBe(true)
    expect(hasKnownNetValue({ feeDataStatus: 'partial', refundDataStatus: 'known' })).toBe(false)
    expect(hasKnownNetValue({ feeDataStatus: 'known', refundDataStatus: 'unknown' })).toBe(false)
  })

  it('never converts cancelled orders into refunds or refund transactions', () => {
    const summary = readFileSync(resolve(__dirname, '../api/dashboard/summary.ts'), 'utf8')
    const finance = readFileSync(resolve(__dirname, '../api/dashboard/finance.ts'), 'utf8')
    expect(summary).not.toContain("orders.filter((o) => o.status === 'cancelled')")
    expect(finance).not.toContain('const cancelled =')
    expect(finance).toContain("if (o.refund_status !== 'known' || refundAmount <= 0) return []")
    expect(finance).toContain("type: 'Estorno' as const")
  })

  it('marks Mercado Livre sale_fee coverage as partial, not complete', () => {
    const sync = readFileSync(resolve(__dirname, '../src/server/integrations/mercadolivre/sync.ts'), 'utf8')
    expect(sync).toContain("feeStatus: 'partial'")
    expect(sync).not.toContain("feeStatus: 'known'")
  })

  it('corrects historical Mercado Livre fee coverage without deleting amounts', () => {
    const migration = readFileSync(resolve(__dirname, '../supabase/migrations/028_correct_mercadolivre_fee_quality.sql'), 'utf8')
    expect(migration).toContain("set fee_status = 'partial'")
    expect(migration).toContain("where provider = 'mercadolivre'")
    expect(migration).not.toMatch(/set\s+fee_amount\s*=/i)
  })
})
