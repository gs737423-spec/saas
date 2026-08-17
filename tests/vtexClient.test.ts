import { describe, expect, it, vi } from 'vitest'
import { VtexClient } from '../src/server/integrations/vtex/client'
import { VtexApiError } from '../src/server/integrations/vtex/errors'

const credentials = { accountName: 'minha-loja', appKey: 'app-key-secret', appToken: 'app-token-secret' }

describe('VTEX client resilience', () => {
  it('sends application-key headers only to the fixed VTEX host', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as typeof fetch })
    await client.request('/api/test')
    expect(fetchImpl).toHaveBeenCalledWith('https://minha-loja.vtexcommercestable.com.br/api/test', expect.objectContaining({
      headers: expect.objectContaining({ 'X-VTEX-API-AppKey': credentials.appKey, 'X-VTEX-API-AppToken': credentials.appToken }),
    }))
  })

  it('honors Retry-After on 429 and retries', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(new Response('{}', { status: 429, headers: { 'retry-after': '2' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const sleep = vi.fn(async () => undefined)
    const client = new VtexClient(credentials, { fetchImpl: fetchImpl as typeof fetch, sleep, random: () => 0 })
    await expect(client.request('/api/test')).resolves.toEqual({ ok: true })
    expect(sleep).toHaveBeenCalledWith(2000)
  })

  it('maps 401 without leaking credentials into the public error', async () => {
    const client = new VtexClient(credentials, { fetchImpl: vi.fn(async () => new Response('{}', { status: 401 })) as typeof fetch })
    await expect(client.request('/api/test')).rejects.toMatchObject<VtexApiError>({ code: 'VTEX_INVALID_CREDENTIALS', status: 401 })
    try { await client.request('/api/test') } catch (error) {
      expect(String(error)).not.toContain(credentials.appKey)
      expect(String(error)).not.toContain(credentials.appToken)
    }
  })
})
