import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { getMarketplaceColor, type Marketplace } from '@/data/mockData'

export interface MarketplaceConnection {
  marketplace: Marketplace
  status: 'connected' | 'disconnected' | 'syncing' | 'error'
  lastSync: Date | null
  nextSync: Date | null
  syncInterval: number
  productsCount: number
  ordersCount: number
  errorMessage?: string
  apiKey?: string
}

export interface SyncLogEntry {
  id: string
  timestamp: Date
  marketplace: Marketplace
  action: string
  success: boolean
}

interface ConnectionContextValue {
  connections: MarketplaceConnection[]
  connect: (marketplace: Marketplace) => void
  disconnect: (marketplace: Marketplace) => void
  syncNow: (marketplace: Marketplace) => void
  setSyncInterval: (marketplace: Marketplace, minutes: number) => void
  globalSyncStatus: { connectedCount: number; syncingCount: number; errorCount: number }
  syncLog: SyncLogEntry[]
  syncAll: () => void
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null)

const STORAGE_KEY = 'acelera_connections'
const LOG_KEY = 'acelera_sync_log'

const MOCK_DATA: Record<Marketplace, { products: number; orders: number }> = {
  'Mercado Livre': { products: 142, orders: 1847 },
  'Shopee': { products: 98, orders: 923 },
  'Amazon': { products: 67, orders: 412 },
  'Loja Própria': { products: 215, orders: 2103 },
}

const ALL_MARKETPLACES: Marketplace[] = ['Mercado Livre', 'Shopee', 'Amazon', 'Loja Própria']

function makeDefault(mp: Marketplace): MarketplaceConnection {
  return { marketplace: mp, status: 'disconnected', lastSync: null, nextSync: null, syncInterval: 5, productsCount: 0, ordersCount: 0 }
}

function loadFromStorage(): MarketplaceConnection[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return ALL_MARKETPLACES.map(makeDefault)
    const parsed = JSON.parse(raw) as MarketplaceConnection[]
    return parsed.map(c => ({
      ...c,
      lastSync: c.lastSync ? new Date(c.lastSync) : null,
      nextSync: c.nextSync ? new Date(c.nextSync) : null,
    }))
  } catch {
    return ALL_MARKETPLACES.map(makeDefault)
  }
}

function loadLog(): SyncLogEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    if (!raw) return []
    return (JSON.parse(raw) as SyncLogEntry[]).map(e => ({ ...e, timestamp: new Date(e.timestamp) })).slice(0, 50)
  } catch {
    return []
  }
}

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [connections, setConnections] = useState<MarketplaceConnection[]>(loadFromStorage)
  const [syncLog, setSyncLog] = useState<SyncLogEntry[]>(loadLog)
  const timersRef = useRef<Map<Marketplace, ReturnType<typeof setInterval>>>(new Map())

  // Persist
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(connections))
  }, [connections])

  useEffect(() => {
    localStorage.setItem(LOG_KEY, JSON.stringify(syncLog))
  }, [syncLog])

  const addLog = useCallback((marketplace: Marketplace, action: string, success = true) => {
    setSyncLog(prev => [{ id: crypto.randomUUID(), timestamp: new Date(), marketplace, action, success }, ...prev].slice(0, 50))
  }, [])

  const update = useCallback((mp: Marketplace, patch: Partial<MarketplaceConnection>) => {
    setConnections(prev => prev.map(c => c.marketplace === mp ? { ...c, ...patch } : c))
  }, [])

  const finishSync = useCallback((mp: Marketplace) => {
    const mock = MOCK_DATA[mp]
    const now = new Date()
    const conn = connections.find(c => c.marketplace === mp)
    const interval = conn?.syncInterval ?? 5
    update(mp, {
      status: 'connected',
      lastSync: now,
      nextSync: new Date(now.getTime() + interval * 60_000),
      productsCount: mock.products + Math.floor(Math.random() * 5),
      ordersCount: mock.orders + Math.floor(Math.random() * 10),
    })
    addLog(mp, 'Dados sincronizados')
  }, [connections, update, addLog])

  const connect = useCallback((mp: Marketplace) => {
    update(mp, { status: 'syncing' })
    addLog(mp, 'Conexão estabelecida')
    setTimeout(() => finishSync(mp), 2000)
  }, [update, addLog, finishSync])

  const disconnect = useCallback((mp: Marketplace) => {
    const timer = timersRef.current.get(mp)
    if (timer) { clearInterval(timer); timersRef.current.delete(mp) }
    update(mp, { status: 'disconnected', lastSync: null, nextSync: null, productsCount: 0, ordersCount: 0, apiKey: undefined })
    addLog(mp, 'Conexão removida')
  }, [update, addLog])

  const syncNow = useCallback((mp: Marketplace) => {
    update(mp, { status: 'syncing' })
    addLog(mp, 'Sincronização manual iniciada')
    setTimeout(() => finishSync(mp), 2000)
  }, [update, addLog, finishSync])

  const setSyncInterval = useCallback((mp: Marketplace, minutes: number) => {
    const conn = connections.find(c => c.marketplace === mp)
    const now = new Date()
    update(mp, { syncInterval: minutes, nextSync: conn?.status === 'connected' ? new Date(now.getTime() + minutes * 60_000) : null })
  }, [connections, update])

  const syncAll = useCallback(() => {
    connections.forEach(c => { if (c.status === 'connected') syncNow(c.marketplace) })
  }, [connections, syncNow])

  // Auto-sync timers
  useEffect(() => {
    connections.forEach(c => {
      const existing = timersRef.current.get(c.marketplace)
      if (c.status === 'connected') {
        if (existing) clearInterval(existing)
        const timer = setInterval(() => {
          syncNow(c.marketplace)
        }, c.syncInterval * 60_000)
        timersRef.current.set(c.marketplace, timer)
      } else if (existing) {
        clearInterval(existing)
        timersRef.current.delete(c.marketplace)
      }
    })
    return () => { timersRef.current.forEach(t => clearInterval(t)) }
  }, [connections.map(c => `${c.marketplace}:${c.status}:${c.syncInterval}`).join(',')])

  const globalSyncStatus = {
    connectedCount: connections.filter(c => c.status === 'connected').length,
    syncingCount: connections.filter(c => c.status === 'syncing').length,
    errorCount: connections.filter(c => c.status === 'error').length,
  }

  return (
    <ConnectionContext.Provider value={{ connections, connect, disconnect, syncNow, setSyncInterval, globalSyncStatus, syncLog, syncAll }}>
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
