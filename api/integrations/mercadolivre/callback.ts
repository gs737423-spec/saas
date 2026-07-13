import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin'
import { exchangeCodeForToken, verifyState } from '../../../src/server/integrations/mercadolivre/auth'
import { encryptSecret } from '../../../src/server/integrations/crypto'
import { logSyncEvent } from '../../../src/server/integrations/syncLog'
import { DEFAULT_COMPANY_ID } from '../../../src/server/integrations/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const appBaseUrl = process.env.APP_BASE_URL

  try {
    const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
    if (missing.length > 0 || !appBaseUrl) {
      console.error('[mercadolivre/callback] missing env vars:', missing.join(', '))
      // No safe redirect target without APP_BASE_URL — this is the one case where a
      // JSON error is more honest than guessing a URL to bounce the browser to.
      res.status(200).json({ ok: false, source: 'config_missing', message: 'Configuração pendente — variáveis de ambiente do Mercado Livre ausentes.' })
      return
    }

    const { code, state, error: mlError } = req.query as { code?: string; state?: string; error?: string }

    if (mlError) {
      await logSyncEvent({
        connectionId: null,
        provider: 'mercadolivre',
        eventType: 'oauth_error',
        status: 'error',
        message: `Mercado Livre returned error: ${mlError}`,
      })
      res.redirect(302, `${appBaseUrl}/importacoes?connected=mercadolivre&status=error`)
      return
    }

    const statePayload = verifyState(state)
    if (!statePayload || !code) {
      await logSyncEvent({
        connectionId: null,
        provider: 'mercadolivre',
        eventType: 'validation_error',
        status: 'error',
        message: !code ? 'Missing authorization code in callback' : 'Invalid or expired OAuth state',
      })
      res.redirect(302, `${appBaseUrl}/importacoes?connected=mercadolivre&status=error`)
      return
    }

    const tokenResponse = await exchangeCodeForToken(code)
    const supabase = await getSupabaseAdmin()

    const { data, error: upsertError } = await supabase
      .from('marketplace_connections')
      .upsert(
        {
          company_id: DEFAULT_COMPANY_ID,
          provider: 'mercadolivre',
          status: 'connected',
          external_account_id: String(tokenResponse.user_id),
          seller_id: String(tokenResponse.user_id),
          access_token_encrypted: encryptSecret(tokenResponse.access_token),
          refresh_token_encrypted: encryptSecret(tokenResponse.refresh_token),
          token_expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
          scopes: tokenResponse.scope,
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
      connectionId: data.id,
      provider: 'mercadolivre',
      eventType: 'oauth_connected',
      status: 'success',
      message: 'Mercado Livre connection established',
      payload: { externalAccountId: String(tokenResponse.user_id), scopes: tokenResponse.scope },
    })

    res.redirect(302, `${appBaseUrl}/importacoes?connected=mercadolivre`)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during token exchange'
    console.error('[mercadolivre/callback]', message)
    await logSyncEvent({
      connectionId: null,
      provider: 'mercadolivre',
      eventType: 'oauth_error',
      status: 'error',
      message,
    })
    if (appBaseUrl) {
      res.redirect(302, `${appBaseUrl}/importacoes?connected=mercadolivre&status=error`)
    } else {
      res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado durante autenticação com o Mercado Livre.' })
    }
  }
}
