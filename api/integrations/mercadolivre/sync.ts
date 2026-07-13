import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin'
import { logSyncEvent } from '../../../src/server/integrations/syncLog'
import type { SyncSummary } from '../../../src/server/integrations/types'
import { ConnectionMissingError, runMercadoLivreSync } from '../../../src/server/integrations/mercadolivre/sync'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
  if (missing.length > 0) {
    await logSyncEvent({
      connectionId: null,
      provider: 'mercadolivre',
      eventType: 'config_missing',
      status: 'error',
      message: `Sync attempted without required env vars: ${missing.join(', ')}`,
    })
    const summary: SyncSummary = { productsImported: 0, inventoryUpdated: 0, errors: [`config_missing: ${missing.join(', ')}`], durationMs: 0, source: 'config_missing' }
    res.status(200).json(summary)
    return
  }

  try {
    const summary = await runMercadoLivreSync()
    res.status(200).json(summary)
  } catch (err) {
    if (err instanceof ConnectionMissingError) {
      await logSyncEvent({
        connectionId: null,
        provider: 'mercadolivre',
        eventType: 'connection_missing',
        status: 'error',
        message: err.message,
      })
      res.status(400).json({ error: 'connection_missing', message: err.message })
      return
    }
    console.error('[mercadolivre/sync] unexpected error:', err)
    res.status(500).json({ error: 'internal_error', message: err instanceof Error ? err.message : 'Unknown error' })
  }
}
