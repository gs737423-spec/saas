import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { ShopeeOAuthStatePayload, ShopeeTokenResponse } from './types.js'

const PRODUCTION_HOST = 'https://partner.shopeemobile.com'
const STATE_MAX_AGE_MS = 10 * 60 * 1000

export function resolveShopeeApiHost(configuredHost = process.env.SHOPEE_API_HOST): string {
  if (configuredHost !== PRODUCTION_HOST) {
    throw new Error(`SHOPEE_API_HOST must be explicitly set to ${PRODUCTION_HOST}.`)
  }
  return configuredHost
}

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET
  if (!secret) throw new Error('OAUTH_STATE_SECRET is not set.')
  return secret
}

export function signState(companyId: string): string {
  const payload: ShopeeOAuthStatePayload = { nonce: randomBytes(16).toString('hex'), issuedAt: Date.now(), companyId }
  const payloadB64 = base64url(JSON.stringify(payload))
  const signature = createHmac('sha256', getStateSecret()).update(payloadB64).digest()
  return `${payloadB64}.${base64url(signature)}`
}

export function verifyState(state: string | undefined | null): ShopeeOAuthStatePayload | null {
  if (!state) return null
  const [payloadB64, signatureB64] = state.split('.')
  if (!payloadB64 || !signatureB64) return null

  const expectedSignature = createHmac('sha256', getStateSecret()).update(payloadB64).digest()
  const actualSignature = Buffer.from(signatureB64, 'base64url')
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as ShopeeOAuthStatePayload
    if (Date.now() - payload.issuedAt > STATE_MAX_AGE_MS) return null
    if (!payload.companyId) return null
    return payload
  } catch {
    return null
  }
}

function getPartnerCredentials() {
  const partnerId = process.env.SHOPEE_PARTNER_ID
  const partnerKey = process.env.SHOPEE_PARTNER_KEY
  if (!partnerId || !partnerKey) {
    throw new Error('SHOPEE_PARTNER_ID or SHOPEE_PARTNER_KEY is not set.')
  }
  return { partnerId, partnerKey }
}

/** Assinatura HMAC-SHA256 exigida em toda chamada da API v2 da Shopee.
 *  Base string: partner_id + path + timestamp [+ access_token + shop_id].
 *  Sem access_token/shop_id nas chamadas de nível "partner" (auth_partner,
 *  token/get). Ver https://open.shopee.com (doc completa exige login de
 *  parceiro — confirmar campo a campo quando tivermos acesso). */
function sign(path: string, timestamp: number, accessToken?: string, shopId?: string): string {
  const { partnerId, partnerKey } = getPartnerCredentials()
  const base = `${partnerId}${path}${timestamp}${accessToken ?? ''}${shopId ?? ''}`
  return createHmac('sha256', partnerKey).update(base).digest('hex')
}

/** Monta a URL que o vendedor visita pra autorizar o app — ele loga na
 *  Shopee e é redirecionado de volta com `code` e `shop_id` na query string. */
export function getAuthorizationUrl(state: string): string {
  const { partnerId } = getPartnerCredentials()
  const redirectUri = process.env.SHOPEE_REDIRECT_URI
  if (!redirectUri) throw new Error('SHOPEE_REDIRECT_URI is not set.')

  const path = '/api/v2/shop/auth_partner'
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = sign(path, timestamp)

  const url = new URL(`${resolveShopeeApiHost()}${path}`)
  url.searchParams.set('partner_id', partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', signature)
  url.searchParams.set('redirect', `${redirectUri}?state=${encodeURIComponent(state)}`)
  return url.toString()
}

/** Troca o `code` do callback por access_token/refresh_token. */
export async function exchangeCodeForToken(code: string, shopId: string): Promise<ShopeeTokenResponse> {
  const { partnerId } = getPartnerCredentials()
  const path = '/api/v2/auth/token/get'
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = sign(path, timestamp)

  const url = new URL(`${resolveShopeeApiHost()}${path}`)
  url.searchParams.set('partner_id', partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', signature)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, shop_id: Number(shopId), partner_id: Number(partnerId) }),
  })

  const body = (await res.json()) as ShopeeTokenResponse
  if (!res.ok || body.error) {
    throw new Error(`Shopee token exchange failed (${res.status}): ${body.message ?? body.error ?? 'unknown error'}`)
  }
  return body
}

/** Renova o access_token (válido só 4h) usando o refresh_token. */
export async function refreshAccessToken(refreshToken: string, shopId: string): Promise<ShopeeTokenResponse> {
  const { partnerId } = getPartnerCredentials()
  const path = '/api/v2/auth/access_token/get'
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = sign(path, timestamp)

  const url = new URL(`${resolveShopeeApiHost()}${path}`)
  url.searchParams.set('partner_id', partnerId)
  url.searchParams.set('timestamp', String(timestamp))
  url.searchParams.set('sign', signature)

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken, shop_id: Number(shopId), partner_id: Number(partnerId) }),
  })

  const body = (await res.json()) as ShopeeTokenResponse
  if (!res.ok || body.error) {
    throw new Error(`Shopee token refresh failed (${res.status}): ${body.message ?? body.error ?? 'unknown error'}`)
  }
  return body
}

/** Assinatura pra chamadas autenticadas de loja (produtos, pedidos etc) —
 *  usada por client.ts. Exportado separado pra não duplicar a lógica de
 *  timestamp/URL em cada função de API. */
export function signShopRequest(path: string, accessToken: string, shopId: string): { timestamp: number; sign: string; partnerId: string } {
  const { partnerId } = getPartnerCredentials()
  const timestamp = Math.floor(Date.now() / 1000)
  return { timestamp, sign: sign(path, timestamp, accessToken, shopId), partnerId }
}
