export type RefundDataStatus = 'known' | 'partial' | 'unknown'

export interface RefundBearingOrder {
  refund_amount: number | string | null
  refund_status?: string | null
}

export interface RefundCoverage {
  status: RefundDataStatus
  total: number
  knownOrders: number
  affectedOrders: number
  totalOrders: number
}

/** Soma somente valores de reembolso informados pelo provedor. Status de
 * pedido (inclusive cancelled) nunca participa deste cálculo. */
export function summarizeRefundCoverage(orders: RefundBearingOrder[]): RefundCoverage {
  let total = 0
  let knownOrders = 0
  let affectedOrders = 0
  let hasPartial = false

  for (const order of orders) {
    const amount = order.refund_amount === null ? Number.NaN : Number(order.refund_amount)
    if (order.refund_status === 'known' && Number.isFinite(amount) && amount >= 0) {
      total += amount
      knownOrders += 1
      if (amount > 0) affectedOrders += 1
    } else if (order.refund_status === 'partial') {
      hasPartial = true
      if (Number.isFinite(amount) && amount >= 0) {
        total += amount
        if (amount > 0) affectedOrders += 1
      }
    }
  }

  const totalOrders = orders.length
  const status: RefundDataStatus = totalOrders > 0 && knownOrders === totalOrders
    ? 'known'
    : knownOrders > 0 || hasPartial
      ? 'partial'
      : 'unknown'

  return { status, total, knownOrders, affectedOrders, totalOrders }
}
