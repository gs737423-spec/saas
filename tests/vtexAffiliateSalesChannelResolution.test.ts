import { describe, expect, it, vi } from 'vitest'
import { VtexClient } from '../src/server/integrations/vtex/client'
import { autoResolveVtexAffiliatesFromSalesChannels } from '../src/server/integrations/vtex/channelRegistry'

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))

const credentials = { accountName: 'tenant', appKey: 'key', appToken: 'token' }

function makeClient(channels: Array<{ Id: string; Name: string }>) {
  return new VtexClient(credentials, {
    fetchImpl: vi.fn(async () => new Response(JSON.stringify(channels), { status: 200 })) as unknown as typeof fetch,
  })
}

function makeSupabase(refChannels: string[], resolutionSource = 'unresolved', updateApplied = true) {
  const mappingUpdates: Array<Record<string, unknown>> = []
  const channelUpserts: Array<Record<string, unknown>> = []
  const orderUpdates: Array<Record<string, unknown>> = []
  function from(table: string) {
    let selected = ''
    let operation: 'select' | 'update' = 'select'
    let payload: Record<string, unknown> = {}
    const builder = {
      select(columns: string) { selected = columns; return builder },
      update(value: Record<string, unknown>) { operation = 'update'; payload = value; return builder },
      upsert(value: Record<string, unknown>) {
        if (table === 'sales_channels') channelUpserts.push(value)
        return Promise.resolve({ error: null })
      },
      eq() { return builder }, neq() { return builder }, not() { return builder }, is() { return builder }, or() { return builder },
      in() {
        if (operation === 'update' && table === 'orders') orderUpdates.push(payload)
        return Promise.resolve({ error: null })
      },
      range() {
        if (table === 'order_source_refs' && selected === 'external_sales_channel') {
          return Promise.resolve({ data: refChannels.map((value) => ({ external_sales_channel: value })), error: null })
        }
        return Promise.resolve({ data: [], error: null })
      },
      limit() {
        if (table === 'order_source_refs' && selected === 'id, order_id') {
          return Promise.resolve({ data: [{ id: 'ref-1', order_id: 'order-1' }], error: null })
        }
        return Promise.resolve({ data: [], error: null })
      },
      maybeSingle() {
        return Promise.resolve({ data: {
          id: 'mapping-1', resolution_source: resolutionSource,
          resolution_status: resolutionSource === 'mapping' ? 'resolved' : 'unresolved',
          canonical_channel: resolutionSource === 'mapping' ? 'shopee' : 'external:vtex:unmapped',
        }, error: null })
      },
      then(resolve: (value: unknown) => void) {
        if (operation === 'update') {
          if (table === 'vtex_channel_mappings') mappingUpdates.push(payload)
          resolve({ data: updateApplied ? [{ id: 'mapping-1' }] : [], error: null })
          return
        }
        if (table === 'vtex_channel_mappings' && selected.includes('identifier_value')) {
          resolve({ data: [{
            id: 'mapping-1', identifier_value: 'NVP', affiliate_id: 'NVP',
            resolution_source: resolutionSource,
            resolution_status: resolutionSource === 'mapping' ? 'resolved' : 'unresolved',
            canonical_channel: resolutionSource === 'mapping' ? 'shopee' : 'external:vtex:unmapped',
          }], error: null })
          return
        }
        resolve({ data: [], error: null })
      },
    }
    return builder
  }
  return { supabase: { from }, mappingUpdates, channelUpserts, orderUpdates }
}

describe('affiliate resolution through official VTEX sales channels', () => {
  it('uses the official sales-channel name, never the affiliate acronym', async () => {
    const state = makeSupabase(['5'])
    const result = await autoResolveVtexAffiliatesFromSalesChannels(
      makeClient([{ Id: '5', Name: 'Amazon' }]), state.supabase as never, 'company-1', 'connection-1',
    )
    expect(result).toEqual({ resolved: 1, checked: 1, ambiguous: 0, completed: true })
    expect(state.channelUpserts).toContainEqual(expect.objectContaining({ canonical_key: 'amazon', display_name: 'Amazon' }))
    expect(state.mappingUpdates).toContainEqual(expect.objectContaining({ canonical_channel: 'amazon', external_marketplace_name: 'Amazon', external_sales_channel: '5', resolution_status: 'resolved' }))
    expect(state.orderUpdates).toContainEqual(expect.objectContaining({ sales_channel: 'amazon' }))
  })

  it('keeps the affiliate unresolved when observed sales channels disagree', async () => {
    const state = makeSupabase(['5', '6'])
    const result = await autoResolveVtexAffiliatesFromSalesChannels(
      makeClient([{ Id: '5', Name: 'Amazon' }, { Id: '6', Name: 'Shopee' }]), state.supabase as never, 'company-1', 'connection-1',
    )
    expect(result).toEqual({ resolved: 0, checked: 1, ambiguous: 1, completed: true })
    expect(state.mappingUpdates).toHaveLength(0)
    expect(state.channelUpserts).toHaveLength(0)
  })

  it('never overwrites a manual mapping', async () => {
    const state = makeSupabase(['5'], 'mapping')
    const result = await autoResolveVtexAffiliatesFromSalesChannels(
      makeClient([{ Id: '5', Name: 'Amazon' }]), state.supabase as never, 'company-1', 'connection-1',
    )
    expect(result).toEqual({ resolved: 0, checked: 0, ambiguous: 0, completed: true })
    expect(state.mappingUpdates).toHaveLength(0)
  })

  it('does not mark discovery complete when its time budget is exhausted', async () => {
    const state = makeSupabase(['5'])
    const result = await autoResolveVtexAffiliatesFromSalesChannels(
      makeClient([{ Id: '5', Name: 'Amazon' }]), state.supabase as never,
      'company-1', 'connection-1', Date.now() - 1,
    )
    expect(result).toEqual({ resolved: 0, checked: 1, ambiguous: 0, completed: false })
    expect(state.mappingUpdates).toHaveLength(0)
  })

  it('does not reclassify orders when a concurrent manual mapping wins compare-and-set', async () => {
    const state = makeSupabase(['5'], 'unresolved', false)
    const result = await autoResolveVtexAffiliatesFromSalesChannels(
      makeClient([{ Id: '5', Name: 'Amazon' }]), state.supabase as never, 'company-1', 'connection-1',
    )
    expect(result).toEqual({ resolved: 0, checked: 1, ambiguous: 0, completed: true })
    expect(state.orderUpdates).toHaveLength(0)
  })
})
