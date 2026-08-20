import { VtexApiError } from './errors.js'
import { buildVtexBaseUrl, buildVtexPricingBaseUrl, sanitizeVtexPath } from './validation.js'
import type { VtexCategoryNode, VtexCredentials, VtexInventoryResponse, VtexOrder, VtexOrderListResponse, VtexPrice, VtexSkuContext } from './types.js'

const REQUEST_TIMEOUT_MS = 15_000
const MAX_TRANSIENT_RETRIES = 3
const DEFAULT_RETRY_MS = 1_000
const CIRCUIT_FAILURE_THRESHOLD = 5
const CIRCUIT_OPEN_MS = 60_000

interface CircuitState { failures: number; openUntil: number }
const circuits = new Map<string, CircuitState>()

export interface VtexClientDependencies {
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  random?: () => number
  now?: () => number
}

function retryAfterMs(response: Response): number | null {
  const value = response.headers.get('retry-after')
  if (!value) return null
  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(value)
  return Number.isFinite(date) ? Math.max(0, date - Date.now()) : null
}

export class VtexClient {
  private readonly baseUrl: string
  /** A API de Pricing da VTEX NÃO vive no host `{account}.vtexcommercestable.com.br`
   *  (usado por catálogo/estoque/pedidos) — vive em `api.vtex.com/{account}`,
   *  um host completamente separado. Chamar `/pricing/*` no host de comércio
   *  falha (bug real de produção: preço sempre nulo pra toda a conta, nunca
   *  detectado porque o erro cai no `Promise.allSettled` do lote de SKU e é
   *  tratado como "sem preço" em vez de "endpoint errado"). */
  private readonly pricingBaseUrl: string
  private readonly fetchImpl: typeof fetch
  private readonly sleep: (ms: number) => Promise<void>
  private readonly random: () => number
  private readonly now: () => number

  constructor(private readonly credentials: VtexCredentials, deps: VtexClientDependencies = {}) {
    this.baseUrl = buildVtexBaseUrl(credentials.accountName)
    this.pricingBaseUrl = buildVtexPricingBaseUrl(credentials.accountName)
    this.fetchImpl = deps.fetchImpl ?? fetch
    this.sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)))
    this.random = deps.random ?? Math.random
    this.now = deps.now ?? Date.now
  }

  async request<T>(path: string, init: RequestInit = {}, attempt = 0, baseUrl: string = this.baseUrl): Promise<T> {
    const safePath = sanitizeVtexPath(path)
    const circuit = circuits.get(this.credentials.accountName)
    if (circuit && circuit.openUntil > this.now()) throw new VtexApiError('VTEX_CIRCUIT_OPEN', 'VTEX circuit is temporarily open', 503, safePath)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let response: Response
    try {
      response = await this.fetchImpl(`${baseUrl}${safePath}`, {
        ...init,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          'X-VTEX-API-AppKey': this.credentials.appKey,
          'X-VTEX-API-AppToken': this.credentials.appToken,
          ...(init.headers ?? {}),
        },
      })
    } catch (error) {
      clearTimeout(timeout)
      if (attempt < MAX_TRANSIENT_RETRIES) {
        await this.sleep(DEFAULT_RETRY_MS * 2 ** attempt + Math.floor(this.random() * 250))
        return this.request<T>(safePath, init, attempt + 1, baseUrl)
      }
      this.recordFailure()
      throw new VtexApiError('VTEX_UNAVAILABLE', error instanceof Error && error.name === 'AbortError' ? 'VTEX request timed out' : 'VTEX network failure', 0, safePath)
    } finally {
      clearTimeout(timeout)
    }

    if (response.ok) {
      circuits.delete(this.credentials.accountName)
      if (response.status === 204) return undefined as T
      return (await response.json()) as T
    }

    if (response.status === 401) throw new VtexApiError('VTEX_INVALID_CREDENTIALS', 'VTEX rejected credentials', 401, safePath)
    if (response.status === 403) throw new VtexApiError('VTEX_PERMISSION_REQUIRED', 'VTEX permission missing', 403, safePath)

    const transient = response.status === 429 || [502, 503, 504].includes(response.status)
    const waitMs = response.status === 429 ? (retryAfterMs(response) ?? 60_000) : DEFAULT_RETRY_MS * 2 ** attempt + Math.floor(this.random() * 250)
    if (transient && attempt < MAX_TRANSIENT_RETRIES) {
      await this.sleep(waitMs)
      return this.request<T>(safePath, init, attempt + 1, baseUrl)
    }
    if (transient) this.recordFailure()
    if (response.status === 429) throw new VtexApiError('VTEX_RATE_LIMITED', 'VTEX rate limit reached', 429, safePath, waitMs)
    if (response.status >= 500) throw new VtexApiError('VTEX_UNAVAILABLE', 'VTEX service unavailable', response.status, safePath)
    throw new VtexApiError('VTEX_VALIDATION_ERROR', `VTEX request failed with ${response.status}`, response.status, safePath)
  }

  private recordFailure(): void {
    const previous = circuits.get(this.credentials.accountName) ?? { failures: 0, openUntil: 0 }
    const failures = previous.failures + 1
    circuits.set(this.credentials.accountName, { failures, openUntil: failures >= CIRCUIT_FAILURE_THRESHOLD ? this.now() + CIRCUIT_OPEN_MS : 0 })
  }

  getCategoryTree(levels = 10) { return this.request<VtexCategoryNode[]>(`/api/catalog_system/pub/category/tree/${levels}`) }
  getSkuIds() { return this.request<number[]>('/api/catalog_system/pvt/sku/stockkeepingunitids') }
  /** Descoberta global de SKUs. Algumas contas VTEX (catálogo modelado só
   *  por sales channel, sem afiliação global) devolvem `[]` aqui mesmo com
   *  produtos reais — nesse caso o fallback é `getSkuIdsBySalesChannel` por
   *  cada canal em `getSalesChannels`, nunca um sales channel hardcoded. */
  getSalesChannels() { return this.request<Array<{ Id: number | string; Name?: string; IsActive?: boolean }>>('/api/catalog_system/pvt/saleschannel/list') }
  getSkuIdsBySalesChannel(salesChannelId: number | string) { return this.request<number[]>(`/api/catalog_system/pvt/sku/stockkeepingunitidsbysaleschannel/${encodeURIComponent(String(salesChannelId))}`) }
  /** Terceiro nível de fallback: catálogos grandes (dezenas de milhares de
   *  produtos) podem fazer `stockkeepingunitids` e a variante por sales
   *  channel devolverem `[]` mesmo com produtos reais cadastrados —
   *  comprovado em produção (conta com 18k+ produtos ativos no admin da
   *  VTEX, ambos os endpoints acima devolvendo vazio). `GetProductAndSkuIds`
   *  é paginado por índice (`_from`/`_to`), nunca falha silenciosamente por
   *  volume. */
  getProductAndSkuIds(from: number, to: number) {
    return this.request<{ data: Record<string, number[]>; range: { total: number; from: number; to: number } }>(`/api/catalog_system/pvt/products/GetProductAndSkuIds?_from=${from}&_to=${to}`)
  }
  getSku(skuId: number | string) { return this.request<VtexSkuContext>(`/api/catalog_system/pvt/sku/stockkeepingunitbyid/${encodeURIComponent(String(skuId))}`) }
  getPrice(skuId: number | string) { return this.request<VtexPrice>(`/pricing/prices/${encodeURIComponent(String(skuId))}`, {}, 0, this.pricingBaseUrl) }
  getInventory(skuId: number | string) { return this.request<VtexInventoryResponse>(`/api/logistics/pvt/inventory/skus/${encodeURIComponent(String(skuId))}`) }
  listWarehouses() { return this.request<Array<{ id?: string; name?: string }>>('/api/logistics/pvt/configuration/warehouses') }
  getPricingConfig() { return this.request<Record<string, unknown>>('/pricing/config', {}, 0, this.pricingBaseUrl) }
  /** Registro real de affiliates cadastrados pela loja na VTEX (Marketplace
   *  API, endpoint novo de 2025) — cada affiliate tem o NOME que o próprio
   *  vendedor digitou no painel VTEX ao configurar o marketplace (ex.:
   *  affiliateId "MLB" com name "Mercado Livre"). É dado de origem VTEX, não
   *  suposição sobre a sigla — ver channelRegistry.ts. Best-effort: conta
   *  pode não ter essa API habilitada (endpoint recente); o chamador trata
   *  qualquer erro como "sem registro disponível", nunca falha a run por
   *  causa disso. */
  getAffiliates() { return this.request<unknown>('/api/fulfillment/pvt/affiliates') }
  listOrders(query: string) { return this.request<VtexOrderListResponse>(`/api/oms/pvt/orders?${query}`) }
  getOrder(orderId: string) { return this.request<VtexOrder>(`/api/oms/pvt/orders/${encodeURIComponent(orderId)}`) }
  getFeedConfig() { return this.request<Record<string, unknown>>('/api/orders/feed/config') }
  retrieveFeed(maxLot = 10) { return this.request<Array<{ eventId: string; handle: string; domain: string; orderId: string; state?: string }>>(`/api/orders/feed?maxLot=${maxLot}`) }
  commitFeed(handles: string[]) { return this.request<void>('/api/orders/feed', { method: 'POST', body: JSON.stringify({ handles }) }) }
}
