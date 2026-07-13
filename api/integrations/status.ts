import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, MERCADOLIVRE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin'
import type { SanitizedConnectionStatusResponse } from '../../src/server/integrations/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)

  if (missing.length > 0) {
    const response: SanitizedConnectionStatusResponse = {
      provider: 'mercadolivre',
      status: 'config_missing',
      lastSyncAt: null,
      externalAccountId: null,
      productsCount: 0,
      inventoryCount: 0,
      lastError: `Missing env vars: ${missing.join(', ')}`,
    }
    res.status(200).json(response)
    return
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: connection, error } = await supabase
      .from('marketplace_connections')
      .select('id, status, external_account_id, last_sync_at, last_error, token_expires_at')
      .eq('provider', 'mercadolivre')
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!connection) {
      const response: SanitizedConnectionStatusResponse = {
        provider: 'mercadolivre',
        status: 'disconnected',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        lastError: null,
      }
      res.status(200).json(response)
      return
    }

    const isExpired = connection.status === 'connected' && connection.token_expires_at && new Date(connection.token_expires_at) < new Date()

    const [{ count: productsCount }, { count: inventoryCount }] = await Promise.all([
      supabase.from('marketplace_products').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id),
      supabase.from('marketplace_inventory').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id),
    ])

    const response: SanitizedConnectionStatusResponse = {
      provider: 'mercadolivre',
      status: isExpired ? 'expired' : connection.status,
      lastSyncAt: connection.last_sync_at,
      externalAccountId: connection.external_account_id,
      productsCount: productsCount ?? 0,
      inventoryCount: inventoryCount ?? 0,
      lastError: connection.last_error,
    }
    res.status(200).json(response)
  } catch (err) {
    console.error('[integrations/status] failed:', err)
    res.status(500).json({ error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' })
  }
}
