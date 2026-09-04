import type { VercelRequest, VercelResponse } from '@vercel/node'
import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { securityLog } from '../security/logger.js'
import { getRequestId } from '../security/requestContext.js'

export type RateLimitResult =
  | { status: 'allowed' }
  | { status: 'limited'; retryAfter: number }
  | { status: 'unavailable'; reason: string }

interface RpcResult { data: unknown; error: { code?: string; message?: string } | null }

export async function evaluateRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
  invoke?: (args: { p_key: string; p_max: number; p_window_seconds: number }) => Promise<RpcResult>,
): Promise<RateLimitResult> {
  try {
    const rpc = invoke ?? (async (args) => {
      const supabase = await getSupabaseAdmin()
      return await supabase.rpc('check_rate_limit', args) as RpcResult
    })
    const { data, error } = await rpc({ p_key: key, p_max: max, p_window_seconds: windowSeconds })
    if (error) return { status: 'unavailable', reason: error.code ?? 'rpc_error' }
    return data ? { status: 'allowed' } : { status: 'limited', retryAfter: windowSeconds }
  } catch {
    return { status: 'unavailable', reason: 'rpc_exception' }
  }
}

export interface RateLimitPolicy {
  req?: VercelRequest
  route?: string
  policy?: 'critical' | 'low-risk'
  evaluate?: () => Promise<RateLimitResult>
}

export async function checkRateLimit(
  res: VercelResponse,
  key: string,
  max: number,
  windowSeconds: number,
  policy: RateLimitPolicy = {},
): Promise<boolean> {
  const result = policy.evaluate ? await policy.evaluate() : await evaluateRateLimit(key, max, windowSeconds)
  if (result.status === 'allowed') return true

  if (result.status === 'limited') {
    res.setHeader('Retry-After', String(result.retryAfter))
    res.status(429).json({ ok: false, error: 'rate_limited', message: 'Muitas tentativas. Aguarde antes de tentar novamente.' })
    return false
  }

  const requestId = policy.req ? getRequestId(policy.req, res) : randomUUID()
  res.setHeader('X-Request-Id', requestId)
  securityLog('error', 'rate_limit_unavailable', {
    requestId,
    route: policy.route ?? policy.req?.url,
    status: 'unavailable',
    reason: `${policy.policy ?? 'critical'}:${result.reason}`,
  })
  if (policy.policy === 'low-risk') return true
  res.setHeader('Retry-After', '30')
  res.status(503).json({ ok: false, error: { code: 'RATE_LIMIT_UNAVAILABLE', message: 'Prote\u00e7\u00e3o temporariamente indispon\u00edvel.' }, requestId })
  return false
}
