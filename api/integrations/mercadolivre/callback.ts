import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin'
import { exchangeCodeForToken, verifyState } from '../../../src/server/integrations/mercadolivre/auth'
import { encryptSecret } from '../../../src/server/integrations/crypto'
import { logSyncEvent } from '../../../src/server/integrations/syncLog'
import { DEFAULT_COMPANY_ID } from '../../../src/server/integrations/types'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const missing = getMissingEnvVars(MERCADOLIVRE_ENV_VARS)
  const appBaseUrl = process.env.APP_BASE_URL

  if (missing.length > 0 || !appBaseUrl) {
    console.error('[mercadolivre/callback] missing env vars:', missing.join(', '))
    res.status(500).json({ error: 'config_missing', missing })
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

  try {
    const tokenResponse = await exchangeCodeForToken(code)
    const supabase = getSupabaseAdmin()

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
    console.error('[mercadolivre/callback] failed:', message)
    await logSyncEvent({
      connectionId: null,
      provider: 'mercadolivre',
      eventType: 'oauth_error',
      status: 'error',
      message,
    })
    res.redirect(302, `${appBaseUrl}/importacoes?connected=mercadolivre&status=error`)
  }
}
