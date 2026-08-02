import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { getAuthorizationUrl, signState } from '../../../src/server/integrations/mercadolivre/auth.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import { requireCompany } from '../../../src/server/auth/requireCompany.js'

// Retorna a URL de autorização como JSON (em vez de redirect 302 direto) pra
// exigir sessão autenticada primeiro — uma navegação de browser normal não
// carrega o Bearer token, então o client busca essa URL via fetch autenticado
// e só então navega (ver ConnectionContext.connectMercadoLivre).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
    if (missing.length > 0) {
      console.error('[mercadolivre/authorize] missing env vars:', missing.join(', '))
      res.status(200).json({ ok: false, source: 'config_missing', message: 'Credenciais do Mercado Livre ainda não configuradas.' })
      return
    }

    const auth = await requireCompany(req, res)
    if (!auth) return

    const state = signState(auth.companyId)
    await logSyncEvent({
      companyId: auth.companyId,
      connectionId: null,
      provider: 'mercadolivre',
      eventType: 'oauth_started',
      status: 'info',
      message: 'Authorization redirect issued',
    })
    res.status(200).json({ ok: true, url: getAuthorizationUrl(state) })
  } catch (err) {
    console.error('[mercadolivre/authorize]', err)
    res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado ao iniciar autorização com o Mercado Livre.' })
  }
}
