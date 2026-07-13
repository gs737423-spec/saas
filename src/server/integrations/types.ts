export type Provider = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'loja_propria'

/**
 * No real auth/multi-tenant system exists yet. Every row is scoped to this
 * fixed id so the schema/queries never mix tenants once real workspaces
 * exist — swapping this constant for a real `workspace_id` from an auth
 * session is the only change needed later.
 */
export const DEFAULT_COMPANY_ID = 'default-company'

export type ConnectionStatus = 'disconnected' | 'pending' | 'connected' | 'error' | 'expired'

/** Extra status the UI can show that is never persisted in the DB — computed when required env vars are missing. */
export type SanitizedConnectionStatus = ConnectionStatus | 'config_missing'

export interface MarketplaceConnectionRow {
  id: string
  company_id: string
  provider: Provider
  status: ConnectionStatus
  external_account_id: string | null
  seller_id: string | null
  access_token_encrypted: string | null
  refresh_token_encrypted: string | null
  token_expires_at: string | null
  scopes: string | null
  sync_interval_minutes: number
  last_sync_at: string | null
  last_error: string | null
  created_at: string
  updated_at: string
}

/** What the frontend is allowed to see. Never include token fields here. */
export interface SanitizedConnectionStatusResponse {
  provider: Provider
  status: SanitizedConnectionStatus
  lastSyncAt: string | null
  externalAccountId: string | null
  productsCount: number
  inventoryCount: number
  lastError: string | null
}

export interface SanitizedSyncLogEntry {
  id: string
  provider: Provider
  eventType: SyncLogEventType
  status: SyncLogStatus
  message: string | null
  createdAt: string
}

export type SyncLogEventType =
  | 'oauth_started'
  | 'oauth_connected'
  | 'oauth_error'
  | 'token_refreshed'
  | 'sync_started'
  | 'sync_success'
  | 'sync_error'
  | 'sync_partial'
  | 'validation_error'
  | 'config_missing'
  | 'connection_missing'

export type SyncLogStatus = 'info' | 'success' | 'error'

export type SyncSource = 'real' | 'demo' | 'config_missing'

export interface DashboardInventoryItem {
  sku: string | null
  title: string
  marketplace: 'Mercado Livre'
  availableQuantity: number
  price: number | null
  status: string | null
  soldQuantity: number | null
  lastSyncAt: string | null
}

export type DashboardInventorySource = 'real' | 'demo' | 'config_missing'

export interface DashboardInventoryResponse {
  source: DashboardInventorySource
  items: DashboardInventoryItem[]
  lastSyncAt: string | null
}

export interface SyncSummary {
  productsImported: number
  inventoryUpdated: number
  errors: string[]
  durationMs: number
  source: SyncSource
}

/**
 * Shape every provider connector will eventually implement. Only `mercadolivre`
 * has a real implementation right now — the others are not wired to any route.
 */
export interface MarketplaceConnector {
  provider: Provider
  getAuthorizationUrl(state: string): string
  handleCallback(code: string): Promise<{ externalAccountId: string; accessToken: string; refreshToken: string; expiresInSeconds: number; scopes: string }>
  sync(connectionId: string): Promise<SyncSummary>
}
