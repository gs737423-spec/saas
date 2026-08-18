import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, CORE_ENV_VARS, MERCADOLIVRE_ENV_VARS, SHOPEE_ENV_VARS, VTEX_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import type { Provider, SanitizedConnectionStatusResponse } from '../../src/server/integrations/types.js'
import { requireCapability } from '../../src/server/auth/authorization.js'
import { HEARTBEAT_STALE_MINUTES, resolveVtexHistoryMonths } from '../../src/server/integrations/vtex/sync.js'
import { computeVtexSyncProgress } from '../../src/server/integrations/vtex/progress.js'
import { deriveVtexRunState } from '../../src/server/integrations/vtex/checkpoint.js'

type StatusResponse = SanitizedConnectionStatusResponse & { ok: boolean; source: string; message?: string }

const PROVIDER_ENV_VARS: Partial<Record<Provider, readonly string[]>> = {
  mercadolivre: MERCADOLIVRE_ENV_VARS,
  shopee: SHOPEE_ENV_VARS,
  vtex: VTEX_ENV_VARS,
}

const VALID_PROVIDERS: Provider[] = ['mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // ?provider= — default 'mercadolivre' pra manter compatibilidade com o
  // client antigo que sempre chamava sem esse parâmetro.
  const requestedProvider = typeof req.query.provider === 'string' ? req.query.provider : 'mercadolivre'
  const provider = VALID_PROVIDERS.includes(requestedProvider as Provider) ? (requestedProvider as Provider) : 'mercadolivre'

  try {
    const missingCore = getMissingEnvVars(CORE_ENV_VARS)
    if (missingCore.length > 0) {
      const response: StatusResponse = {
        ok: false,
        source: 'config_missing',
        provider,
        status: 'config_missing',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        ordersCount: 0,
        lastError: null,
        message: 'Configuração do Supabase pendente.',
      }
      res.status(200).json(response)
      return
    }

    const providerEnvVars = PROVIDER_ENV_VARS[provider]
    const missingProvider = providerEnvVars ? getMissingEnvVars(providerEnvVars) : []
    if (missingProvider.length > 0) {
      const response: StatusResponse = {
        ok: false,
        source: 'config_missing',
        provider,
        status: 'config_missing',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        ordersCount: 0,
        lastError: null,
        message: `Credenciais de ${provider} ainda não configuradas.`,
      }
      res.status(200).json(response)
      return
    }

    const auth = await requireCapability(req, res, 'marketplaces.read')
    if (!auth) return

    const supabase = await getSupabaseAdmin()
    const { data: connection, error } = await supabase
      .from('marketplace_connections')
      .select('id, status, external_account_id, last_sync_at, last_success_at, next_sync_at, last_error, token_expires_at, permissions, provider_metadata')
      .eq('provider', provider)
      .eq('company_id', auth.companyId)
      .maybeSingle()

    if (error) throw new Error(error.message)

    if (!connection) {
      const response: StatusResponse = {
        ok: true,
        source: 'demo',
        provider,
        status: 'disconnected',
        lastSyncAt: null,
        externalAccountId: null,
        productsCount: 0,
        inventoryCount: 0,
        ordersCount: 0,
        lastError: null,
      }
      res.status(200).json(response)
      return
    }

    const isExpired = connection.status === 'connected' && connection.token_expires_at && new Date(connection.token_expires_at) < new Date()

    const [{ count: productsCount }, { count: inventoryCount }, { count: ordersCount }, { data: activeSync }] = await Promise.all([
      supabase.from('marketplace_products').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id).eq('company_id', auth.companyId),
      supabase.from('marketplace_inventory').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id).eq('company_id', auth.companyId),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('connection_id', connection.id).eq('company_id', auth.companyId),
      provider === 'vtex'
        ? supabase.from('integration_sync_runs').select('id, status, stage, checkpoint, counts, errors, mode, last_heartbeat_at, started_at').eq('connection_id', connection.id).eq('company_id', auth.companyId).in('status', ['queued', 'running']).order('created_at', { ascending: false }).limit(1).maybeSingle()
        : Promise.resolve({ data: null }),
    ])

    const finalStatus = isExpired ? 'expired' : connection.status
    const response: StatusResponse = {
      ok: true,
      source: finalStatus === 'connected' ? 'real' : 'demo',
      provider,
      status: finalStatus,
      lastSyncAt: connection.last_sync_at,
      externalAccountId: connection.external_account_id,
      productsCount: productsCount ?? 0,
      inventoryCount: inventoryCount ?? 0,
      ordersCount: ordersCount ?? 0,
      lastError: connection.last_error,
      lastSuccessAt: connection.last_success_at,
      nextSyncAt: connection.next_sync_at,
      permissions: connection.permissions ?? undefined,
      channelMappings: provider === 'vtex' ? (connection.provider_metadata?.channelMappings ?? {}) : undefined,
      historyMonths: provider === 'vtex' ? resolveVtexHistoryMonths(connection.provider_metadata) : undefined,
      activeSync: activeSync ? (() => {
        const heartbeatAt = activeSync.last_heartbeat_at ?? activeSync.started_at ?? null
        // UM estado só, derivado num lugar só (`deriveVtexRunState`). Antes,
        // `status` e `isStale` eram calculados separadamente e a UI conseguia
        // mostrar "sincronizando" e "interrompida" ao mesmo tempo.
        // `queued` depois de um yield controlado (orçamento de tempo estourado,
        // não travamento) continua sendo estado NORMAL enquanto espera o
        // próximo tick do cron — nunca alerta. Só `running` sem heartbeat
        // recente vira `requires_attention`.
        const state = deriveVtexRunState({
          status: activeSync.status,
          stage: activeSync.stage,
          lastHeartbeatAt: activeSync.last_heartbeat_at,
          startedAt: activeSync.started_at,
          errorCount: Array.isArray(activeSync.errors) ? activeSync.errors.length : 0,
          staleAfterMs: HEARTBEAT_STALE_MINUTES * 60 * 1000,
        })
        const isStale = state === 'requires_attention'
        return {
          id: activeSync.id,
          status: activeSync.status,
          state,
          stage: activeSync.stage,
          mode: activeSync.mode,
          counts: activeSync.counts ?? {},
          errorCount: Array.isArray(activeSync.errors) ? activeSync.errors.length : 0,
          history: { start: activeSync.checkpoint?.orderHistoryStart ?? null, end: activeSync.checkpoint?.orderTargetEnd ?? null },
          progress: computeVtexSyncProgress(activeSync.stage, activeSync.checkpoint, activeSync.counts),
          lastHeartbeatAt: heartbeatAt,
          isStale,
          catalogStatus: activeSync.checkpoint?.catalogStatus ?? 'unknown',
          catalogSkuTotal: activeSync.checkpoint?.catalogSkuTotal ?? activeSync.checkpoint?.skuTotal ?? null,
        }
      })() : null,
    }
    res.status(200).json(response)
  } catch (err) {
    console.error('[api/integrations/status]', err)
    const response: StatusResponse = {
      ok: false,
      source: 'error',
      provider,
      status: 'error',
      lastSyncAt: null,
      externalAccountId: null,
      productsCount: 0,
      inventoryCount: 0,
      ordersCount: 0,
      lastError: null,
      message: 'Erro controlado ao consultar status da integração.',
    }
    res.status(200).json(response)
  }
}
