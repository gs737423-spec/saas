export type Provider = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'loja_propria'

export type ConnectionStatus = 'disconnected' | 'pending' | 'connected' | 'error' | 'expired'

/** Extra status the UI can show that is never persisted in the DB — computed when required env vars are missing. */
export type SanitizedConnectionStatus = ConnectionStatus | 'config_missing'

export interface MarketplaceConnectionRow {
  id: string
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

export type SyncLogStatus = 'info' | 'success' | 'error'

export interface SyncSummary {
  productsImported: number
  inventoryUpdated: number
  errors: string[]
  durationMs: number
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
