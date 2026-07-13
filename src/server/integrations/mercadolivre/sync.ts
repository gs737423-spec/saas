import { getSupabaseAdmin } from '../supabaseAdmin'
import { encryptSecret, decryptSecret } from '../crypto'
import { logSyncEvent } from '../syncLog'
import { DEFAULT_COMPANY_ID, type SyncSummary } from '../types'
import { getItemDetail, searchUserItemIds, MercadoLivreApiError } from './client'
import { mapItemToInventoryRow, mapItemToProductRow } from './mapper'
import { refreshAccessToken } from './auth'

export class ConnectionMissingError extends Error {}

interface ConnectionRow {
  id: string
  status: string
  seller_id: string | null
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: string | null
}

async function loadConnection(): Promise<ConnectionRow> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('marketplace_connections')
    .select('id, status, seller_id, access_token_encrypted, refresh_token_encrypted, token_expires_at')
    .eq('provider', 'mercadolivre')
    .eq('company_id', DEFAULT_COMPANY_ID)
    .maybeSingle()

  if (error) throw new Error(`Failed to load Mercado Livre connection: ${error.message}`)
  if (!data || !data.access_token_encrypted || !data.refresh_token_encrypted || !data.seller_id) {
    throw new ConnectionMissingError('No connected Mercado Livre account found — run OAuth first.')
  }
  return data
}

/** Ensures we have a live access token, refreshing it first if the stored one has expired.
 *  Returns the plaintext access token — caller must never persist or log it. */
async function ensureValidAccessToken(connection: ConnectionRow): Promise<string> {
  const isExpired = connection.token_expires_at ? new Date(connection.token_expires_at) <= new Date() : false

  if (!isExpired) {
    return decryptSecret(connection.access_token_encrypted!)
  }

  const refreshToken = decryptSecret(connection.refresh_token_encrypted!)
  const refreshed = await refreshAccessToken(refreshToken)

  const supabase = getSupabaseAdmin()
  await supabase
    .from('marketplace_connections')
    .update({
      access_token_encrypted: encryptSecret(refreshed.access_token),
      refresh_token_encrypted: encryptSecret(refreshed.refresh_token),
      token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      status: 'connected',
      last_error: null,
    })
    .eq('id', connection.id)

  await logSyncEvent({
    connectionId: connection.id,
    provider: 'mercadolivre',
    eventType: 'token_refreshed',
    status: 'success',
    message: 'Access token refreshed before sync',
  })

  return refreshed.access_token
}

/**
 * Runs a full products + inventory sync for the connected Mercado Livre account.
 * Orders/revenue are explicitly out of scope — see docs/integrations/mercadolivre-sync.md.
 */
export async function runMercadoLivreSync(): Promise<SyncSummary> {
  const startedAt = new Date()
  const supabase = getSupabaseAdmin()
  const connection = await loadConnection()

  await logSyncEvent({
    connectionId: connection.id,
    provider: 'mercadolivre',
    eventType: 'sync_started',
    status: 'info',
    startedAt,
  })

  const errors: string[] = []
  let productsImported = 0
  let inventoryUpdated = 0

  try {
    const accessToken = await ensureValidAccessToken(connection)
    const itemIds = await searchUserItemIds(connection.seller_id!, accessToken)

    for (const itemId of itemIds) {
      try {
        const detail = await getItemDetail(itemId, accessToken)
        const productRow = mapItemToProductRow(detail)
        const inventoryRow = mapItemToInventoryRow(detail)

        const { error: productError } = await supabase.from('marketplace_products').upsert(
          {
            company_id: DEFAULT_COMPANY_ID,
            connection_id: connection.id,
            provider: 'mercadolivre',
            ...productRow,
          },
          { onConflict: 'company_id,connection_id,external_product_id' }
        )
        if (productError) throw new Error(`Failed to upsert product ${itemId}: ${productError.message}`)
        productsImported += 1

        const { error: inventoryError } = await supabase.from('marketplace_inventory').upsert(
          {
            company_id: DEFAULT_COMPANY_ID,
            connection_id: connection.id,
            provider: 'mercadolivre',
            last_sync_at: new Date().toISOString(),
            ...inventoryRow,
          },
          { onConflict: 'company_id,connection_id,external_product_id' }
        )
        if (inventoryError) throw new Error(`Failed to upsert inventory ${itemId}: ${inventoryError.message}`)
        inventoryUpdated += 1
      } catch (itemErr) {
        const message = itemErr instanceof MercadoLivreApiError
          ? itemErr.message
          : itemErr instanceof Error ? itemErr.message : `Unknown error processing item ${itemId}`
        errors.push(message)
      }
    }

    const finishedAt = new Date()
    const durationMs = finishedAt.getTime() - startedAt.getTime()
    const hadPartialFailures = errors.length > 0 && productsImported > 0

    await supabase
      .from('marketplace_connections')
      .update({ last_sync_at: finishedAt.toISOString(), status: 'connected', last_error: errors[0] ?? null })
      .eq('id', connection.id)

    await logSyncEvent({
      connectionId: connection.id,
      provider: 'mercadolivre',
      eventType: errors.length === 0 ? 'sync_success' : hadPartialFailures ? 'sync_partial' : 'sync_error',
      status: errors.length === 0 ? 'success' : hadPartialFailures ? 'success' : 'error',
      message: errors.length === 0 ? `Synced ${productsImported} products` : `${errors.length} item(s) failed during sync`,
      payload: { productsImported, inventoryUpdated, errorCount: errors.length },
      startedAt,
      finishedAt,
    })

    return { productsImported, inventoryUpdated, errors, durationMs, source: 'real' }
  } catch (err) {
    const finishedAt = new Date()
    const message = err instanceof Error ? err.message : 'Unknown sync failure'

    await supabase.from('marketplace_connections').update({ status: 'error', last_error: message }).eq('id', connection.id)

    await logSyncEvent({
      connectionId: connection.id,
      provider: 'mercadolivre',
      eventType: 'sync_error',
      status: 'error',
      message,
      startedAt,
      finishedAt,
    })

    return { productsImported, inventoryUpdated, errors: [message], durationMs: finishedAt.getTime() - startedAt.getTime(), source: 'real' }
  }
}
