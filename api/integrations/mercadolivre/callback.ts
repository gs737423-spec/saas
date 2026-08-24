import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMissingEnvVars, getSupabaseAdmin, MERCADOLIVRE_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { exchangeCodeForToken, verifyState } from '../../../src/server/integrations/mercadolivre/auth.js'
import { encryptSecret } from '../../../src/server/integrations/crypto.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import { isExternalAccountSwitch } from '../../../src/server/integrations/accountIdentity.js'

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
      res.redirect(302, `${appBaseUrl}/app/importacoes?connected=mercadolivre&status=error`)
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
      res.redirect(302, `${appBaseUrl}/app/importacoes?connected=mercadolivre&status=error`)
      return
    }

    const companyId = statePayload.companyId
    const tokenResponse = await exchangeCodeForToken(code)
    const supabase = await getSupabaseAdmin()

    const { data: currentConnection, error: currentConnectionError } = await supabase
      .from('marketplace_connections')
      .select('id, external_account_id')
      .eq('company_id', companyId)
      .eq('provider', 'mercadolivre')
      .maybeSingle()
    if (currentConnectionError) throw new Error(`Failed to validate existing connection: ${currentConnectionError.message}`)
    if (isExternalAccountSwitch(currentConnection?.external_account_id, String(tokenResponse.user_id))) {
      await logSyncEvent({ companyId, connectionId: currentConnection?.id ?? null, provider: 'mercadolivre', eventType: 'validation_error', status: 'error', message: 'Mercado Livre account switch blocked to protect existing tenant history' })
      res.redirect(302, `${appBaseUrl}/app/importacoes?connected=mercadolivre&status=account_mismatch`)
      return
    }

    // Sem refresh_token = a conta autorizante não tem permissão de
    // vendedor no Mercado Livre. Marcar como "connected" mesmo assim fazia
    // o sync falhar pra sempre em silêncio (loadConnection exige
    // refresh_token) enquanto a UI mostrava "Conectado" — cliente nunca
    // entendia o motivo. Agora fica status:'error' com mensagem explícita
    // desde a primeira tentativa.
    const isSellerAccount = Boolean(tokenResponse.refresh_token)

    const { data, error: upsertError } = await supabase
      .from('marketplace_connections')
      .upsert(
        {
          company_id: companyId,
          provider: 'mercadolivre',
          status: isSellerAccount ? 'connected' : 'error',
          external_account_id: String(tokenResponse.user_id),
          seller_id: String(tokenResponse.user_id),
          access_token_encrypted: encryptSecret(tokenResponse.access_token),
          refresh_token_encrypted: tokenResponse.refresh_token ? encryptSecret(tokenResponse.refresh_token) : null,
          token_expires_at: new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString(),
          scopes: tokenResponse.scope,
          last_error: isSellerAccount ? null : 'A conta do Mercado Livre autorizada não tem permissão de vendedor. Reconecte usando uma conta vendedora (com anúncios ativos).',
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
      provider: 'mercadolivre',
      eventType: 'oauth_connected',
      status: isSellerAccount ? 'success' : 'error',
      message: isSellerAccount ? 'Mercado Livre connection established' : 'Connected account has no seller permission (no refresh_token)',
      payload: { externalAccountId: String(tokenResponse.user_id), scopes: tokenResponse.scope },
    })

    res.redirect(302, `${appBaseUrl}/app/importacoes?connected=mercadolivre${isSellerAccount ? '' : '&status=error'}`)
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
      res.redirect(302, `${appBaseUrl}/app/importacoes?connected=mercadolivre&status=error`)
    } else {
      res.status(200).json({ ok: false, source: 'error', message: 'Erro controlado durante autenticação com o Mercado Livre.' })
    }
  }
}
