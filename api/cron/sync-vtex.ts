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
    .select('id,company_id,last_success_at,last_error', options)
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
    const circuitRecoverable = `${circuitClosed},last_error.eq.VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT`
    const lockAvailable = `sync_started_at.is.null,sync_started_at.lt.${staleBefore}`

    // Conexões com uma run `queued`/`running` já existente precisam ser
    // visitadas neste tick INDEPENDENTE de `next_sync_at` — uma run yieldada
    // por orçamento de tempo está aguardando o cron continuá-la, não
    // esperando o intervalo de 24h de uma sync nova (ver queueVtexSync).
    // Sem isso, uma run interrompida ficava presa em `queued` até a conexão
    // voltar a ficar "due", mesmo o cron rodando a cada poucos minutos.
    const { data: activeRuns, error: activeRunsError } = await supabase.from('integration_sync_runs')
      .select('company_id').eq('provider', 'vtex').in('status', ['queued', 'running'])
      .order('created_at', { ascending: true }).limit(1)
    if (activeRunsError) throw new Error(activeRunsError.message)
    const activeRunCompanyIds = [...new Set((activeRuns ?? []).map((row) => String(row.company_id)))]

    const [checked, notDue, circuitOpen, locked, dueConnections, resumableConnections] = await Promise.all([
      eligibleConnections(supabase, { count: 'exact', head: true }),
      eligibleConnections(supabase, { count: 'exact', head: true }).gt('next_sync_at', nowIso),
      eligibleConnections(supabase, { count: 'exact', head: true }).or(due).gt('circuit_open_until', nowIso),
      eligibleConnections(supabase, { count: 'exact', head: true }).or(due).or(circuitClosed).gte('sync_started_at', staleBefore),
      eligibleConnections(supabase).or(due).or(circuitRecoverable).or(lockAvailable)
        .order('next_sync_at', { ascending: true, nullsFirst: true }).order('company_id', { ascending: true }).limit(1),
      activeRunCompanyIds.length > 0
        ? eligibleConnections(supabase).in('company_id', activeRunCompanyIds).or(lockAvailable)
        : Promise.resolve({ data: [], error: null }),
    ])
    for (const result of [checked, notDue, circuitOpen, locked, dueConnections, resumableConnections]) {
      if (result.error) throw new Error(result.error.message)
    }

    // Uma conexão por tick: uma run já iniciada vence a fila; sem run ativa,
    // entra a conexão mais vencida. Cada processamento pode consumir 210s do
    // teto de 300s, então iniciar uma segunda conexão criaria starvation e
    // workers abandonados entre tenants.
    const nextConnection = resumableConnections.data?.[0] ?? dueConnections.data?.[0] ?? null

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
      // Run que estourou o orçamento de tempo interno e devolveu `queued`
      // pra retomar no próximo tick — NÃO é falha (checkpoint/heartbeat
      // preservados), então não deve contar em `syncsFailed`. Campo aditivo:
      // nenhum consumidor existente do shape de resposta quebra por causa dele.
      syncsYielded: 0,
    }

    for (const connection of nextConnection ? [nextConnection] : []) {
      try {
        const recoveringDenseFullRun = connection.last_error === 'VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT'
        if (recoveringDenseFullRun) {
          const { error: recoveryError } = await supabase.from('marketplace_connections').update({
            last_error: null,
            failure_count: 0,
            circuit_open_until: null,
          }).eq('id', connection.id).eq('company_id', connection.company_id).eq('provider', 'vtex')
          if (recoveryError) throw new Error(recoveryError.message)
        }
        const mode = recoveringDenseFullRun || !connection.last_success_at ? 'full' : 'incremental'
        const queued = await queueVtexSync(connection.company_id, mode, 'auto')
        summary.syncsStarted += 1
        const run = await processVtexSyncRun(connection.company_id, queued.id)
        if (run.status === 'success') summary.syncsSucceeded += 1
        else if (run.status === 'partial') summary.syncsPartial += 1
        else if (run.status === 'failed') summary.syncsFailed += 1
        else if (run.status === 'queued' || run.status === 'running') summary.syncsYielded += 1
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
