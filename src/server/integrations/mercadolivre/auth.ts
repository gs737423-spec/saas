import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import type { MLTokenErrorResponse, MLTokenResponse, OAuthStatePayload } from './types.js'

const AUTHORIZATION_URL = 'https://auth.mercadolivre.com.br/authorization'
const TOKEN_URL = 'https://api.mercadolibre.com/oauth/token'
const STATE_MAX_AGE_MS = 10 * 60 * 1000 // 10 minutes

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url')
}

function getStateSecret(): string {
  const secret = process.env.OAUTH_STATE_SECRET
  if (!secret) throw new Error('OAUTH_STATE_SECRET is not set.')
  return secret
}

/** Signs a self-contained state payload — no server-side state storage needed
 *  (serverless functions have no shared memory between the authorize and callback requests). */
export function signState(): string {
  const payload: OAuthStatePayload = { nonce: randomBytes(16).toString('hex'), issuedAt: Date.now() }
  const payloadB64 = base64url(JSON.stringify(payload))
  const signature = createHmac('sha256', getStateSecret()).update(payloadB64).digest()
  return `${payloadB64}.${base64url(signature)}`
}

/** Verifies signature and expiry. Returns the decoded payload, or null if invalid/expired/tampered. */
export function verifyState(state: string | undefined | null): OAuthStatePayload | null {
  if (!state) return null
  const [payloadB64, signatureB64] = state.split('.')
  if (!payloadB64 || !signatureB64) return null

  const expectedSignature = createHmac('sha256', getStateSecret()).update(payloadB64).digest()
  const actualSignature = Buffer.from(signatureB64, 'base64url')
  if (expectedSignature.length !== actualSignature.length || !timingSafeEqual(expectedSignature, actualSignature)) {
    return null
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8')) as OAuthStatePayload
    if (Date.now() - payload.issuedAt > STATE_MAX_AGE_MS) return null
    return payload
  } catch {
    return null
  }
}

function getClientCredentials() {
  const clientId = process.env.ML_CLIENT_ID
  const clientSecret = process.env.ML_CLIENT_SECRET
  const redirectUri = process.env.ML_REDIRECT_URI
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('ML_CLIENT_ID, ML_CLIENT_SECRET or ML_REDIRECT_URI is not set.')
  }
  return { clientId, clientSecret, redirectUri }
}

export function getAuthorizationUrl(state: string): string {
  const { clientId, redirectUri } = getClientCredentials()
  const url = new URL(AUTHORIZATION_URL)
  url.searchParams.set('response_type', 'code')
  url.searchParams.set('client_id', clientId)
  url.searchParams.set('redirect_uri', redirectUri)
  url.searchParams.set('state', state)
  return url.toString()
}

/** Exchanges an authorization code for an access/refresh token pair. Server-side only —
 *  sends client_secret, per https://developers.mercadolivre.com.br/pt_br/obtencao-do-access-token */
export async function exchangeCodeForToken(code: string): Promise<MLTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getClientCredentials()

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as MLTokenErrorResponse
    throw new Error(`Mercado Livre token exchange failed (${res.status}): ${errorBody.message ?? errorBody.error_description ?? errorBody.error ?? 'unknown error'}`)
  }

  return (await res.json()) as MLTokenResponse
}

/** Refreshes an expired access token. TODO: not yet wired into sync.ts automatically —
 *  see docs/integrations/mercadolivre-oauth.md, section "Refresh token". */
export async function refreshAccessToken(refreshToken: string): Promise<MLTokenResponse> {
  const { clientId, clientSecret } = getClientCredentials()

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
  })

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body,
  })

  if (!res.ok) {
    const errorBody = (await res.json().catch(() => ({}))) as MLTokenErrorResponse
    throw new Error(`Mercado Livre token refresh failed (${res.status}): ${errorBody.message ?? errorBody.error_description ?? errorBody.error ?? 'unknown error'}`)
  }

  return (await res.json()) as MLTokenResponse
}
