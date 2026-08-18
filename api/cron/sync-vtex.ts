import type { SupabaseClient } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, VTEX_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { getStaleSyncLockCutoff, SyncAlreadyRunningError } from '../../src/server/integrations/syncLock.js'
import { VtexApiError } from '../../src/server/integrations/vtex/errors.js'
import { VtexSyncNotDueError } from '../../src/server/integrations/vtex/schedule.js'
import { processVtexSyncRun, queueVtexSync } from '../../src/server/integrations/vtex/sync.js'

export const config = { maxDuration: 300 }

const AUTO_SYNC_STATUSES = ['connected', 'syncing', 'requires_attention', 'error']

function eligibleConnections(supabase: SupabaseClient, options?: { count: 'exact'; head: true }) {
  return supabase.from('marketplace_connections')
    .select('company_id', options)
    .eq('provider', 'vtex')
    .in('status', AUTO_SYNC_STATUSES)
    .not('credential_key_encrypted', 'is', null)
    .not('credential_secret_encrypted', 'is', null)
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return void res.status(503).json({ ok: false, error: 'not_configured' })
  if (req.headers.authorization !== `Bearer ${cronSecret}`) return void res.status(401).json({ ok: false, error: 'unauthorized' })
  if (getMissingEnvVars(VTEX_ENV_VARS).length > 0) return void res.status(503).json({ ok: false, error: 'config_missing' })

  try {
    const supabase = await getSupabaseAdmin()
    const now = new Date()
    const nowIso = now.toISOString()
    const staleBefore = getStaleSyncLockCutoff(now)
    const due = `next_sync_at.is.null,next_sync_at.lte.${nowIso}`
    const circuitClosed = `circuit_open_until.is.null,circuit_open_until.lte.${nowIso}`
    const lockAvailable = `sync_started_at.is.null,sync_started_at.lt.${staleBefore}`

    const [checked, notDue, circuitOpen, locked, dueConnections] = await Promise.all([
      eligibleConnections(supabase, { count: 'exact', head: true }),
      eligibleConnections(supabase, { count: 'exact', head: true }).gt('next_sync_at', nowIso),
      eligibleConnections(supabase, { count: 'exact', head: true }).or(due).gt('circuit_open_until', nowIso),
      eligibleConnections(supabase, { count: 'exact', head: true }).or(due).or(circuitClosed).gte('sync_started_at', staleBefore),
      eligibleConnections(supabase).or(due).or(circuitClosed).or(lockAvailable).order('next_sync_at', { ascending: true, nullsFirst: true }),
    ])
    for (const result of [checked, notDue, circuitOpen, locked, dueConnections]) {
      if (result.error) throw new Error(result.error.message)
    }

    const summary = {
      connectionsChecked: checked.count ?? 0,
      connectionsDue: dueConnections.data?.length ?? 0,
      connectionsSkippedNotDue: notDue.count ?? 0,
      connectionsSkippedCircuitOpen: circuitOpen.count ?? 0,
      connectionsSkippedLocked: locked.count ?? 0,
      syncsStarted: 0,
      syncsSucceeded: 0,
      syncsPartial: 0,
      syncsFailed: 0,
      // Run que estourou o orçamento de tempo interno e devolveu `running`
      // pra retomar no próximo tick — NÃO é falha (checkpoint/heartbeat
      // preservados), então não deve contar em `syncsFailed`. Campo aditivo:
      // nenhum consumidor existente do shape de resposta quebra por causa dele.
      syncsYielded: 0,
    }

    for (const connection of dueConnections.data ?? []) {
      try {
        const queued = await queueVtexSync(connection.company_id, 'incremental', 'auto')
        summary.syncsStarted += 1
        const run = await processVtexSyncRun(connection.company_id, queued.id)
        if (run.status === 'success') summary.syncsSucceeded += 1
        else if (run.status === 'partial') summary.syncsPartial += 1
        else if (run.status === 'failed') summary.syncsFailed += 1
        else if (run.status === 'running') summary.syncsYielded += 1
      } catch (runError) {
        if (runError instanceof VtexSyncNotDueError) summary.connectionsSkippedNotDue += 1
        else if (runError instanceof SyncAlreadyRunningError) summary.connectionsSkippedLocked += 1
        else if (runError instanceof VtexApiError && runError.code === 'VTEX_CIRCUIT_OPEN') summary.connectionsSkippedCircuitOpen += 1
        else summary.syncsFailed += 1
      }
    }

    console.info('[api/cron/sync-vtex]', summary)
    res.status(200).json({ ok: true, ...summary })
  } catch (error) {
    console.error('[api/cron/sync-vtex]', error instanceof Error ? error.message : 'vtex_cron_failed')
    res.status(500).json({ ok: false, error: 'vtex_cron_failed' })
  }
}
