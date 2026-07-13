import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS, MERCADOLIVRE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { DEFAULT_COMPANY_ID, type SanitizedConnectionStatusResponse } from '../../src/server/integrations/types.js'

type StatusResponse = SanitizedConnectionStatusResponse & { ok: boolean; source: string; message?: string }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missingCore = getMissingEnvVars(CORE_ENV_VARS)
    if (missingCore.length > 0) {
      const response: StatusResponse = {
        ok: false,
        source: 'config_missing',
        provider: 'mercadolivre',
        status: 'config_missing',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        lastError: null,
        message: 'Configuração do Supabase pendente.',
      }
      res.status(200).json(response)
      return
    }

    const missingMl = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
    if (missingMl.length > 0) {
      const response: StatusResponse = {
        ok: false,
        source: 'config_missing',
        provider: 'mercadolivre',
        status: 'config_missing',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        lastError: null,
        message: 'Credenciais do Mercado Livre ainda não configuradas.',
      }
      res.status(200).json(response)
      return
    }

    const supabase = await getSupabaseAdmin()
    const { data: connection, error } = await supabase
      .from('marketplace_connections')
      .select('id, status, external_account_id, last_sync_at, last_error, token_expires_at')
      .eq('provider', 'mercadolivre')
      .eq('company_id', DEFAULT_COMPANY_ID)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!connection) {
      const response: StatusResponse = {
        ok: true,
        source: 'demo',
        provider: 'mercadolivre',
        status: 'disconnected',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        lastError: null,
      }
      res.status(200).json(response)
      return
    }

    const isExpired = connection.status === 'connected' && connection.token_expires_at && new Date(connection.token_expires_at) < new Date()

    const [{ count: productsCount }, { count: inventoryCount }] = await Promise.all([
      supabase.from('marketplace_products').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id),
      supabase.from('marketplace_inventory').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id),
    ])

    const finalStatus = isExpired ? 'expired' : connection.status
    const response: StatusResponse = {
      ok: true,
      source: finalStatus === 'connected' ? 'real' : 'demo',
      provider: 'mercadolivre',
      status: finalStatus,
      lastSyncAt: connection.last_sync_at,
      externalAccountId: connection.external_account_id,
      productsCount: productsCount ?? 0,
      inventoryCount: inventoryCount ?? 0,
      lastError: connection.last_error,
    }
    res.status(200).json(response)
  } catch (err) {
    console.error('[api/integrations/status]', err)
    const response: StatusResponse = {
      ok: false,
      source: 'error',
      provider: 'mercadolivre',
      status: 'error',
      lastSyncAt: null,
      externalAccountId: null,
      productsCount: 0,
      inventoryCount: 0,
      lastError: null,
      message: 'Erro controlado ao consultar status da integração.',
    }
    res.status(200).json(response)
  }
}
