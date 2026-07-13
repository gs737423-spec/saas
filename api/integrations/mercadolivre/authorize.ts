import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin'
import { getAuthorizationUrl, signState } from '../../../src/server/integrations/mercadolivre/auth'
import { logSyncEvent } from '../../../src/server/integrations/syncLog'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
  const appBaseUrl = process.env.APP_BASE_URL

  if (missing.length > 0) {
    console.error('[mercadolivre/authorize] missing env vars:', missing.join(', '))
    // No APP_BASE_URL means we can't even build a safe redirect — fail loudly instead of guessing a URL.
    if (!appBaseUrl) {
      res.status(500).json({ error: 'config_missing', missing })
      return
    }
    res.redirect(302, `${appBaseUrl}/importacoes?ml_error=config_missing`)
    return
  }

  try {
    const state = signState()
    await logSyncEvent({
      connectionId: null,
      provider: 'mercadolivre',
      eventType: 'oauth_started',
      status: 'info',
      message: 'Authorization redirect issued',
    })
    res.redirect(302, getAuthorizationUrl(state))
  } catch (err) {
    console.error('[mercadolivre/authorize] unexpected error:', err)
    res.redirect(302, `${appBaseUrl}/importacoes?ml_error=unexpected`)
  }
}
