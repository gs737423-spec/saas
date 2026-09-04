import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { vtexPaymentTransactionIds, vtexRefundSnapshot } from '../src/server/integrations/vtex/refunds'
import { shouldEnrichVtexRefund } from '../src/server/integrations/vtex/sync'

describe('VTEX financial refund enrichment', () => {
  it('deduplicates only active payment transaction ids', () => {
    expect(vtexPaymentTransactionIds({ paymentData: { transactions: [
      { transactionId: 'TX-1', isActive: true },
      { transactionId: 'TX-1', isActive: true },
      { transactionId: 'TX-2', isActive: false },
    ] } })).toEqual(['TX-1'])
  })

  it('converts explicit VTEX cent values to a known BRL refund snapshot', () => {
    expect(vtexRefundSnapshot([
      { totalRefunds: 1_250, refundingDate: '2026-09-03T12:00:00.000Z' },
      { totalRefunds: 50, refundingDate: '2026-09-04T12:00:00.000Z' },
    ])).toEqual({ refundAmount: 13, refundStatus: 'known', refundUpdatedAt: '2026-09-04T12:00:00.000Z' })
  })

  it('never converts an absent or invalid total into a false zero refund', () => {
    expect(vtexRefundSnapshot([]).refundStatus).toBe('unknown')
    expect(vtexRefundSnapshot([{ totalRefunds: null }]).refundStatus).toBe('unknown')
    expect(vtexRefundSnapshot([{ totalRefunds: -1 }]).refundStatus).toBe('unknown')
  })

  it('limits extra payment reads to recent paid orders', () => {
    const now = Date.parse('2026-09-04T12:00:00.000Z')
    expect(shouldEnrichVtexRefund({ status: 'invoiced', creationDate: '2026-09-01T00:00:00.000Z' }, now)).toBe(true)
    expect(shouldEnrichVtexRefund({ status: 'canceled', creationDate: '2026-09-01T00:00:00.000Z' }, now)).toBe(false)
    expect(shouldEnrichVtexRefund({ status: 'invoiced', creationDate: '2026-05-01T00:00:00.000Z' }, now)).toBe(false)
  })

  it('keeps a confirmed refund when a later VTEX read is unknown', () => {
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/034_preserve_confirmed_order_financial_snapshots.sql'),
      'utf8',
    )

    expect(migration).toContain("refund_status in ('known', 'partial')")
    expect(migration).toContain('case when v_preserve_refund then refund_amount')
    expect(migration).toContain('case when v_preserve_refund then refund_status')
  })
})
