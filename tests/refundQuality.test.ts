import { describe, expect, it } from 'vitest'
import { summarizeRefundCoverage } from '../src/server/analytics/refundQuality'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

describe('summarizeRefundCoverage', () => {
  it('preserves unknown instead of treating missing refunds as zero', () => {
    expect(summarizeRefundCoverage([
      { refund_amount: null, refund_status: 'unknown' },
      { refund_amount: 0, refund_status: 'unknown' },
    ])).toEqual({ status: 'unknown', total: 0, knownOrders: 0, affectedOrders: 0, totalOrders: 2 })
  })

  it('counts known zeroes and confirmed refund amounts', () => {
    expect(summarizeRefundCoverage([
      { refund_amount: 0, refund_status: 'known' },
      { refund_amount: '18.50', refund_status: 'known' },
    ])).toEqual({ status: 'known', total: 18.5, knownOrders: 2, affectedOrders: 1, totalOrders: 2 })
  })

  it('marks mixed coverage as partial', () => {
    expect(summarizeRefundCoverage([
      { refund_amount: 8, refund_status: 'known' },
      { refund_amount: null, refund_status: 'unknown' },
    ])).toEqual({ status: 'partial', total: 8, knownOrders: 1, affectedOrders: 1, totalOrders: 2 })
  })

  it('propagates refund coverage through persistence and financial APIs', () => {
    const persistence = readFileSync(resolve(__dirname, '../src/server/integrations/orderIdentity.ts'), 'utf8')
    const summary = readFileSync(resolve(__dirname, '../api/dashboard/summary.ts'), 'utf8')
    const finance = readFileSync(resolve(__dirname, '../api/dashboard/finance.ts'), 'utf8')
    expect(persistence).toContain('refund_status: input.refundStatus')
    expect(summary).toContain('summarizeRefundCoverage(paid)')
    expect(finance).toContain('summarizeRefundCoverage(paid)')
  })

  it('keeps migration 027 additive, constrained and without historical fabrication', () => {
    const migration = readFileSync(resolve(__dirname, '../supabase/migrations/027_order_refund_quality.sql'), 'utf8')
    expect(migration).toContain("add column if not exists refund_status text not null default 'unknown'")
    expect(migration).toContain("check (refund_status in ('known', 'unknown', 'partial'))")
    expect(migration).toContain('check (refund_amount is null or refund_amount >= 0)')
    expect(migration).not.toMatch(/update\s+public\.orders/i)
    expect(migration).not.toMatch(/delete\s+from|drop\s+column/i)
  })
})
