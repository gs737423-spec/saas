import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('VTEX integration security boundaries', () => {
  it.each(['connect.ts', 'credentials.ts', 'disconnect.ts', 'sync.ts', 'channel-mappings.ts'])('%s requires marketplace management capability', (file) => {
    const source = readFileSync(resolve('api/integrations/vtex', file), 'utf8')
    expect(source).toContain("requireCapability(req, res, 'marketplaces.manage')")
  })

  it('keeps secret material encrypted and out of status responses', () => {
    const connect = readFileSync(resolve('api/integrations/vtex/connect.ts'), 'utf8')
    const status = readFileSync(resolve('api/integrations/status.ts'), 'utf8')
    expect(connect).toContain('encryptSecret(credentials.appKey)')
    expect(connect).toContain('encryptSecret(credentials.appToken)')
    expect(status).not.toContain('credential_key_encrypted')
    expect(status).not.toContain('credential_secret_encrypted')
  })

  it('adds tenant RLS and protects new tables from company deletion bypass', () => {
    const migration = readFileSync(resolve('supabase/migrations/019_vtex_native_integration.sql'), 'utf8')
    for (const table of ['marketplace_categories', 'marketplace_inventory_sources', 'integration_sync_runs', 'order_source_refs', 'sales_channels', 'vtex_channel_mappings']) {
      expect(migration).toContain(`alter table public.${table} enable row level security`)
      const dependency = table === 'integration_sync_runs' ? 'syncRuns'
        : table === 'order_source_refs' ? 'orderSourceRefs'
          : table === 'marketplace_categories' ? 'categories'
            : table === 'marketplace_inventory_sources' ? 'inventorySources'
              : table === 'sales_channels' ? 'salesChannels' : 'vtexChannelMappings'
      expect(migration).toContain(`'${dependency}'`)
    }
  })

  it('backfills direct channels without treating VTEX or unknown providers as own store', () => {
    const migration = readFileSync(resolve('supabase/migrations/019_vtex_native_integration.sql'), 'utf8')
    expect(migration).toContain("provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria') then provider")
    expect(migration).toContain("else 'external:vtex:unmapped'")
    expect(migration).toContain("channel_resolution_status in ('resolved', 'unresolved', 'ignored')")
    expect(migration).toContain('analytics_included = true')
    expect(migration).toContain("'VTEX_CHANNEL_MAPPING_REQUIRED'")
    expect(migration).not.toMatch(/else\s+'loja_propria'/i)
    expect(migration).toContain('references public.sales_channels (company_id, canonical_key)')
    expect(migration).not.toMatch(/sales_channel[^\n]+in\s*\(\s*'mercadolivre'/i)
  })

  it('verifies Magalu mapping and keeps unresolved VTEX revenue globally eligible', () => {
    const verify = readFileSync(resolve('supabase/manual/019_verify.sql'), 'utf8')
    expect(verify).toContain('magalu_misclassified_as_non_magalu')
    expect(verify).toContain('vtex_unresolved_excluded_from_global_analytics')
    expect(verify).toContain('order_without_registered_channel')
    expect(verify).toContain('vtex_marketplace_signal_misclassified_as_own_store')
  })

  it('keeps unresolved orders out of every central analytics query', () => {
    for (const file of ['summary.ts', 'finance.ts', 'finance-daily.ts', 'products.ts', 'inventory.ts']) {
      const source = readFileSync(resolve('api/dashboard', file), 'utf8')
      expect(source, file).toMatch(/\.eq\(['"](?:orders\.)?analytics_included['"], true\)/)
    }
  })

  it('preserves stored mappings and accepts dynamic canonical channels', () => {
    const source = readFileSync(resolve('api/integrations/vtex/channel-mappings.ts'), 'utf8')
    const validation = readFileSync(resolve('src/server/integrations/vtex/validation.ts'), 'utf8')
    expect(source).toContain('...(current.provider_metadata?.channelMappings ?? {})')
    expect(validation).toContain('Object.entries(input)')
    expect(validation).not.toContain("return { mercadolivre:")
  })

  it('persists tenant-scoped VTEX channel discovery and does not turn it into a sync error', () => {
    const registry = readFileSync(resolve('src/server/integrations/vtex/channelRegistry.ts'), 'utf8')
    const sync = readFileSync(resolve('src/server/integrations/vtex/sync.ts'), 'utf8')
    expect(registry).toContain(".eq('company_id', companyId)")
    expect(registry).toContain(".eq('connection_id', connectionId)")
    expect(sync).toContain("eventType: 'channel_discovered'")
    expect(sync).not.toContain('excluded from analytics')
  })

  it('filters automatic syncs by credentials, due time, durable circuit and valid lock', () => {
    const cron = readFileSync(resolve('api/cron/sync-vtex.ts'), 'utf8')
    expect(cron).toContain(".not('credential_key_encrypted', 'is', null)")
    expect(cron).toContain(".not('credential_secret_encrypted', 'is', null)")
    expect(cron).toContain('next_sync_at.is.null,next_sync_at.lte.')
    expect(cron).toContain('circuit_open_until.is.null,circuit_open_until.lte.')
    expect(cron).toContain('sync_started_at.is.null,sync_started_at.lt.')
    expect(cron).toContain("queueVtexSync(connection.company_id, 'incremental', 'auto')")
    expect(cron).not.toContain('results:')
  })

  it('keeps manual sync explicit, lock-safe and unable to bypass the durable circuit', () => {
    const endpoint = readFileSync(resolve('api/integrations/vtex/sync.ts'), 'utf8')
    const sync = readFileSync(resolve('src/server/integrations/vtex/sync.ts'), 'utf8')
    expect(endpoint).toContain("queueVtexSync(auth.companyId, mode, 'manual')")
    expect(sync).toContain('assertVtexCircuitClosed(connection.circuit_open_until)')
    expect(sync).toContain("trigger === 'auto'")
    expect(sync).toMatch(/finally\s*{\s*await releaseSyncLock/)
  })

  it('fails the VTEX cron closed and returns aggregate-only observability', () => {
    const cron = readFileSync(resolve('api/cron/sync-vtex.ts'), 'utf8')
    expect(cron).toContain('if (!cronSecret)')
    expect(cron).toContain('req.headers.authorization !== `Bearer ${cronSecret}`')
    for (const metric of ['connectionsChecked', 'connectionsDue', 'connectionsSkippedNotDue', 'connectionsSkippedCircuitOpen', 'connectionsSkippedLocked', 'syncsStarted', 'syncsSucceeded', 'syncsPartial', 'syncsFailed']) {
      expect(cron).toContain(metric)
    }
    expect(cron).not.toMatch(/res\.status\(200\).*companyId/s)
  })

  it('lists and resolves discovered channels only inside the authenticated tenant and connection', () => {
    const endpoint = readFileSync(resolve('api/integrations/vtex/channel-mappings.ts'), 'utf8')
    expect(endpoint).toContain("from('vtex_channel_mappings')")
    expect(endpoint).toContain("from('sales_channels')")
    expect(endpoint).toContain(".eq('company_id', auth.companyId)")
    expect(endpoint).toContain(".eq('connection_id', current.id)")
    expect(endpoint).toContain("resolution_status: 'resolved'")
    expect(endpoint).toContain('requiresFullSync: true')
  })
})
