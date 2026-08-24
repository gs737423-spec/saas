import type { getSupabaseAdmin } from './supabaseAdmin.js'

type SupabaseAdmin = Awaited<ReturnType<typeof getSupabaseAdmin>>

/** Marks rows missing from a proven-complete catalog cycle as inactive.
 * Never deletes data and always scopes by tenant plus connection. */
export async function reconcileCatalogRows(
  supabase: SupabaseAdmin,
  companyId: string,
  connectionId: string,
  cycleStartedAt: string
): Promise<void> {
  const { error } = await supabase.rpc('reconcile_catalog_rows_atomic', {
    p_company_id: companyId,
    p_connection_id: connectionId,
    p_cycle_started_at: cycleStartedAt,
  })
  if (error) throw new Error(`Failed to reconcile catalog atomically: ${error.message}`)
}
