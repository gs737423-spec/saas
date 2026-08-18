import type { Marketplace } from '@/data/mockData'

export type Provider = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'loja_propria' | 'vtex'

/**
 * Removido (01/08) — company_id agora vem sempre de `requireCompany()`
 * (src/server/auth/requireCompany.ts), resolvido a partir da sessão
 * autenticada via `company_members`. Nenhuma query deve mais usar um valor
 * fixo — se este import quebrar em algum arquivo, é sinal de que aquele
 * ponto ainda precisa da migração.
 */

export type ConnectionStatus = 'disconnected' | 'pending' | 'connecting' | 'connected' | 'syncing' | 'requires_attention' | 'error' | 'expired'

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
  last_success_at?: string | null
  next_sync_at?: string | null
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
  ordersCount: number
  lastError: string | null
  lastSuccessAt?: string | null
  nextSyncAt?: string | null
  permissions?: Record<string, boolean>
  channelMappings?: Record<string, string[]>
  historyMonths?: number
  activeSync?: {
    id: string
    status: string
    stage: string
    mode: string
    counts: Record<string, number>
    errorCount: number
    history: { start: string | null; end: string | null }
    progress: { percent: number | null; processed: number; total: number | null }
    lastHeartbeatAt: string | null
    isStale: boolean
    /** Prova de validação de catálogo desta run — nunca inferida de `stage`.
     *  'unknown' inclusive para runs legadas sem o campo no checkpoint. A UI
     *  NUNCA deve mostrar "Produtos e estoque OK" só porque `stage==='orders'`;
     *  precisa checar este campo. Ver src/server/integrations/vtex/checkpoint.ts. */
    catalogStatus?: 'unknown' | 'validating' | 'completed' | 'empty' | 'partial' | 'blocked'
    catalogSkuTotal?: number | null
  } | null
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
  | 'connection_tested'
  | 'credentials_rotated'
  | 'connection_disconnected'
  | 'sync_queued'
  | 'sync_stage'
  | 'channel_discovered'
  | 'provider_rate_limited'
  | 'credentials_invalid'
  | 'catalog_validation_started'
  | 'catalog_sku_ids_loaded'
  | 'catalog_empty_validated'
  | 'catalog_permission_denied'
  | 'catalog_payload_invalid'
  | 'catalog_batch_progress'
  | 'catalog_completed'

export type SyncLogStatus = 'info' | 'success' | 'error'

export type SyncSource = 'real' | 'demo' | 'config_missing' | 'error'

export type AbcClass = 'A' | 'B' | 'C'

export interface DashboardInventoryItem {
  sku: string | null
  title: string
  marketplace: Marketplace
  /** Metadados oficiais do produto persistido em marketplace_products. */
  categoryId: string | null
  categoryName: string | null
  /** null means the provider did not expose a finite inventory quantity. */
  availableQuantity: number | null
  price: number | null
  status: string | null
  /** Unidades vendidas nos últimos 30 dias — calculado de order_items real,
   *  nunca fabricado. null só quando não há pedido pago no período. */
  soldQuantity: number | null
  /** Faturamento dos últimos 30 dias pra este produto — base da Curva ABC. */
  revenue30d: number
  /** Giro = unidades vendidas em 30d / estoque disponível. null quando
   *  estoque é 0 (divisão indefinida, não é giro zero). */
  turnoverRate: number | null
  /** A = produtos que somam até 80% do faturamento acumulado (ordenado do
   *  maior pro menor), B = até 95%, C = resto — classificação clássica de
   *  gestão de estoque. null quando o produto não teve nenhuma venda no
   *  período (sem base pra classificar). */
  abcClass: AbcClass | null
  lastSyncAt: string | null
  /** Dados de compra/fornecedor — não existe fonte real hoje (sem tabela de
   *  purchase orders/NF), então a API real nunca preenche. Opcionais só pra
   *  não quebrar o contrato quando existirem de verdade; hoje só o Modo
   *  Demonstração popula (ver src/lib/demoData.ts). */
  manufacturerCode?: string | null
  lastEntryAt?: string | null
  entryQty?: number | null
  lastInvoiceNumber?: string | null
  freightValue?: number | null
}

export type DashboardInventorySource = 'real' | 'demo' | 'config_missing' | 'error'

export interface DashboardInventoryResponse {
  source: DashboardInventorySource
  items: DashboardInventoryItem[]
  lastSyncAt: string | null
}

export type DashboardSummarySource = 'real' | 'demo' | 'config_missing' | 'error'

/** Agregado real de `orders`/`order_items` no período pedido — nunca inclui
 *  pedido cancelado no faturamento/ticket (cancelado vira `returnsCount`/
 *  `returnsAmount`, ver api/dashboard/summary.ts). */
export interface DashboardSummary {
  source: DashboardSummarySource
  grossRevenue: number
  ordersCount: number
  averageTicket: number
  feesTotal: number
  returnsCount: number
  returnsAmount: number
  lastSyncAt: string | null
  /** % vs período anterior de mesma duração — null quando não há pedido
   *  pago no período anterior pra comparar (sem base, não é 0% de verdade). */
  grossRevenueChangePct: number | null
  ordersCountChangePct: number | null
}

export interface SyncSummary {
  productsImported: number
  inventoryUpdated: number
  ordersImported: number
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

export type SupportTicketStatus = 'aberto' | 'em_andamento' | 'resolvido' | 'fechado'
export type SupportTicketPriority = 'baixa' | 'normal' | 'alta' | 'urgente'
export type SupportMessageAuthorRole = 'cliente' | 'admin'

export interface SupportMessage {
  id: string
  ticketId: string
  authorId: string
  authorRole: SupportMessageAuthorRole
  body: string
  createdAt: string
}

export interface SupportTicket {
  id: string
  companyId: string
  companyName?: string
  subject: string
  status: SupportTicketStatus
  priority: SupportTicketPriority
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface SupportTicketDetail extends SupportTicket {
  messages: SupportMessage[]
}

export interface SupportTicketListResponse {
  ok: boolean
  tickets: SupportTicket[]
  message?: string
}

export interface SupportTicketDetailResponse {
  ok: boolean
  ticket: SupportTicketDetail | null
  message?: string
}
