import { describe, expect, it, vi } from 'vitest'
import {
  DEFAULT_HISTORY_MONTHS,
  HEARTBEAT_STALE_MINUTES,
  MAX_INITIAL_HISTORY_MONTHS,
  reclaimStaleVtexRun,
  resolveVtexHistoryMonths,
  runBudgetedBatches,
  VTEX_MAX_RUNTIME_MS,
} from '../src/server/integrations/vtex/sync'
import { computeVtexSyncProgress } from '../src/server/integrations/vtex/progress'
import { normalizeVtexHistoryMonths } from '../src/server/integrations/vtex/validation'

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))

// -----------------------------------------------------------------------
// Histórico 3/6 meses (root cause fix #1: nunca mais 12 meses por padrão)
// -----------------------------------------------------------------------
describe('VTEX initial history window', () => {
  it('defaults to 3 months and never falls back to the old 12-month window', () => {
    expect(DEFAULT_HISTORY_MONTHS).toBe(3)
    expect(resolveVtexHistoryMonths(null)).toBe(3)
    expect(resolveVtexHistoryMonths({})).toBe(3)
    expect(resolveVtexHistoryMonths({ historyMonths: 'garbage' })).toBe(3)
  })

  it('allows 6 months as the explicit opt-in ceiling, never more', () => {
    expect(MAX_INITIAL_HISTORY_MONTHS).toBe(6)
    expect(resolveVtexHistoryMonths({ historyMonths: 6 })).toBe(6)
    expect(resolveVtexHistoryMonths({ historyMonths: 12 })).toBe(6)
    expect(resolveVtexHistoryMonths({ historyMonths: 0 })).toBe(3)
    expect(resolveVtexHistoryMonths({ historyMonths: -5 })).toBe(3)
  })

  it('request-facing validator only accepts 3 or 6, defaulting invalid input to 3', () => {
    expect(normalizeVtexHistoryMonths(undefined)).toBe(3)
    expect(normalizeVtexHistoryMonths(6)).toBe(6)
    expect(normalizeVtexHistoryMonths('6')).toBe(6)
    expect(normalizeVtexHistoryMonths(12)).toBe(3)
    expect(normalizeVtexHistoryMonths('twelve')).toBe(3)
  })
})

// -----------------------------------------------------------------------
// Chunking + time budget — a causa raiz do travamento em orders/orderPage=1
// -----------------------------------------------------------------------
describe('runBudgetedBatches (chunked, resumable processing)', () => {
  it('processes everything and reports no timeout when comfortably inside the budget', async () => {
    const items = Array.from({ length: 12 }, (_, i) => i)
    const processed: number[] = []
    const onBatch = vi.fn(async () => undefined)
    const result = await runBudgetedBatches(items, 4, Date.now() + 60_000, async (item) => { processed.push(item) }, onBatch)
    expect(result).toEqual({ processedCount: 12, timedOut: false })
    expect(processed.sort((a, b) => a - b)).toEqual(items)
    expect(onBatch).toHaveBeenCalledTimes(3) // 12 items / concurrency 4 = 3 batches
  })

  it('stops and reports timedOut as soon as the deadline is crossed, mid-run — this is the actual fix: a slow VTEX/Supabase can never hang the invocation past its budget', async () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    let batchesRun = 0
    // Deadline expires right after the very first batch commits, simulating
    // VTEX/Supabase being slow enough that a single batch eats the budget —
    // exactly the scenario that used to leave orderPage stuck at 1 forever.
    const deadline = Date.now() + 5
    const result = await runBudgetedBatches(items, 5, deadline, async () => { await new Promise((r) => setTimeout(r, 8)) }, async () => { batchesRun += 1 })
    expect(result.timedOut).toBe(true)
    expect(result.processedCount).toBeLessThan(items.length)
    expect(result.processedCount).toBeGreaterThan(0) // partial progress was made and persisted (onBatch ran)
    expect(batchesRun).toBeGreaterThan(0)
  })

  it('never uses unlimited concurrency — batches respect the given limit', async () => {
    let maxInFlight = 0
    let inFlight = 0
    const items = Array.from({ length: 20 }, (_, i) => i)
    await runBudgetedBatches(items, 3, Date.now() + 60_000, async () => {
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((r) => setTimeout(r, 5))
      inFlight -= 1
    }, async () => undefined)
    expect(maxInFlight).toBeLessThanOrEqual(3)
  })

  it('an item-level failure does not abort the batch — matches "não bloquear tudo por um item ruim"', async () => {
    const items = [1, 2, 3, 4]
    const succeeded: number[] = []
    const result = await runBudgetedBatches(items, 2, Date.now() + 60_000, async (item) => {
      if (item === 2) throw new Error('boom')
      succeeded.push(item)
    }, async () => undefined)
    expect(result.processedCount).toBe(4) // all attempted, one failed silently inside handler (caller handles the error)
    expect(succeeded).toEqual([1, 3, 4])
  })
})

// -----------------------------------------------------------------------
// Progresso real — nunca porcentagem inventada
// -----------------------------------------------------------------------
describe('computeVtexSyncProgress (real progress, never fake)', () => {
  it('is indeterminate when there is no numeric basis yet (validate/categories/finalize)', () => {
    expect(computeVtexSyncProgress('validate', {}, {}).percent).toBeNull()
    expect(computeVtexSyncProgress('finalize', {}, {}).percent).toBeNull()
  })

  it('computes real catalog progress from skuOffset/skuTotal', () => {
    const progress = computeVtexSyncProgress('catalog', { skuOffset: 40, skuTotal: 160 }, {})
    expect(progress).toEqual({ percent: 25, processed: 40, total: 160, basis: 'count' })
  })

  it('computes real orders progress from how much of the requested history window has been covered', () => {
    const checkpoint = {
      orderHistoryStart: '2026-05-17T00:00:00.000Z',
      orderTargetEnd: '2026-08-17T00:00:00.000Z',
      orderWindowStart: '2026-06-17T00:00:00.000Z', // exactly 1/3 of the way through the 3-month window
    }
    const progress = computeVtexSyncProgress('orders', checkpoint, { ordersFetched: 250 })
    expect(progress.percent).toBeGreaterThanOrEqual(32)
    expect(progress.percent).toBeLessThanOrEqual(35)
    expect(progress.processed).toBe(250)
    expect(progress.total).toBeNull() // total order count across the whole history is genuinely unknown
    // basis explicitly marks this percent as "time window covered", never
    // "fraction of order count" — the UI must not label it as "% of orders".
    expect(progress.basis).toBe('time_window')
  })

  it('marks basis as count for catalog and none when there is no numeric base at all', () => {
    expect(computeVtexSyncProgress('catalog', { skuOffset: 40, skuTotal: 160 }, {}).basis).toBe('count')
    expect(computeVtexSyncProgress('validate', {}, {}).basis).toBe('none')
    expect(computeVtexSyncProgress('finalize', {}, {}).basis).toBe('none')
  })

  it('never reports 100% before the stage genuinely finishes its known total', () => {
    const progress = computeVtexSyncProgress('catalog', { skuOffset: 160, skuTotal: 160 }, {})
    expect(progress.percent).toBe(100)
  })
})

// -----------------------------------------------------------------------
// Stale recovery — a run presa em `running` nunca mais fica assim pra sempre
// -----------------------------------------------------------------------
function makeSupabaseMock(options: {
  staleRow: { id: string; checkpoint: Record<string, unknown>; stage: string; last_heartbeat_at?: string | null; updated_at?: string | null; started_at?: string | null; created_at?: string | null } | null
  reclaimSucceeds: boolean
}) {
  const updateCalls: Array<{ table: string; patch: Record<string, unknown> }> = []
  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {}
    const chain = () => builder
    builder.select = vi.fn(chain)
    builder.eq = vi.fn(chain)
    builder.lt = vi.fn(chain)
    builder.neq = vi.fn(chain)
    builder.or = vi.fn(chain)
    builder.maybeSingle = vi.fn(async () => (table === 'integration_sync_runs' ? { data: options.staleRow, error: null } : { data: null, error: null }))
    builder.update = vi.fn((patch: Record<string, unknown>) => {
      updateCalls.push({ table, patch })
      // Dedicated chain for the update result — must NOT alias back to the
      // outer read `builder` (that aliasing bug used to make `.select('id')`
      // resolve to the builder object itself instead of the async result,
      // silently short-circuiting every post-reclaim side effect below it).
      const updateChain: Record<string, unknown> = {}
      const updateChainFn = () => updateChain
      updateChain.eq = vi.fn(updateChainFn)
      updateChain.lt = vi.fn(updateChainFn)
      updateChain.neq = vi.fn(updateChainFn)
      updateChain.or = vi.fn(updateChainFn)
      updateChain.select = vi.fn(async () => ({ data: options.reclaimSucceeds ? [{ id: options.staleRow?.id }] : [], error: null }))
      return updateChain
    })
    return builder
  })
  return { from, updateCalls } as unknown as { from: typeof from; updateCalls: typeof updateCalls }
}

describe('reclaimStaleVtexRun (self-healing, no manual UPDATE needed)', () => {
  it('does nothing when there is no stale running run', async () => {
    const supabase = makeSupabaseMock({ staleRow: null, reclaimSucceeds: false })
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    expect(supabase.updateCalls.length).toBe(0)
  })

  it('resumes the SAME run (requeues, keeps checkpoint) instead of losing progress', async () => {
    const staleRow = { id: 'run-1', checkpoint: { orderPage: 4, skuOffset: 40 }, stage: 'orders', last_heartbeat_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    const supabase = makeSupabaseMock({ staleRow, reclaimSucceeds: true })
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    const runUpdate = supabase.updateCalls.find((call) => call.table === 'integration_sync_runs')
    expect(runUpdate?.patch.status).toBe('queued')
    expect((runUpdate?.patch.checkpoint as Record<string, unknown>).orderPage).toBe(4) // checkpoint preserved, not reset
    expect((runUpdate?.patch.checkpoint as Record<string, unknown>).staleRecoveries).toBe(1)
  })

  it('gives up after MAX_STALE_RECOVERIES and marks the run failed instead of retrying forever', async () => {
    const staleRow = { id: 'run-1', checkpoint: { staleRecoveries: 5 }, stage: 'orders', last_heartbeat_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    const supabase = makeSupabaseMock({ staleRow, reclaimSucceeds: true })
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    const runUpdate = supabase.updateCalls.find((call) => call.table === 'integration_sync_runs')
    expect(runUpdate?.patch.status).toBe('failed')
    expect(runUpdate?.patch.completed_at).toBeDefined()
  })

  it('is a no-op when another invocation already reclaimed the row first (race safety)', async () => {
    const staleRow = { id: 'run-1', checkpoint: {}, stage: 'orders', last_heartbeat_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    const supabase = makeSupabaseMock({ staleRow, reclaimSucceeds: false }) // simulates 0 rows affected
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    // The conditional UPDATE ran (attempted), but since it affected 0 rows,
    // no follow-up side effects (lock release, log) should fire — asserted
    // indirectly: no second update call touching marketplace_connections.
    const connectionUpdate = supabase.updateCalls.find((call) => call.table === 'marketplace_connections')
    expect(connectionUpdate).toBeUndefined()
  })

  // ---------------------------------------------------------------------
  // Gap #1: last_heartbeat_at NULL — a run that predates migration 020 (or
  // any row that slips through without ever getting a heartbeat written)
  // must still be reclaimable, but ONLY if it's genuinely old by
  // updated_at/started_at/created_at — never just because heartbeat is null.
  // ---------------------------------------------------------------------
  it('reclaims a running row with NULL heartbeat when updated_at proves it is genuinely old', async () => {
    const oldTimestamp = new Date(Date.now() - 60 * 60 * 1000).toISOString() // 1h old
    const staleRow = { id: 'run-2', checkpoint: { orderPage: 2 }, stage: 'orders', last_heartbeat_at: null, updated_at: oldTimestamp, started_at: oldTimestamp, created_at: oldTimestamp }
    const supabase = makeSupabaseMock({ staleRow, reclaimSucceeds: true })
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    const runUpdate = supabase.updateCalls.find((call) => call.table === 'integration_sync_runs')
    expect(runUpdate?.patch.status).toBe('queued') // reclaimed, checkpoint preserved
    expect((runUpdate?.patch.checkpoint as Record<string, unknown>).orderPage).toBe(2)
    const connectionUpdate = supabase.updateCalls.find((call) => call.table === 'marketplace_connections')
    expect(connectionUpdate?.patch.sync_started_at).toBeNull() // lock released too
  })

  it('does NOT reclaim a running row with NULL heartbeat when it was created/updated moments ago', async () => {
    const freshTimestamp = new Date().toISOString()
    const staleRow = { id: 'run-3', checkpoint: {}, stage: 'validate', last_heartbeat_at: null, updated_at: freshTimestamp, started_at: freshTimestamp, created_at: freshTimestamp }
    const supabase = makeSupabaseMock({ staleRow, reclaimSucceeds: true })
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    // No update at all should be attempted — the JS-side freshness check
    // short-circuits before ever issuing the reclaim UPDATE.
    expect(supabase.updateCalls.length).toBe(0)
  })

  // ---------------------------------------------------------------------
  // Gap #2: reclaiming a stale run must also release the connection-level
  // sync lock (sync_started_at), otherwise a recovered run could still be
  // blocked from being picked up by claimSyncLock.
  // ---------------------------------------------------------------------
  it('releases the connection sync lock (sync_started_at = null) as part of a successful reclaim', async () => {
    const staleRow = { id: 'run-1', checkpoint: {}, stage: 'orders', last_heartbeat_at: new Date(Date.now() - 60 * 60 * 1000).toISOString() }
    const supabase = makeSupabaseMock({ staleRow, reclaimSucceeds: true })
    await reclaimStaleVtexRun(supabase as never, 'company-a', 'connection-1')
    const connectionUpdate = supabase.updateCalls.find((call) => call.table === 'marketplace_connections')
    expect(connectionUpdate).toBeDefined()
    expect(connectionUpdate?.patch.sync_started_at).toBeNull()
    // Order matters: the run reclaim update must be issued before the lock
    // release, so a resumed run is never left both "queued" and locked.
    const runIndex = supabase.updateCalls.findIndex((call) => call.table === 'integration_sync_runs')
    const lockIndex = supabase.updateCalls.findIndex((call) => call.table === 'marketplace_connections')
    expect(runIndex).toBeGreaterThanOrEqual(0)
    expect(lockIndex).toBeGreaterThan(runIndex)
  })
})

// -----------------------------------------------------------------------
// Gap #5: no destructive "delete everything then rewrite" pattern exists
// anywhere in the canonical order persistence path — a failed/partial sync
// must never blank out data from a previous successful sync. This is a
// static/code-shape assertion (no real DB available in this test suite):
// it reads the actual source and asserts the only delete touches a single
// order's items scoped by order_id, never a bulk delete scoped only by
// company_id/connection_id run-wide.
// -----------------------------------------------------------------------
describe('persistCanonicalOrder is fully atomic', () => {
  it('delegates canonical row, provenance and items to one transactional database RPC', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/orderIdentity.ts'), 'utf-8')
    expect(source).toContain("supabase.rpc('persist_canonical_order_atomic'")
    expect(source).not.toContain("supabase.rpc('replace_order_items_atomic'")
    expect(source).not.toContain("from('order_items').delete()")
  })

  it('marketplace_products / marketplace_inventory persistence in sync.ts uses upsert only, never delete', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')
    expect(source).not.toMatch(/marketplace_products['"]\)[\s\S]{0,40}\.delete\(/)
    expect(source).not.toMatch(/marketplace_inventory['"]\)[\s\S]{0,40}\.delete\(/)
  })
})

// -----------------------------------------------------------------------
// Gap #7: after a controlled yield (time budget reached, not a hang), the
// run must be left `queued`, never `running` — otherwise reclaimStaleVtexRun
// (5-minute heartbeat threshold) could treat it as stale before the cron's
// own 15-minute interval gets a chance to resume it normally.
// -----------------------------------------------------------------------
describe('yield vs stale semantics (post-yield status)', () => {
  it('sync.ts never returns status "running" from a mid-stage yield point', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')
    // All mid-run early returns must carry status: 'queued', not 'running' —
    // 'running' is only ever set once, at the very start of processing.
    const midRunReturns = [...source.matchAll(/return \{ \.\.\.run, checkpoint, counts, errors, status: '(\w+)' \}/g)].map((m) => m[1])
    expect(midRunReturns.length).toBeGreaterThan(0)
    expect(midRunReturns.every((status) => status === 'queued')).toBe(true)
  })
})

// -----------------------------------------------------------------------
// Audit gap #5: a 401/403 while fetching an individual order (getOrder)
// used to be swallowed exactly like any other item-level error — the order
// stage kept grinding through every remaining item in the page/window with
// a revoked credential until the time budget or page traversal ran
// out, instead of stopping fast like the catalog stage already does.
// -----------------------------------------------------------------------
describe('orders stage stops on VTEX 401/403 instead of retrying item by item (static source check)', () => {
  it('the order item handler detects VtexApiError 401/403 and sets a flag that breaks the page loop', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')
    expect(source).toContain('ordersPermissionDenied = true')
    // The flag must terminate the run as partial — never leave it queued in
    // an infinite retry loop with credentials that cannot read OMS.
    expect(source).toMatch(/if \(ordersPermissionDenied\) \{[\s\S]{0,1000}status: 'partial'[\s\S]{0,300}stage: 'complete'/)
    // Same terminal treatment already used by the catalog stage: mark the
    // connection requires_attention instead of retrying forever.
    expect(source).toMatch(/ordersPermissionDenied[\s\S]{0,700}requires_attention/)
  })
})

describe('stale reclaim split-brain guard', () => {
  it('keeps the stale threshold strictly above the maximum worker runtime', () => {
    expect(HEARTBEAT_STALE_MINUTES * 60_000).toBeGreaterThan(VTEX_MAX_RUNTIME_MS)
  })
})

describe('catalog completion safety invariants (static source check)', () => {
  it('only records success after a tenant-scoped connection update returned the target row', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')
    const finalizeStart = source.lastIndexOf('const completedAt =')
    const finalize = source.slice(finalizeStart, source.indexOf('} catch (error)', finalizeStart))

    expect(finalize).toContain(".eq('id', connection.id).eq('company_id', companyId)")
    expect(finalize).toContain(".select('id').maybeSingle()")
    expect(finalize).toContain('VTEX_CONNECTION_FINALIZE_NOT_APPLIED')
    expect(finalize.indexOf('VTEX_CONNECTION_FINALIZE_NOT_APPLIED')).toBeLessThan(finalize.indexOf("status: finalStatus, stage: 'complete'"))
    expect(finalize.indexOf("status: finalStatus, stage: 'complete'")).toBeLessThan(finalize.indexOf("eventType: errors.length > 0 ? 'sync_partial' : 'sync_success'"))
  })

  it('persists failed SKU ids for one retry and never reconciles a partial traversal', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')

    expect(source).toContain('catalogFailedSkuIds')
    expect(source).toContain('retryingFailedSkus')
    expect(source).toContain('!salesChannelComplete')
    expect(source).toContain("checkpoint.catalogStatus = 'partial'")
    expect(source).toMatch(/\['completed', 'empty'\]\.includes\(checkpoint\.catalogStatus[\s\S]{0,300}reconcileCatalogRows\(/)
    expect(source).toContain('catalogCycleStartedAt')
  })

  it('preserves the complete discovery even when a single batch times out before its tail', async () => {
    const fs = await import('node:fs')
    const path = await import('node:path')
    const source = fs.readFileSync(path.resolve(__dirname, '../src/server/integrations/vtex/sync.ts'), 'utf-8')

    expect(source).toContain('checkpoint.catalogSkuIds = skuIds.length > 0 ? skuIds : undefined')
    expect(source).not.toContain('checkpoint.catalogSkuIds = skuIds.length > SKU_BATCH_SIZE ? skuIds : undefined')
    expect(source).toContain('skuIds = checkpoint.catalogSkuIds ?? checkpoint.catalogFailedSkuIds ?? []')
    expect(source).toContain('checkpoint.skuOffset < skuIds.length')
  })
})
