import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Zero-dependency liveness check — no Supabase, no Mercado Livre, no env vars.
 * If this ever fails, the problem is the Vercel Node runtime itself, not our
 * integration code — useful to rule that out when diagnosing a 500 elsewhere.
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    ok: true,
    service: 'api',
    timestamp: new Date().toISOString(),
    environment: 'vercel',
  })
}
