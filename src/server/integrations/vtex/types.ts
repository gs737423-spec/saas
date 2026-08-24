export type VtexDomain = 'account' | 'orders' | 'catalog' | 'pricing' | 'inventory' | 'feed'

export interface VtexCredentials {
  accountName: string
  appKey: string
  appToken: string
}

export interface VtexPermissionCheck {
  domain: VtexDomain
  required: boolean
  ok: boolean
  status: number | null
}

export interface VtexConnectionTestResult {
  accountName: string
  valid: boolean
  permissions: VtexPermissionCheck[]
  missingRequired: VtexDomain[]
}

export interface VtexCategoryNode {
  id: number
  name: string
  hasChildren?: boolean
  url?: string
  children?: VtexCategoryNode[]
}

export interface VtexSkuContext {
  Id: number
  ProductId: number
  RefId?: string | null
  ProductRefId?: string | null
  NameComplete?: string | null
  ProductName?: string | null
  SkuName?: string | null
  IsActive?: boolean
  ProductCategories?: Record<string, string>
  DetailUrl?: string | null
  BrandId?: number | null
  BrandName?: string | null
}

export interface VtexPrice {
  itemId?: string
  basePrice?: number | null
  listPrice?: number | null
  costPrice?: number | null
  markup?: number | null
}

export interface VtexInventoryBalance {
  warehouseId: string
  warehouseName?: string | null
  totalQuantity?: number | null
  reservedQuantity?: number | null
  hasUnlimitedQuantity?: boolean
}

export interface VtexInventoryResponse {
  skuId?: string
  balance?: VtexInventoryBalance[]
}

export interface VtexOrderSummary {
  orderId: string
  creationDate: string
  lastChange?: string
  status: string
  totalValue?: number
}

export interface VtexOrderListResponse {
  list?: VtexOrderSummary[]
  paging?: { total?: number; pages?: number; currentPage?: number; perPage?: number }
}

export interface VtexOrderItem {
  id: string
  productId?: string
  refId?: string | null
  name: string
  quantity: number
  price: number
  sellingPrice?: number
  priceDefinition?: { calculatedSellingPrice?: number; total?: number }
}

export interface VtexOrderTotal {
  id: string
  name?: string
  value: number
}

export interface VtexOrder {
  orderId: string
  marketplaceOrderId?: string | null
  sellerOrderId?: string | null
  affiliateId?: string | null
  salesChannel?: string | null
  origin?: string | null
  status: string
  value: number
  creationDate: string
  lastChange?: string
  items: VtexOrderItem[]
  totals?: VtexOrderTotal[]
  storePreferencesData?: { currencyCode?: string; currencyLocale?: number; currencySymbol?: string }
}

/** Tenant-scoped canonical channel -> external VTEX affiliate ids or stable
 * external identity keys (for example `sales-channel:1`).
 * Keys are intentionally dynamic; adding a marketplace must not require code
 * or a database migration. */
export type VtexChannelMappings = Record<string, string[]>

export type VtexAnalyticChannel = string
export type VtexChannelResolutionStatus = 'resolved' | 'unresolved' | 'ignored'

export interface VtexChannelResolution {
  canonicalChannel: VtexAnalyticChannel
  displayName: string
  channelType: 'marketplace' | 'own_store' | 'external' | 'other'
  resolutionStatus: VtexChannelResolutionStatus
  externalKey: string
  externalSalesChannel: string | null
  externalMarketplaceName: string | null
  /** Identificador bruto VTEX separado do canal canônico (ver
   *  channelResolution.ts) — a UI agrupa/filtra por estes campos sem
   *  precisar parsear `externalKey`. */
  identifierType: 'affiliate_id' | 'sales_channel' | 'native_store' | 'unidentified'
  identifierValue: string
  resolutionSource: 'mapping' | 'native_store' | 'unresolved'
}

export interface VtexNormalizedOrder {
  canonicalOrderKey: string
  channel: VtexAnalyticChannel
  channelDisplayName: string
  channelType: VtexChannelResolution['channelType']
  channelResolutionStatus: VtexChannelResolutionStatus
  externalChannelKey: string
  externalSalesChannel: string | null
  externalMarketplaceName: string | null
  identifierType: VtexChannelResolution['identifierType']
  identifierValue: string
  resolutionSource: VtexChannelResolution['resolutionSource']
  analyticsIncluded: boolean
  unavailableReason: string | null
  externalOrderId: string
  marketplaceOrderId: string | null
  affiliateId: string | null
  status: string
  totalAmount: number
  feeAmount: number | null
  currency: string | null
  orderedAt: string
  sourceUpdatedAt: string | null
  items: Array<{ externalProductId: string; sku: string | null; title: string; quantity: number; unitPrice: number }>
}

export interface VtexSyncCounts {
  categoriesFetched: number
  productsFetched: number
  skusFetched: number
  pricesFetched: number
  inventoriesFetched: number
  ordersFetched: number
  ordersInserted: number
  ordersUpdated: number
  ordersDeduplicated: number
  channelsDiscovered: number
  channelsResolved: number
  channelsUnresolved: number
  errors: number
}

export interface VtexSyncCheckpoint {
  /** Versão do formato do checkpoint (ver checkpoint.ts). Ausente = run
   *  legada, migrada explicitamente antes de qualquer processamento —
   *  nunca se mistura campo de regra antiga com regra nova em silêncio. */
  version?: number
  /** Snapshot da configuração no momento em que a run foi CRIADA. Vale por
   *  toda a vida da run; mudança de config do sistema só afeta a próxima. */
  runConfig?: {
    historyMonths: number
    windowMs: number
    syncMode: 'full' | 'incremental'
    checkpointVersion: number
  }
  skuOffset?: number
  orderPage?: number
  orderWindowStart?: string
  orderWindowEnd?: string
  orderTargetEnd?: string
  lastOrderChange?: string
  /** Contagem de recuperações de run travada (stale) — ver reclaimStaleVtexRun
   *  em sync.ts. Depois de MAX_STALE_RECOVERIES seguidas, a run é marcada
   *  failed em vez de tentar de novo pra sempre. */
  staleRecoveries?: number
  /** Total de SKUs do catálogo (conhecido assim que `getSkuIds()` roda) —
   *  junto de `skuOffset`, dá progresso real do estágio `catalog`.
   *  MANTIDO por compatibilidade; `catalogSkuTotal` é o campo escrito pela
   *  nova state machine — `skuTotal` continua sendo espelhado pra não
   *  quebrar leitores existentes (progress.ts, UI). */
  skuTotal?: number
  /** Prova explícita de que o catálogo foi (re)validado nesta run — NUNCA
   *  inferida a partir de `stage` ou da mera presença de `skuTotal`.
   *  Checkpoint sem este campo (todo checkpoint legado) é tratado como
   *  `'unknown'`, jamais como `'completed'`. Ver checkpoint.ts. */
  catalogStatus?: 'unknown' | 'validating' | 'completed' | 'empty' | 'partial' | 'blocked'
  /** Timestamp da última transição de `catalogStatus` para um estado
   *  terminal (`completed`/`empty`/`blocked`). */
  catalogValidatedAt?: string
  /** Total de SKUs observado na validação de catálogo mais recente. */
  catalogSkuTotal?: number
  /** Versão da ESTRATÉGIA de descoberta que produziu `catalogStatus`. Existe
   *  porque `'empty'` é uma prova terminal — mas uma prova só vale pela
   *  estratégia que a gerou. Uma run que ficou `catalogStatus='empty'` antes
   *  do fallback por sales channel existir (descoberta só global) não pode
   *  ser tratada como equivalente a uma validada pela estratégia atual (que
   *  também tenta por sales channel antes de aceitar vazio) — ver
   *  checkpoint.ts/VTEX_CATALOG_DISCOVERY_VERSION. */
  catalogDiscoveryVersion?: number
  /** Posição (`_from`) de retomada da paginação por `GetProductAndSkuIds` —
   *  terceiro nível de fallback (catálogos grandes). Persistido pra uma
   *  invocação que estourou o orçamento de tempo no meio da paginação
   *  continuar exatamente de onde parou, nunca do zero. */
  catalogPaginationFrom?: number
  /** IDs acumulados durante a paginação resumível. Separado de
   * `catalogSkuIds`, pois este último sinaliza que a descoberta terminou e
   * já pode entrar no processamento do catálogo. */
  catalogPaginationSkuIds?: number[]
  /** Lista completa de SKU ids descoberta por um dos fallbacks (sales
   *  channel ou paginação) — persistida pra os lotes seguintes de `catalog`
   *  reusarem em vez de rechamar `getSkuIds()` global a cada tick. Sem isso,
   *  cada tick redescobria do zero via endpoint global (não confiável em
   *  catálogos grandes), voltava `[]`, e o lote seguinte ficava vazio —
   *  fazendo o estágio `catalog` terminar `completed` prematuramente com só
   *  o primeiro lote processado (bug real de produção, conta com 18k SKUs
   *  travada em 40 produtos). Limpo quando o estágio `catalog` termina. */
  catalogSkuIds?: number[]
  /** Início do intervalo de histórico pedido (3/6 meses) — junto de
   *  `orderWindowStart`/`orderTargetEnd`, dá progresso real do estágio
   *  `orders`: fração do intervalo já coberta por janelas concluídas. */
  orderHistoryStart?: string
  /** Sentido da navegação do backfill. A engine atual começa no presente
   *  e anda para trás, disponibilizando dashboard/financeiro rapidamente. */
  orderTraversal?: 'recent_first'
  /** Limite inferior imutável do backfill. Em runs v2 migradas, recebe o
   *  início da janela antiga ainda não confirmada, preservando o trabalho já
   *  concluído sem voltar ao início nem perder o restante. */
  orderBackfillFloor?: string
  /** Marca que `autoResolveVtexAffiliatesFromRegistry` já rodou nesta run —
   *  é uma chamada extra à VTEX, então roda UMA vez por run (não a cada
   *  tick do estágio `orders`, que pode durar dezenas de invocações). */
  affiliateRegistryChecked?: boolean
  /** Versão da estratégia de descoberta automática de canais. */
  affiliateRegistryVersion?: number
}
