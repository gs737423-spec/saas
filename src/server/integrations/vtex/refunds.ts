import type { VtexOrder, VtexPaymentTransactionDetails } from './types.js'

export interface VtexRefundSnapshot {
  refundAmount: number | null
  refundStatus: 'known' | 'unknown'
  refundUpdatedAt: string | null
}

export const UNKNOWN_VTEX_REFUND: VtexRefundSnapshot = {
  refundAmount: null,
  refundStatus: 'unknown',
  refundUpdatedAt: null,
}

/** IDs ativos e únicos evitam consultar duas vezes a mesma transação. */
export function vtexPaymentTransactionIds(order: Pick<VtexOrder, 'paymentData'>): string[] {
  const ids = new Set<string>()
  for (const transaction of order.paymentData?.transactions ?? []) {
    const id = transaction.transactionId?.trim()
    if (id && transaction.isActive !== false) ids.add(id)
  }
  return [...ids]
}

/** A VTEX Payments retorna valores em centavos. Só total explícito e válido
 * representa cobertura conhecida; ausência nunca vira reembolso zero. */
export function vtexRefundSnapshot(details: VtexPaymentTransactionDetails[]): VtexRefundSnapshot {
  if (details.length === 0) return UNKNOWN_VTEX_REFUND

  let cents = 0
  let updatedAt: string | null = null
  for (const detail of details) {
    const value = detail.totalRefunds
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return UNKNOWN_VTEX_REFUND
    cents += value
    const candidate = detail.refundingDate
    if (candidate && !Number.isNaN(Date.parse(candidate)) && (!updatedAt || candidate > updatedAt)) updatedAt = candidate
  }

  return { refundAmount: cents / 100, refundStatus: 'known', refundUpdatedAt: updatedAt }
}
