import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, SHOPEE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { getAuthorizationUrl, signState } from '../../../src/server/integrations/shopee/auth.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import { requireCompany } from '../../../src/server/auth/requireCompany.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'

// Mesmo padrão do Mercado Livre: retorna a URL como JSON (não redirect 302
// direto) pra exigir sessão autenticada primeiro — ver ConnectionContext.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(SHOPEE_ENV_VARS)
    if (missing.length > 0) {
      console.error('[shopee/authorize] missing env vars:', missing.join(', '))
      res.status(200).json({ ok: false, source: 'config_missing', message: 'Credenciais da Shopee ainda não configuradas.' })
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    if (!(await checkRateLimit(res, `shopee-authorize:${auth.companyId}`, 10, 1800))) return

    const state = signState(auth.companyId)
    await logSyncEvent({
      companyId: auth.companyId,
      connectionId: null,
      provider: 'shopee',
      eventType: 'oauth_started',
      status: 'info',
      message: 'Authorization redirect issued',
    })
    res.status(200).json({ ok: true, url: getAuthorizationUrl(state) })
  } catch (err) {
    console.error('[shopee/authorize]', err)
    res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado ao iniciar autorização com a Shopee.' })
  }
}
