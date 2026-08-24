import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MAX_ITEMS_FIRST_SYNC, searchShopItemIds, shopeeFetch } from '../src/server/integrations/shopee/client'

describe('Shopee reliability', () => {
  beforeEach(() => {
    process.env.SHOPEE_PARTNER_ID = '123'
    process.env.SHOPEE_PARTNER_KEY = 'test-key'
    process.env.SHOPEE_API_HOST = 'https://partner.shopeemobile.com'
  })

  afterEach(() => vi.unstubAllGlobals())

  it('respeita Retry-After em 429 e tenta novamente', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ response: { item: [] } }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(shopeeFetch('/api/v2/product/get_item_list', 'token', 'shop')).resolves.toEqual({ response: { item: [] } })
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('sinaliza explicitamente quando o catálogo excede 2000 itens', async () => {
    let offset = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      const item = Array.from({ length: 50 }, (_, index) => ({ item_id: offset + index + 1, item_status: 'NORMAL' }))
      offset += 50
      return new Response(JSON.stringify({ response: { item, total_count: 2050, has_next_page: true, next_offset: offset } }), { status: 200 })
    }))

    const result = await searchShopItemIds('token', 'shop')
    expect(result.records).toHaveLength(MAX_ITEMS_FIRST_SYNC)
    expect(result.partial).toBe(true)
    expect(result.reason).toContain('excede')
  })
})
