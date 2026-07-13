import type { MLItemDetail, MLItemSearchResponse } from './types.js'

const BASE_URL = 'https://api.mercadolibre.com'

/** First-sync safety cap — avoids hammering a large catalog (and the 1500 req/min
 *  per-seller rate limit) before the pipeline has been proven end-to-end. Raise once
 *  pagination/backoff have been validated against a real account. */
export const MAX_ITEMS_FIRST_SYNC = 200
const ITEMS_PAGE_SIZE = 50
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
