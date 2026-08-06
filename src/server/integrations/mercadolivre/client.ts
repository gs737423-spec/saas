import type { MLCategoryDetail, MLItemDetail, MLItemSearchResponse, MLOrder, MLOrderSearchResponse } from './types.js'

const BASE_URL = 'https://api.mercadolibre.com'

/** Teto de segurança (não "primeiro sync só" — todo sync repassa o catálogo
 *  inteiro hoje, não tem sync incremental por data ainda). Alto o bastante
 *  pra cobrir a esmagadora maioria dos catálogos reais sem estourar o rate
 *  limit de 1500 req/min por vendedor (a paginação já tem backoff em 429). */
export const MAX_ITEMS_FIRST_SYNC = 2000
const ITEMS_PAGE_SIZE = 50
// Teto de segurança bem mais alto que o de itens — pedido é o dado que o
// cliente mais precisa completo (histórico de faturamento/produto campeão
// depende disso), e o filtro por data abaixo já limita o volume real na
// prática. Só existe pra nunca rodar indefinidamente se algo vier errado.
export const MAX_ORDERS_FIRST_SYNC = 10000
const ORDERS_PAGE_SIZE = 50
// Garante pelo menos 1 ano de histórico mesmo se o vendedor tiver volume
// alto — sem isso, "só os N pedidos mais recentes" podia cortar antes de
// chegar em meses anteriores num catálogo com muito movimento.
const ORDERS_HISTORY_DAYS = 365
const MAX_429_RETRIES = 3

export class MercadoLivreApiError extends Error {
  constructor(message: string, public status: number, public path: string) {
    super(message)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function mlFetch<T>(path: string, accessToken: string, attempt = 0): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  })

  if (res.status === 429 && attempt < MAX_429_RETRIES) {
    // Simple exponential backoff — per docs, exceeding 1500 req/min per seller
    // returns an empty 429 body.
    await sleep(500 * (attempt + 1))
    return mlFetch<T>(path, accessToken, attempt + 1)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new MercadoLivreApiError(`Mercado Livre API ${res.status} on ${path}: ${body.slice(0, 300)}`, res.status, path)
  }

  return (await res.json()) as T
}

/**
 * Paginates GET /users/{user_id}/items/search up to MAX_ITEMS_FIRST_SYNC.
 * TODO: validate paging.total behavior against a real large catalog — the
 * official docs example only covers small result sets.
 */
export async function searchUserItemIds(userId: string, accessToken: string): Promise<string[]> {
  const ids: string[] = []
  let offset = 0

  while (ids.length < MAX_ITEMS_FIRST_SYNC) {
    const page = await mlFetch<MLItemSearchResponse>(
      `/users/${userId}/items/search?offset=${offset}&limit=${ITEMS_PAGE_SIZE}`,
      accessToken
    )
    ids.push(...page.results)
    offset += page.results.length
    if (page.results.length === 0 || offset >= page.paging.total) break
  }

  return ids.slice(0, MAX_ITEMS_FIRST_SYNC)
}

export async function getItemDetail(itemId: string, accessToken: string): Promise<MLItemDetail> {
  return mlFetch<MLItemDetail>(`/items/${itemId}`, accessToken)
}

/** Nome legível da categoria — /items/{id} só devolve o category_id (ex.
 *  "MLB1055"), o nome vem de um endpoint público separado. Chamador deve
 *  cachear por categoria dentro do sync (poucas dezenas de categorias
 *  distintas por catálogo, não um lookup por produto). */
export async function getCategory(categoryId: string, accessToken: string): Promise<MLCategoryDetail> {
  return mlFetch<MLCategoryDetail>(`/categories/${categoryId}`, accessToken)
}

export interface SearchOrdersResult {
  orders: MLOrder[]
  /** true quando a API tinha mais pedidos dentro da janela de 1 ano do que
   *  MAX_ORDERS_FIRST_SYNC trouxe — nunca fica silencioso, sync.ts anexa
   *  isso em errors[] pro admin ver. */
  truncated: boolean
}

/**
 * Paginates GET /orders/search dentro da janela de ORDERS_HISTORY_DAYS
 * (1 ano), mais recente primeiro, até MAX_ORDERS_FIRST_SYNC. Unlike items,
 * the search response already contains the full order (items, amounts,
 * buyer, status) — no per-order detail call needed.
 */
export async function searchOrders(sellerId: string, accessToken: string): Promise<SearchOrdersResult> {
  const orders: MLOrder[] = []
  let offset = 0
  const dateFrom = new Date(Date.now() - ORDERS_HISTORY_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const dateTo = new Date().toISOString()
  let total = 0

  while (orders.length < MAX_ORDERS_FIRST_SYNC) {
    const page = await mlFetch<MLOrderSearchResponse>(
      `/orders/search?seller=${sellerId}&sort=date_desc&offset=${offset}&limit=${ORDERS_PAGE_SIZE}` +
        `&order.date_created.from=${encodeURIComponent(dateFrom)}&order.date_created.to=${encodeURIComponent(dateTo)}`,
      accessToken
    )
    orders.push(...page.results)
    offset += page.results.length
    total = page.paging.total
    if (page.results.length === 0 || offset >= total) break
  }

  return { orders: orders.slice(0, MAX_ORDERS_FIRST_SYNC), truncated: total > MAX_ORDERS_FIRST_SYNC }
}
