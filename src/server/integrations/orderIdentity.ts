import type { SupabaseClient } from '@supabase/supabase-js'
import type { Provider } from './types.js'

export type AnalyticSalesChannel = string

export function directCanonicalOrderKey(provider: Exclude<Provider, 'vtex'>, externalOrderId: string): string {
  return `${provider}:${String(externalOrderId).trim()}`
}

interface PersistNormalizedOrderInput {
  companyId: string
  connectionId: string
  provider: Provider
  sourceAccount?: string | null
  externalOrderId: string
  marketplaceOrderId?: string | null
  affiliateId?: string | null
  externalSalesChannel?: string | null
  externalMarketplaceName?: string | null
  channelResolutionStatus?: 'resolved' | 'unresolved' | 'ignored'
  canonicalOrderKey: string
  salesChannel: AnalyticSalesChannel
  salesChannelDisplayName?: string | null
  salesChannelType?: 'marketplace' | 'own_store' | 'external' | 'other'
  status: string
  totalAmount: number
  feeAmount: number | null
  feeStatus?: 'known' | 'unknown' | 'partial'
  refundAmount?: number | null
  refundStatus?: 'known' | 'unknown' | 'partial'
  refundUpdatedAt?: string | null
  currency: string | null
  orderedAt: string
  sourceUpdatedAt?: string | null
  analyticsIncluded?: boolean
  unavailableReason?: string | null
  items: Array<{ external_product_id: string; sku: string | null; title: string; quantity: number; unit_price: number }>
}

export function planCanonicalReconciliation(canonicalOrderId?: string | null, sourceOrderId?: string | null): {
  targetOrderId: string | null
  supersededOrderId: string | null
  shouldInsert: boolean
} {
  const targetOrderId = canonicalOrderId ?? sourceOrderId ?? null
  return {
    targetOrderId,
    supersededOrderId: canonicalOrderId && sourceOrderId && canonicalOrderId !== sourceOrderId ? sourceOrderId : null,
    shouldInsert: targetOrderId === null,
  }
}

/** Persists one canonical analytic order while retaining every source reference.
 * Direct marketplace data wins over VTEX for the canonical row, but VTEX
 * provenance remains in order_source_refs. No raw order payload is persisted. */
export async function persistCanonicalOrder(supabase: SupabaseClient, input: PersistNormalizedOrderInput): Promise<{ orderId: string; inserted: boolean; deduplicated: boolean }> {
  const knownLabels: Record<string, string> = {
    mercadolivre: 'Mercado Livre', shopee: 'Shopee', amazon: 'Amazon', magalu: 'Magalu', loja_propria: 'Loja Própria',
  }
  const canonicalRow = {
    company_id: input.companyId,
    connection_id: input.connectionId,
    provider: input.provider,
    external_order_id: input.externalOrderId,
    canonical_order_key: input.canonicalOrderKey,
    sales_channel: input.salesChannel,
    source_account: input.sourceAccount ?? null,
    status: input.status,
    total_amount: input.totalAmount,
    fee_amount: input.feeAmount,
    fee_status: input.feeStatus ?? (input.feeAmount === null ? 'unknown' : 'known'),
    refund_amount: input.refundAmount ?? null,
    refund_status: input.refundStatus ?? 'unknown',
    refund_updated_at: input.refundUpdatedAt ?? null,
    currency: input.currency,
    buyer_external_id: null,
    ordered_at: input.orderedAt,
    source_updated_at: input.sourceUpdatedAt ?? null,
    analytics_included: input.analyticsIncluded ?? true,
    unavailable_reason: input.unavailableReason ?? null,
    channel_resolution_status: input.channelResolutionStatus ?? 'resolved',
    raw_payload: null,
  }
  const sourceRow = {
    source_account: input.sourceAccount ?? null,
    marketplace_order_id: input.marketplaceOrderId ?? null,
    affiliate_id: input.affiliateId ?? null,
    external_sales_channel: input.externalSalesChannel ?? null,
    external_marketplace_name: input.externalMarketplaceName ?? null,
    channel_resolution_status: input.channelResolutionStatus ?? 'resolved',
  }
  const { data, error } = await supabase.rpc('persist_canonical_order_atomic', {
    p_order: {
      ...canonicalRow,
      sales_channel_display_name: input.salesChannelDisplayName ?? knownLabels[input.salesChannel] ?? input.salesChannel,
      sales_channel_type: input.salesChannelType ?? (input.salesChannel === 'loja_propria' ? 'own_store' : input.salesChannel.startsWith('external:') ? 'external' : 'marketplace'),
    },
    p_source: sourceRow,
    p_items: input.items,
  })
  if (error) throw new Error(`Failed to persist canonical order atomically: ${error.message}`)
  const result = data as { orderId?: string; inserted?: boolean; deduplicated?: boolean } | null
  if (!result?.orderId) throw new Error('Canonical order id unavailable')
  return { orderId: result.orderId, inserted: Boolean(result.inserted), deduplicated: Boolean(result.deduplicated) }
}
