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
  feeAmount: number
  currency: string | null
  orderedAt: string
  sourceUpdatedAt?: string | null
  analyticsIncluded?: boolean
  unavailableReason?: string | null
  items: Array<{ external_product_id: string; sku: string | null; title: string; quantity: number; unit_price: number }>
}

const DIRECT_PROVIDERS = new Set<Provider>(['mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria'])

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
  const { error: channelError } = await supabase.from('sales_channels').upsert({
    company_id: input.companyId,
    canonical_key: input.salesChannel,
    display_name: input.salesChannelDisplayName ?? knownLabels[input.salesChannel] ?? input.salesChannel,
    channel_type: input.salesChannelType ?? (input.salesChannel === 'loja_propria' ? 'own_store' : input.salesChannel.startsWith('external:') ? 'external' : 'marketplace'),
    status: 'active',
  }, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
  if (channelError) throw new Error(`Failed to persist canonical sales channel: ${channelError.message}`)

  const { data: canonicalExisting, error: existingError } = await supabase.from('orders')
    .select('id, provider').eq('company_id', input.companyId).eq('canonical_order_key', input.canonicalOrderKey).maybeSingle()
  if (existingError) throw new Error(`Failed to resolve canonical order: ${existingError.message}`)

  const { data: sourceRef, error: sourceRefError } = await supabase.from('order_source_refs')
    .select('order_id').eq('company_id', input.companyId).eq('connection_id', input.connectionId)
    .eq('external_order_id', input.externalOrderId).maybeSingle()
  if (sourceRefError) throw new Error(`Failed to resolve order provenance: ${sourceRefError.message}`)

  let sourceExisting: { id: string; provider: Provider } | null = null
  if (!canonicalExisting && sourceRef?.order_id) {
    const { data, error } = await supabase.from('orders').select('id, provider')
      .eq('company_id', input.companyId).eq('id', sourceRef.order_id).maybeSingle()
    if (error) throw new Error(`Failed to resolve source order: ${error.message}`)
    sourceExisting = data as { id: string; provider: Provider } | null
  }

  const reconciliation = planCanonicalReconciliation(canonicalExisting?.id, sourceRef?.order_id)
  const existing = canonicalExisting ?? sourceExisting

  const incomingIsDirect = DIRECT_PROVIDERS.has(input.provider)
  let existingIsDirect = existing ? DIRECT_PROVIDERS.has(existing.provider as Provider) : false
  let orderId = existing?.id as string | undefined
  let inserted = false

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
    currency: input.currency,
    buyer_external_id: null,
    ordered_at: input.orderedAt,
    source_updated_at: input.sourceUpdatedAt ?? null,
    analytics_included: input.analyticsIncluded ?? true,
    unavailable_reason: input.unavailableReason ?? null,
    channel_resolution_status: input.channelResolutionStatus ?? 'resolved',
    raw_payload: null,
  }

  if (!existing) {
    const { data, error } = await supabase.from('orders').insert(canonicalRow).select('id').single()
    if (error) {
      // A concurrent source may have won the unique canonical key race.
      const { data: raced } = await supabase.from('orders').select('id, provider').eq('company_id', input.companyId).eq('canonical_order_key', input.canonicalOrderKey).maybeSingle()
      if (!raced) throw new Error(`Failed to insert canonical order: ${error.message}`)
      orderId = raced.id
      existingIsDirect = DIRECT_PROVIDERS.has(raced.provider as Provider)
    } else {
      orderId = data.id
      inserted = true
    }
  } else if (!existingIsDirect || incomingIsDirect) {
    const { error } = await supabase.from('orders').update(canonicalRow).eq('id', existing.id).eq('company_id', input.companyId)
    if (error) throw new Error(`Failed to update canonical order: ${error.message}`)
  }

  if (!orderId) throw new Error('Canonical order id unavailable')

  if (reconciliation.supersededOrderId) {
    const { error: supersedeError } = await supabase.from('orders').update({
      analytics_included: false,
      unavailable_reason: 'DUPLICATE_CANONICAL_RECONCILED',
    }).eq('id', reconciliation.supersededOrderId).eq('company_id', input.companyId)
    if (supersedeError) throw new Error(`Failed to reconcile previous canonical order: ${supersedeError.message}`)
  }

  const { error: sourceError } = await supabase.from('order_source_refs').upsert({
    company_id: input.companyId,
    order_id: orderId,
    connection_id: input.connectionId,
    provider: input.provider,
    source_account: input.sourceAccount ?? null,
    external_order_id: input.externalOrderId,
    marketplace_order_id: input.marketplaceOrderId ?? null,
    affiliate_id: input.affiliateId ?? null,
    external_sales_channel: input.externalSalesChannel ?? null,
    external_marketplace_name: input.externalMarketplaceName ?? null,
    channel_key: input.salesChannel,
    channel_resolution_status: input.channelResolutionStatus ?? 'resolved',
    canonical_order_key: input.canonicalOrderKey,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'company_id,connection_id,external_order_id' })
  if (sourceError) throw new Error(`Failed to persist order provenance: ${sourceError.message}`)

  // Do not replace richer direct-provider items with the VTEX representation.
  if (!existingIsDirect || incomingIsDirect) {
    const { error: deleteError } = await supabase.from('order_items').delete().eq('order_id', orderId).eq('company_id', input.companyId)
    if (deleteError) throw new Error(`Failed to replace order items: ${deleteError.message}`)
    if (input.items.length > 0) {
      const { error: itemError } = await supabase.from('order_items').insert(input.items.map((item) => ({ company_id: input.companyId, order_id: orderId, ...item })))
      if (itemError) throw new Error(`Failed to insert order items: ${itemError.message}`)
    }
  }

  return { orderId, inserted, deduplicated: Boolean(existing || sourceRef) }
}
