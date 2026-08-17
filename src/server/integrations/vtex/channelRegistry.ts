import type { SupabaseClient } from '@supabase/supabase-js'
import type { VtexChannelMappings, VtexNormalizedOrder } from './types.js'

export async function loadVtexChannelMappings(
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
  configured: VtexChannelMappings,
): Promise<VtexChannelMappings> {
  const merged: VtexChannelMappings = Object.fromEntries(
    Object.entries(configured).map(([channel, values]) => [channel, [...values]]),
  )
  const { data, error } = await supabase.from('vtex_channel_mappings')
    .select('canonical_channel, external_key, affiliate_id, resolution_status')
    .eq('company_id', companyId)
    .eq('connection_id', connectionId)
    .eq('source_provider', 'vtex')
    .eq('resolution_status', 'resolved')
  if (error) throw new Error(`Failed to load VTEX channel mappings: ${error.message}`)
  for (const row of data ?? []) {
    const channel = String(row.canonical_channel)
    const values = merged[channel] ?? []
    const identities = [row.affiliate_id, row.external_key]
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      .map((value) => value.trim().toLowerCase())
    for (const identity of identities) {
      if (!values.includes(identity)) values.push(identity)
    }
    merged[channel] = values
  }
  return merged
}

export async function persistVtexChannelResolution(
  supabase: SupabaseClient,
  companyId: string,
  connectionId: string,
  order: VtexNormalizedOrder,
): Promise<{ discovered: boolean; resolved: boolean }> {
  const { error: channelError } = await supabase.from('sales_channels').upsert({
    company_id: companyId,
    canonical_key: order.channel,
    display_name: order.channelDisplayName,
    channel_type: order.channelType,
    status: 'active',
  }, { onConflict: 'company_id,canonical_key', ignoreDuplicates: true })
  if (channelError) throw new Error(`Failed to persist sales channel: ${channelError.message}`)

  const { data: existing, error: existingError } = await supabase.from('vtex_channel_mappings')
    .select('id')
    .eq('company_id', companyId)
    .eq('connection_id', connectionId)
    .eq('source_provider', 'vtex')
    .eq('external_key', order.externalChannelKey)
    .maybeSingle()
  if (existingError) throw new Error(`Failed to resolve VTEX channel identity: ${existingError.message}`)

  const { error: mappingError } = await supabase.from('vtex_channel_mappings').upsert({
    company_id: companyId,
    connection_id: connectionId,
    source_provider: 'vtex',
    external_key: order.externalChannelKey,
    affiliate_id: order.affiliateId,
    external_marketplace_id: null,
    external_marketplace_name: order.externalMarketplaceName,
    external_sales_channel: order.externalSalesChannel,
    canonical_channel: order.channel,
    resolution_status: order.channelResolutionStatus,
    last_seen_at: new Date().toISOString(),
  }, { onConflict: 'company_id,connection_id,source_provider,external_key' })
  if (mappingError) throw new Error(`Failed to persist VTEX channel mapping: ${mappingError.message}`)

  return { discovered: !existing, resolved: order.channelResolutionStatus === 'resolved' }
}
