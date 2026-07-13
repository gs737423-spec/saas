import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin'
import { DEFAULT_COMPANY_ID, type DashboardInventoryItem, type DashboardInventoryResponse } from '../../src/server/integrations/types'

type InventoryApiResponse = DashboardInventoryResponse & { ok: boolean; message?: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(CORE_ENV_VARS)
    if (missing.length > 0) {
      const response: InventoryApiResponse = { ok: false, source: 'config_missing', items: [], lastSyncAt: null, message: 'Configuração do Supabase pendente.' }
      res.status(200).json(response)
      return
    }

    const supabase = await getSupabaseAdmin()

    const { data: connection, error: connError } = await supabase
      .from('marketplace_connections')
      .select('id, status, last_sync_at')
      .eq('provider', 'mercadolivre')
      .eq('company_id', DEFAULT_COMPANY_ID)
      .maybeSingle()

    if (connError) throw new Error(connError.message)

    if (!connection || connection.status !== 'connected') {
      const response: InventoryApiResponse = { ok: true, source: 'demo', items: [], lastSyncAt: null }
      res.status(200).json(response)
      return
    }

    const { data: inventoryRows, error: invError } = await supabase
      .from('marketplace_inventory')
      .select('external_product_id, sku, title, available_quantity, sold_quantity_30d, last_sync_at')
      .eq('connection_id', connection.id)
      .eq('company_id', DEFAULT_COMPANY_ID)

    if (invError) throw new Error(invError.message)

    if (!inventoryRows || inventoryRows.length === 0) {
      // Connected but no sync has run yet — still demo until real data exists,
      // never fabricate numbers to look "connected".
      const response: InventoryApiResponse = { ok: true, source: 'demo', items: [], lastSyncAt: connection.last_sync_at }
      res.status(200).json(response)
      return
    }

    const { data: productRows } = await supabase
      .from('marketplace_products')
      .select('external_product_id, price, status')
      .eq('connection_id', connection.id)
      .eq('company_id', DEFAULT_COMPANY_ID)

    const productByExternalId = new Map((productRows ?? []).map((p) => [p.external_product_id, p]))

    const items: DashboardInventoryItem[] = inventoryRows.map((row) => {
      const product = productByExternalId.get(row.external_product_id)
      return {
        sku: row.sku,
        title: row.title,
        marketplace: 'Mercado Livre',
        availableQuantity: row.available_quantity,
        price: product?.price ?? null,
        status: product?.status ?? null,
        soldQuantity: row.sold_quantity_30d,
        lastSyncAt: row.last_sync_at,
      }
    })

    const response: InventoryApiResponse = { ok: true, source: 'real', items, lastSyncAt: connection.last_sync_at }
    res.status(200).json(response)
  } catch (err) {
    console.error('[api/dashboard/inventory]', err)
    const response: InventoryApiResponse = { ok: false, source: 'error', items: [], lastSyncAt: null, message: 'Erro controlado ao consultar estoque.' }
    res.status(200).json(response)
  }
}
