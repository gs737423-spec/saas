import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getMarketplaceColor } from '@/data/mockData'
import { supabase } from '@/lib/supabaseClient'

export type IntegrationStatus = 'disconnected' | 'pending' | 'connected' | 'error' | 'expired' | 'config_missing'

export interface MercadoLivreStatus {
  provider: 'mercadolivre'
  status: IntegrationStatus
  lastSyncAt: string | null
  externalAccountId: string | null
  productsCount: number
  inventoryCount: number
  lastError: string | null
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
  errors: string[]
  durationMs: number
  source: 'real' | 'demo' | 'config_missing'
}

interface ConnectionContextValue {
  mercadoLivre: MercadoLivreStatus | null
  loading: boolean
  syncing: boolean
  /** True once a fetch to /api/integrations/status has genuinely failed (network
   *  error, non-200, backend unreachable) — distinct from `loading`, so the UI
   *  can show "backend indisponível" instead of spinning forever. This never
   *  happens for config_missing, which is a normal 200 response body. */
  backendUnreachable: boolean
  logs: SyncLogEntry[]
  /** Mensagem da última tentativa de conectar que falhou (env var faltando,
   *  sessão sem empresa, etc) — null quando não há erro pendente. */
  connectError: string | null
  refresh: () => Promise<void>
  connectMercadoLivre: () => void
  syncMercadoLivre: () => Promise<SyncSummary | null>
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
    const res = await fetch(url, { ...init, headers })
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [mercadoLivre, setMercadoLivre] = useState<MercadoLivreStatus | null>(null)
  const [logs, setLogs] = useState<SyncLogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [backendUnreachable, setBackendUnreachable] = useState(false)
  const [connectError, setConnectError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const [status, logsResponse] = await Promise.all([
      fetchJson<MercadoLivreStatus>('/api/integrations/status'),
      fetchJson<{ logs: SyncLogEntry[] }>('/api/integrations/logs?limit=20'),
    ])
    if (status) setMercadoLivre(status)
    if (logsResponse) setLogs(logsResponse.logs)
    // status is only ever null here if the request itself failed — every real
    // response (including config_missing) is a 200 with a body.
    setBackendUnreachable(!status)
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

  return (
    <ConnectionContext.Provider value={{ mercadoLivre, loading, syncing, backendUnreachable, logs, connectError, refresh, connectMercadoLivre, syncMercadoLivre }}>
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
