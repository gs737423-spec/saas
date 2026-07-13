import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { getAuthorizationUrl, signState } from '../../../src/server/integrations/mercadolivre/auth.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const appBaseUrl = process.env.APP_BASE_URL

  try {
    const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
    if (missing.length > 0) {
      console.error('[mercadolivre/authorize] missing env vars:', missing.join(', '))
      if (!appBaseUrl) {
        // No safe redirect target either — this is the one case a JSON error beats
        // guessing a URL to bounce the browser to.
        res.status(200).json({ ok: false, source: 'config_missing', message: 'Credenciais do Mercado Livre ainda não configuradas.' })
        return
      }
      res.redirect(302, `${appBaseUrl}/importacoes?ml_error=config_missing`)
      return
    }

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
    console.error('[mercadolivre/authorize]', err)
    if (appBaseUrl) {
      res.redirect(302, `${appBaseUrl}/importacoes?ml_error=unexpected`)
    } else {
      res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado ao iniciar autorização com o Mercado Livre.' })
    }
  }
}
