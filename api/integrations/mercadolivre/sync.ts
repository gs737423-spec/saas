import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import type { SyncSummary } from '../../../src/server/integrations/types.js'
import { ConnectionMissingError, runMercadoLivreSync } from '../../../src/server/integrations/mercadolivre/sync.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  try {
    const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
    if (missing.length > 0) {
      await logSyncEvent({
        connectionId: null,
        provider: 'mercadolivre',
        eventType: 'config_missing',
        status: 'error',
        message: `Sync attempted without required env vars: ${missing.join(', ')}`,
      })
      const summary: SyncSummary & { ok: boolean; message?: string } = {
        productsImported: 0,
        inventoryUpdated: 0,
        errors: [`config_missing: ${missing.join(', ')}`],
        durationMs: 0,
        source: 'config_missing',
        ok: false,
        message: 'Credenciais do Mercado Livre ainda não configuradas.',
      }
      res.status(200).json(summary)
      return
    }

    const summary = await runMercadoLivreSync()
    res.status(200).json({ ok: true, ...summary })
  } catch (err) {
    if (err instanceof ConnectionMissingError) {
      await logSyncEvent({
        connectionId: null,
        provider: 'mercadolivre',
        eventType: 'connection_missing',
        status: 'error',
        message: err.message,
      })
      res.status(200).json({ ok: false, source: 'disconnected', message: err.message, productsImported: 0, inventoryUpdated: 0, errors: [err.message], durationMs: 0 })
      return
    }
    console.error('[mercadolivre/sync]', err)
    res.status(200).json({
      ok: false,
      source: 'error',
      message: 'Erro controlado ao sincronizar com o Mercado Livre.',
      productsImported: 0,
      inventoryUpdated: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
      durationMs: 0,
    })
  }
}
