import { randomUUID } from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{8,128}$/

export function getRequestId(req: VercelRequest, res?: VercelResponse): string {
  const existing = (req as VercelRequest & { requestId?: string }).requestId
  if (existing) return existing

  const raw = req.headers['x-request-id']
  const candidate = Array.isArray(raw) ? raw[0] : raw
  const requestId = typeof candidate === 'string' && SAFE_REQUEST_ID.test(candidate) ? candidate : randomUUID()
  ;(req as VercelRequest & { requestId?: string }).requestId = requestId
  res?.setHeader('X-Request-Id', requestId)
  return requestId
}
