import { decryptSecret } from '../crypto.js'
import { getSupabaseAdmin } from '../supabaseAdmin.js'
import { VtexClient } from './client.js'
import type { VtexConnectionTestResult, VtexCredentials, VtexDomain, VtexPermissionCheck } from './types.js'

export interface VtexConnectionRow {
  id: string
  company_id: string
  status: string
  external_account_id: string | null
  credential_key_encrypted: string | null
  credential_secret_encrypted: string | null
  provider_metadata: Record<string, unknown> | null
  permissions: Record<string, unknown> | null
  last_sync_at: string | null
  last_success_at: string | null
  next_sync_at: string | null
  failure_count: number
  circuit_open_until: string | null
  sync_started_at: string | null
}

export async function loadVtexConnection(companyId: string): Promise<VtexConnectionRow> {
  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase.from('marketplace_connections')
    .select('id, company_id, status, external_account_id, credential_key_encrypted, credential_secret_encrypted, provider_metadata, permissions, last_sync_at, last_success_at, next_sync_at, failure_count, circuit_open_until, sync_started_at')
    .eq('company_id', companyId).eq('provider', 'vtex').maybeSingle()
  if (error) throw new Error(`Failed to load VTEX connection: ${error.message}`)
  if (!data || !data.external_account_id || !data.credential_key_encrypted || !data.credential_secret_encrypted) throw new Error('VTEX_CONNECTION_MISSING')
  return data as VtexConnectionRow
}

export function credentialsFromConnection(connection: VtexConnectionRow): VtexCredentials {
  return {
    accountName: connection.external_account_id!,
    appKey: decryptSecret(connection.credential_key_encrypted!),
    appToken: decryptSecret(connection.credential_secret_encrypted!),
  }
}

async function checkPermission(domain: VtexDomain, required: boolean, fn: () => Promise<unknown>): Promise<VtexPermissionCheck> {
  try {
    await fn()
    return { domain, required, ok: true, status: 200 }
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error ? Number((error as { status: unknown }).status) : null
    return { domain, required, ok: false, status: Number.isFinite(status) ? status : null }
  }
}

export async function testVtexConnection(credentials: VtexCredentials): Promise<VtexConnectionTestResult> {
  const client = new VtexClient(credentials)
  const permissions = await Promise.all([
    checkPermission('catalog', true, () => client.getCategoryTree(1)),
    checkPermission('orders', true, () => client.listOrders('page=1&per_page=1&orderBy=creationDate,desc')),
    checkPermission('inventory', true, () => client.listWarehouses()),
    checkPermission('pricing', false, () => client.getPricingConfig()),
    checkPermission('feed', false, () => client.getFeedConfig()),
  ])
  const invalidCredential = permissions.some((permission) => permission.status === 401)
  const missingRequired = permissions.filter((permission) => permission.required && !permission.ok).map((permission) => permission.domain)
  return { accountName: credentials.accountName, valid: !invalidCredential, permissions, missingRequired }
}
