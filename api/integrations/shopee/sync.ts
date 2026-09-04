import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, SHOPEE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import type { SyncSummary } from '../../../src/server/integrations/types.js'
import { ConnectionMissingError, runShopeeSync } from '../../../src/server/integrations/shopee/sync.js'
import { SyncAlreadyRunningError, SyncLockUnavailableError } from '../../../src/server/integrations/syncLock.js'
import { requireCapability } from '../../../src/server/auth/authorization.js'
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

    const auth = await requireCapability(req, res, 'marketplaces.manage')
    if (!auth) return

    if (!(await checkRateLimit(res, `shopee-sync:${auth.companyId}`, 5, 1800, { req, route: '/api/integrations/shopee/sync', policy: 'critical' }))) return

    const summary = await runShopeeSync(auth.companyId)
    const ok = summary.errors.length === 0
    const partial = !ok && (summary.productsImported > 0 || summary.inventoryUpdated > 0 || summary.ordersImported > 0)
    res.status(200).json({ ok, partial, ...summary })
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
    if (err instanceof SyncAlreadyRunningError) {
      res.status(200).json({ ok: false, source: 'already_running', message: err.message, productsImported: 0, inventoryUpdated: 0, errors: [err.message], durationMs: 0 })
      return
    }
    if (err instanceof SyncLockUnavailableError) {
      res.status(503).json({ ok: false, source: 'migration_pending', message: err.message, productsImported: 0, inventoryUpdated: 0, errors: [err.message], durationMs: 0 })
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
