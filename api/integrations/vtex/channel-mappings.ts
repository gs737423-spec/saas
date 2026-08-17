import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCapability } from '../../../src/server/auth/authorization.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'
import { getRequestId } from '../../../src/server/security/requestContext.js'
import { writeSecurityAudit } from '../../../src/server/security/auditLog.js'
import { getSupabaseAdmin } from '../../../src/server/integrations/supabaseAdmin.js'
import { loadVtexConnection } from '../../../src/server/integrations/vtex/connection.js'
import { publicVtexError } from '../../../src/server/integrations/vtex/errors.js'
import { normalizeVtexCanonicalChannel, normalizeVtexChannelDisplayName, normalizeVtexChannelMappings, normalizeVtexExternalChannelKey } from '../../../src/server/integrations/vtex/validation.js'

function safeText(value: unknown, maxLength = 160): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/[\u0000-\u001f\u007f]/g, '')
  return normalized ? normalized.slice(0, maxLength) : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!['GET', 'PUT'].includes(req.method ?? '')) return void res.status(405).json({ ok: false, error: 'method_not_allowed' })
  const auth = await requireCapability(req, res, 'marketplaces.manage')
  if (!auth) return

  try {
    const current = await loadVtexConnection(auth.companyId)
    const supabase = await getSupabaseAdmin()

    if (req.method === 'GET') {
      const [{ data: mappings, error: mappingsError }, { data: channels, error: channelsError }] = await Promise.all([
        supabase.from('vtex_channel_mappings')
          .select('external_key, affiliate_id, external_marketplace_name, external_sales_channel, canonical_channel, resolution_status, last_seen_at')
          .eq('company_id', auth.companyId)
          .eq('connection_id', current.id)
          .eq('source_provider', 'vtex')
          .order('last_seen_at', { ascending: false }),
        supabase.from('sales_channels')
          .select('canonical_key, display_name, channel_type')
          .eq('company_id', auth.companyId)
          .eq('status', 'active')
          .order('display_name', { ascending: true }),
      ])
      if (mappingsError) throw new Error(mappingsError.message)
      if (channelsError) throw new Error(channelsError.message)

      const labels = new Map((channels ?? []).map((channel) => [String(channel.canonical_key), safeText(channel.display_name) ?? String(channel.canonical_key)]))
      res.status(200).json({
        ok: true,
        channels: (mappings ?? []).map((mapping) => ({
          externalKey: String(mapping.external_key),
          displayName: safeText(mapping.external_marketplace_name)
            ?? safeText(mapping.affiliate_id)
            ?? safeText(mapping.external_sales_channel)
            ?? labels.get(String(mapping.canonical_channel))
            ?? 'Canal VTEX',
          externalIdentifier: safeText(mapping.affiliate_id)
            ?? safeText(mapping.external_sales_channel)
            ?? safeText(mapping.external_key, 120)
            ?? 'Identificador indisponível',
          canonicalChannel: String(mapping.canonical_channel),
          canonicalDisplayName: labels.get(String(mapping.canonical_channel)) ?? String(mapping.canonical_channel),
          resolutionStatus: mapping.resolution_status,
          lastSeenAt: mapping.last_seen_at,
        })),
        canonicalChannels: (channels ?? []).filter((channel) => !String(channel.canonical_key).startsWith('external:vtex:')).map((channel) => ({
          canonicalKey: String(channel.canonical_key),
          displayName: safeText(channel.display_name) ?? String(channel.canonical_key),
          channelType: channel.channel_type,
        })),
      })
      return
    }

    if (!(await checkRateLimit(res, `vtex-channel-mappings:${auth.companyId}`, 10, 1800, { req, route: '/api/integrations/vtex/channel-mappings', policy: 'critical' }))) return

    if (req.body?.externalKey !== undefined) {
      const externalKey = normalizeVtexExternalChannelKey(req.body.externalKey)
      const canonicalChannel = normalizeVtexCanonicalChannel(req.body.canonicalChannel)
      const { data: mapping, error: mappingError } = await supabase.from('vtex_channel_mappings')
        .select('id')
        .eq('company_id', auth.companyId)
        .eq('connection_id', current.id)
        .eq('source_provider', 'vtex')
        .eq('external_key', externalKey)
        .maybeSingle()
      if (mappingError) throw new Error(mappingError.message)
      if (!mapping) throw new Error('VTEX_CHANNEL_MAPPING_NOT_FOUND')

      const { data: existingChannel, error: channelLookupError } = await supabase.from('sales_channels')
        .select('canonical_key')
        .eq('company_id', auth.companyId)
        .eq('canonical_key', canonicalChannel)
        .maybeSingle()
      if (channelLookupError) throw new Error(channelLookupError.message)
      if (!existingChannel) {
        const displayName = normalizeVtexChannelDisplayName(req.body.displayName)
        const { error: createChannelError } = await supabase.from('sales_channels').upsert({
          company_id: auth.companyId,
          canonical_key: canonicalChannel,
          display_name: displayName,
          channel_type: 'marketplace',
          status: 'active',
        }, { onConflict: 'company_id,canonical_key' })
        if (createChannelError) throw new Error(createChannelError.message)
      }

      const { error: updateError } = await supabase.from('vtex_channel_mappings').update({
        canonical_channel: canonicalChannel,
        resolution_status: 'resolved',
        updated_at: new Date().toISOString(),
      }).eq('id', mapping.id).eq('company_id', auth.companyId).eq('connection_id', current.id)
      if (updateError) throw new Error(updateError.message)

      await writeSecurityAudit({
        requestId: getRequestId(req, res), actorUserId: auth.userId, companyId: auth.companyId,
        action: 'vtex.channel_mapping_resolved', targetType: 'vtex_channel_mapping', targetId: mapping.id,
        metadata: { canonicalChannel, requiresFullSync: true },
      })
      res.status(200).json({ ok: true, canonicalChannel, requiresFullSync: true })
      return
    }

    const channelMappings = normalizeVtexChannelMappings({
      ...(current.provider_metadata?.channelMappings ?? {}),
      ...(typeof req.body === 'object' && req.body !== null ? req.body : {}),
    })
    const { error } = await supabase.from('marketplace_connections').update({
      provider_metadata: { ...(current.provider_metadata ?? {}), authMethod: 'application_key', channelMappings },
    }).eq('id', current.id).eq('company_id', auth.companyId)
    if (error) throw new Error(error.message)
    await writeSecurityAudit({ requestId: getRequestId(req, res), actorUserId: auth.userId, companyId: auth.companyId, action: 'vtex.channel_mappings_update', targetType: 'marketplace_connection', targetId: current.id, metadata: { mappedChannels: Object.keys(channelMappings).filter((key) => channelMappings[key].length > 0).join(',') } })
    res.status(200).json({ ok: true, channelMappings, requiresFullSync: true })
  } catch (error) {
    const safe = publicVtexError(error)
    res.status(200).json({ ok: false, error: safe.code, message: safe.message })
  }
}
