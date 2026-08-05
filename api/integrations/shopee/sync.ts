import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, SHOPEE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import type { SyncSummary } from '../../../src/server/integrations/types.js'
import { ConnectionMissingError, runShopeeSync } from '../../../src/server/integrations/shopee/sync.js'
import { requireCompany } from '../../../src/server/auth/requireCompany.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'

export const config = { maxDuration: 300 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  try {
    const missing = getMissingEnvVars(SHOPEE_ENV_VARS)
    if (missing.length > 0) {
      await logSyncEvent({
        connectionId: null,
        provider: 'shopee',
        eventType: 'config_missing',
        status: 'error',
        message: `Sync attempted without required env vars: ${missing.join(', ')}`,
      })
      const summary: SyncSummary & { ok: boolean; message?: string } = {
        productsImported: 0,
        inventoryUpdated: 0,
        ordersImported: 0,
        errors: [`config_missing: ${missing.join(', ')}`],
        durationMs: 0,
        source: 'config_missing',
        ok: false,
        message: 'Credenciais da Shopee ainda não configuradas.',
      }
      res.status(200).json(summary)
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    if (!(await checkRateLimit(res, `shopee-sync:${auth.companyId}`, 5, 1800))) return

    const summary = await runShopeeSync(auth.companyId)
    res.status(200).json({ ok: true, ...summary })
  } catch (err) {
    if (err instanceof ConnectionMissingError) {
      await logSyncEvent({
        connectionId: null,
        provider: 'shopee',
        eventType: 'connection_missing',
        status: 'error',
        message: err.message,
      })
      res.status(200).json({ ok: false, source: 'disconnected', message: err.message, productsImported: 0, inventoryUpdated: 0, errors: [err.message], durationMs: 0 })
      return
    }
    console.error('[shopee/sync]', err)
    res.status(200).json({
      ok: false,
      source: 'error',
      message: 'Erro controlado ao sincronizar com a Shopee.',
      productsImported: 0,
      inventoryUpdated: 0,
      errors: [err instanceof Error ? err.message : 'Unknown error'],
      durationMs: 0,
    })
  }
}
