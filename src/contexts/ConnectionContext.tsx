import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react'
import { getMarketplaceColor } from '@/data/mockData'

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
  logs: SyncLogEntry[]
  refresh: () => Promise<void>
  connectMercadoLivre: () => void
  syncMercadoLivre: () => Promise<SyncSummary | null>
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init)
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

  const refresh = useCallback(async () => {
    const [status, logsResponse] = await Promise.all([
      fetchJson<MercadoLivreStatus>('/api/integrations/status'),
      fetchJson<{ logs: SyncLogEntry[] }>('/api/integrations/logs?limit=20'),
    ])
    if (status) setMercadoLivre(status)
    if (logsResponse) setLogs(logsResponse.logs)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const connectMercadoLivre = useCallback(() => {
    // Real OAuth redirect — never a simulated/local state change.
    window.location.href = '/api/integrations/mercadolivre/authorize'
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
    <ConnectionContext.Provider value={{ mercadoLivre, loading, syncing, logs, refresh, connectMercadoLivre, syncMercadoLivre }}>
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
