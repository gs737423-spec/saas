export type FeeDataStatus = 'known' | 'partial' | 'unknown'

export interface FeeBearingOrder {
  fee_amount: number | string | null
  fee_status?: string | null
}

export interface FeeCoverage {
  status: FeeDataStatus
  total: number
  knownOrders: number
  totalOrders: number
}

/** Soma apenas taxas explicitamente conhecidas e carrega a cobertura junto.
 *  Zero sem cobertura nunca pode ser interpretado como "sem taxas". */
export function summarizeFeeCoverage(orders: FeeBearingOrder[]): FeeCoverage {
  let total = 0
  let knownOrders = 0
  let hasPartial = false

  for (const order of orders) {
    const amount = order.fee_amount === null ? Number.NaN : Number(order.fee_amount)
    if (order.fee_status === 'known' && Number.isFinite(amount)) {
      total += amount
      knownOrders += 1
    } else if (order.fee_status === 'partial') {
      hasPartial = true
      if (Number.isFinite(amount)) total += amount
    }
  }

  const totalOrders = orders.length
  const status: FeeDataStatus = totalOrders > 0 && knownOrders === totalOrders
    ? 'known'
    : knownOrders > 0 || hasPartial
      ? 'partial'
      : 'unknown'

  return { status, total, knownOrders, totalOrders }
}
