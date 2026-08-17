import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getMarketplaceColor } from '@/data/mockData'
import { supabase } from '@/lib/supabaseClient'
import { withViewAsCompanyId } from '@/lib/apiFetch'

export type IntegrationStatus = 'disconnected' | 'pending' | 'connecting' | 'connected' | 'syncing' | 'requires_attention' | 'error' | 'expired' | 'config_missing'

export interface MercadoLivreStatus {
  provider: 'mercadolivre'
  status: IntegrationStatus
  lastSyncAt: string | null
  externalAccountId: string | null
  productsCount: number
  inventoryCount: number
  ordersCount: number
  lastError: string | null
}

export interface ShopeeStatus {
  provider: 'shopee'
  status: IntegrationStatus
  lastSyncAt: string | null
  externalAccountId: string | null
  productsCount: number
  inventoryCount: number
  ordersCount: number
  lastError: string | null
}

export interface VtexStatus {
  provider: 'vtex'
  status: IntegrationStatus
  lastSyncAt: string | null
  lastSuccessAt?: string | null
  nextSyncAt?: string | null
  externalAccountId: string | null
  productsCount: number
  inventoryCount: number
  ordersCount: number
  lastError: string | null
  permissions?: Record<string, boolean>
  channelMappings?: Record<string, string[]>
  activeSync?: { id: string; status: string; stage: string; counts: Record<string, number> } | null
}

export interface VtexCredentialsInput { accountName: string; appKey: string; appToken: string; channelMappings?: Record<string, string[]> }

export interface VtexSyncResponse {
  ok: boolean
  message?: string
  run?: { id: string; mode: 'full' | 'incremental'; status: string; stage: string }
}

export interface SyncLogEntry {
  id: string
  provider: string
  eventType: string
  status: 'info' | 'success' | 'error'
  message: string | null
  createdAt: string
}

interface SyncSummary {
  productsImported: number
  inventoryUpdated: number
  ordersImported: number
  errors: string[]
  durationMs: number
  source: 'real' | 'demo' | 'config_missing'
}

interface ConnectionContextValue {
  mercadoLivre: MercadoLivreStatus | null
  shopee: ShopeeStatus | null
  vtex: VtexStatus | null
  loading: boolean
  syncing: boolean
  syncingShopee: boolean
  syncingVtex: boolean
  /** True once a fetch to /api/integrations/status has genuinely failed (network
   *  error, non-200, backend unreachable) — distinct from `loading`, so the UI
   *  can show "backend indisponível" instead of spinning forever. This never
   *  happens for config_missing, which is a normal 200 response body. */
  backendUnreachable: boolean
  /** Motivo real da última falha de /api/integrations/status quando não-200
   *  (ex.: admin sem ?company_id=, usuário sem empresa vinculada) — para
   *  distinguir de uma falha de rede genuína, cuja causa não temos como saber. */
  statusErrorMessage: string | null
  logs: SyncLogEntry[]
  /** Mensagem da última tentativa de conectar que falhou (env var faltando,
   *  sessão sem empresa, etc) — null quando não há erro pendente. */
  connectError: string | null
  connectErrorShopee: string | null
  connectErrorVtex: string | null
  refresh: () => Promise<void>
  connectMercadoLivre: () => void
  connectShopee: () => void
  syncMercadoLivre: () => Promise<SyncSummary | null>
  syncShopee: () => Promise<SyncSummary | null>
  connectVtex: (credentials: VtexCredentialsInput) => Promise<boolean>
  rotateVtexCredentials: (credentials: VtexCredentialsInput) => Promise<boolean>
  disconnectVtex: () => Promise<boolean>
  syncVtex: (mode?: 'full' | 'incremental') => Promise<VtexSyncResponse | null>
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

// Endpoints em api/integrations/** e api/dashboard/** exigem sessão — o
// access_token do Supabase Auth vai no header Authorization em toda chamada.
async function authHeader(): Promise<HeadersInit> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const headers = { ...(await authHeader()), ...(init?.headers ?? {}) }
    const res = await fetch(withViewAsCompanyId(url, init), { ...init, headers })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Como fetchJson, mas preserva a mensagem de erro de respostas não-200 (o
 *  corpo de erro dos endpoints api/** sempre tem { message }) — para exibir
 *  o motivo real em vez de tratar todo não-200 como "backend inatingível". */
async function fetchJsonWithError<T>(url: string, init?: RequestInit): Promise<{ data: T | null; message: string | null }> {
  try {
    const headers = { ...(await authHeader()), ...(init?.headers ?? {}) }
    const res = await fetch(withViewAsCompanyId(url, init), { ...init, headers })
    const body = await res.json().catch(() => null)
    if (!res.ok) return { data: null, message: body?.message ?? null }
    return { data: body as T, message: null }
  } catch {
    return { data: null, message: null }
  }
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [mercadoLivre, setMercadoLivre] = useState<MercadoLivreStatus | null>(null)
  const [shopee, setShopee] = useState<ShopeeStatus | null>(null)
  const [vtex, setVtex] = useState<VtexStatus | null>(null)
  const [logs, setLogs] = useState<SyncLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [syncingShopee, setSyncingShopee] = useState(false)
  const [syncingVtex, setSyncingVtex] = useState(false)
  const [backendUnreachable, setBackendUnreachable] = useState(false)
  const [statusErrorMessage, setStatusErrorMessage] = useState<string | null>(null)
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connectErrorShopee, setConnectErrorShopee] = useState<string | null>(null)
  const [connectErrorVtex, setConnectErrorVtex] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [{ data: status, message }, { data: shopeeStatus }, { data: vtexStatus }, logsResponse] = await Promise.all([
      fetchJsonWithError<MercadoLivreStatus>('/api/integrations/status'),
      fetchJsonWithError<ShopeeStatus>('/api/integrations/status?provider=shopee'),
      fetchJsonWithError<VtexStatus>('/api/integrations/status?provider=vtex'),
      fetchJson<{ logs: SyncLogEntry[] }>('/api/integrations/logs?limit=20'),
    ])
    if (status) setMercadoLivre(status)
    if (shopeeStatus) setShopee(shopeeStatus)
    if (vtexStatus) setVtex(vtexStatus)
    if (logsResponse) setLogs(logsResponse.logs)
    // status is only ever null here if the request itself failed — every real
    // response (including config_missing) is a 200 with a body.
    setBackendUnreachable(!status)
    setStatusErrorMessage(status ? null : message)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const connectMercadoLivre = useCallback(async () => {
    // Busca a URL de autorização autenticado (o endpoint exige sessão) e só
    // então navega — um <a href> ou location.href direto não carregaria o
    // Bearer token. Redirect real pro Mercado Livre, nunca simulado.
    setConnectError(null)
    try {
      const headers = await authHeader()
      const res = await fetch('/api/integrations/mercadolivre/authorize', { headers })
      const body = (await res.json().catch(() => null)) as { ok: boolean; url?: string; message?: string } | null
      if (body?.url) {
        window.location.href = body.url
        return
      }
      setConnectError(body?.message ?? 'Não foi possível iniciar a conexão com o Mercado Livre.')
    } catch {
      setConnectError('Não foi possível iniciar a conexão com o Mercado Livre.')
    }
  }, [])

  const connectShopee = useCallback(async () => {
    setConnectErrorShopee(null)
    try {
      const headers = await authHeader()
      const res = await fetch('/api/integrations/shopee/authorize', { headers })
      const body = (await res.json().catch(() => null)) as { ok: boolean; url?: string; message?: string } | null
      if (body?.url) {
        window.location.href = body.url
        return
      }
      setConnectErrorShopee(body?.message ?? 'Não foi possível iniciar a conexão com a Shopee.')
    } catch {
      setConnectErrorShopee('Não foi possível iniciar a conexão com a Shopee.')
    }
  }, [])

  const syncMercadoLivre = useCallback(async () => {
    setSyncing(true)
    try {
      const summary = await fetchJson<SyncSummary>('/api/integrations/mercadolivre/sync', { method: 'POST' })
      await refresh()
      return summary
    } finally {
      setSyncing(false)
    }
  }, [refresh])

  const syncShopee = useCallback(async () => {
    setSyncingShopee(true)
    try {
      const summary = await fetchJson<SyncSummary>('/api/integrations/shopee/sync', { method: 'POST' })
      await refresh()
      return summary
    } finally {
      setSyncingShopee(false)
    }
  }, [refresh])

  const connectVtex = useCallback(async (credentials: VtexCredentialsInput) => {
    setConnectErrorVtex(null)
    const { data, message } = await fetchJsonWithError<{ ok: boolean; message?: string }>('/api/integrations/vtex/connect', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
    if (!data?.ok) { setConnectErrorVtex(data?.message ?? message ?? 'Não foi possível conectar a VTEX.'); return false }
    await refresh()
    return true
  }, [refresh])

  const rotateVtexCredentials = useCallback(async (credentials: VtexCredentialsInput) => {
    setConnectErrorVtex(null)
    const { data, message } = await fetchJsonWithError<{ ok: boolean; message?: string }>('/api/integrations/vtex/credentials', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(credentials) })
    if (!data?.ok) { setConnectErrorVtex(data?.message ?? message ?? 'As novas credenciais não foram aplicadas.'); return false }
    await refresh()
    return true
  }, [refresh])

  const disconnectVtex = useCallback(async () => {
    const { data } = await fetchJsonWithError<{ ok: boolean }>('/api/integrations/vtex/disconnect', { method: 'DELETE' })
    if (!data?.ok) return false
    await refresh()
    return true
  }, [refresh])

  const syncVtex = useCallback(async (mode: 'full' | 'incremental' = 'full') => {
    setConnectErrorVtex(null)
    setSyncingVtex(true)
    try {
      const { data: result, message } = await fetchJsonWithError<VtexSyncResponse>('/api/integrations/vtex/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mode }) })
      if (!result?.ok) setConnectErrorVtex(result?.message ?? message ?? 'Não foi possível iniciar a sincronização VTEX.')
      await refresh()
      return result
    } finally { setSyncingVtex(false) }
  }, [refresh])

  return (
    <ConnectionContext.Provider
      value={{
        mercadoLivre,
        shopee,
        vtex,
        loading,
        syncing,
        syncingShopee,
        syncingVtex,
        backendUnreachable,
        statusErrorMessage,
        logs,
        connectError,
        connectErrorShopee,
        connectErrorVtex,
        refresh,
        connectMercadoLivre,
        connectShopee,
        syncMercadoLivre,
        syncShopee,
        connectVtex,
        rotateVtexCredentials,
        disconnectVtex,
        syncVtex,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  )
}

export function useConnections() {
  const ctx = useContext(ConnectionContext)
  if (!ctx) throw new Error('useConnections must be used within ConnectionProvider')
  return ctx
}

export { getMarketplaceColor }
