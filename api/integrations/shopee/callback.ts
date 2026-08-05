import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, SHOPEE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { exchangeCodeForToken, verifyState } from '../../../src/server/integrations/shopee/auth.js'
import { encryptSecret } from '../../../src/server/integrations/crypto.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const appBaseUrl = process.env.APP_BASE_URL

  try {
    const missing = getMissingEnvVars(SHOPEE_ENV_VARS)
    if (missing.length > 0 || !appBaseUrl) {
      console.error('[shopee/callback] missing env vars:', missing.join(', '))
      res.status(200).json({ ok: false, source: 'config_missing', message: 'Configuração pendente — variáveis de ambiente da Shopee ausentes.' })
      return
    }

    // A Shopee anexa `code` e `shop_id` na própria URL de `redirect` que
    // passamos no auth_partner — `state` sobrevive porque já vinha
    // embutido nessa mesma URL (ver getAuthorizationUrl em shopee/auth.ts).
    const { code, shop_id: shopId, state } = req.query as { code?: string; shop_id?: string; state?: string }

    const statePayload = verifyState(state)
    if (!statePayload || !code || !shopId) {
      await logSyncEvent({
        connectionId: null,
        provider: 'shopee',
        eventType: 'validation_error',
        status: 'error',
        message: !code ? 'Missing authorization code in callback' : !shopId ? 'Missing shop_id in callback' : 'Invalid or expired OAuth state',
      })
      res.redirect(302, `${appBaseUrl}/app/importacoes?connected=shopee&status=error`)
      return
    }

    const companyId = statePayload.companyId
    const tokenResponse = await exchangeCodeForToken(code, shopId)
    const supabase = await getSupabaseAdmin()

    const { data, error: upsertError } = await supabase
      .from('marketplace_connections')
      .upsert(
        {
          company_id: companyId,
          provider: 'shopee',
          status: 'connected',
          external_account_id: shopId,
          seller_id: shopId,
          access_token_encrypted: encryptSecret(tokenResponse.access_token),
          refresh_token_encrypted: encryptSecret(tokenResponse.refresh_token),
          token_expires_at: new Date(Date.now() + tokenResponse.expire_in * 1000).toISOString(),
          scopes: null,
          last_error: null,
        },
        { onConflict: 'company_id,provider' }
      )
      .select('id')
      .single()

    if (upsertError || !data) {
      throw new Error(upsertError?.message ?? 'Failed to persist connection')
    }

    await logSyncEvent({
      companyId,
      connectionId: data.id,
      provider: 'shopee',
      eventType: 'oauth_connected',
      status: 'success',
      message: 'Shopee connection established',
      payload: { shopId },
    })

    res.redirect(302, `${appBaseUrl}/app/importacoes?connected=shopee`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during token exchange'
    console.error('[shopee/callback]', message)
    await logSyncEvent({
      connectionId: null,
      provider: 'shopee',
      eventType: 'oauth_error',
      status: 'error',
      message,
    })
    if (appBaseUrl) {
      res.redirect(302, `${appBaseUrl}/app/importacoes?connected=shopee&status=error`)
    } else {
      res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado durante autenticação com a Shopee.' })
    }
  }
}
