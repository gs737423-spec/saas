import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCapability } from '../../../src/server/auth/authorization.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'
import { getRequestId } from '../../../src/server/security/requestContext.js'
import { writeSecurityAudit } from '../../../src/server/security/auditLog.js'
import { encryptSecret } from '../../../src/server/integrations/crypto.js'
import { getMissingEnvVars, getSupabaseAdmin, VTEX_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import { publicVtexError } from '../../../src/server/integrations/vtex/errors.js'
import { testVtexConnection } from '../../../src/server/integrations/vtex/connection.js'
import { normalizeVtexAccountName, normalizeVtexChannelMappings, normalizeVtexHistoryMonths, validateVtexCredential } from '../../../src/server/integrations/vtex/validation.js'
import { isExternalAccountSwitch } from '../../../src/server/integrations/accountIdentity.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return void res.status(405).json({ ok: false, error: 'method_not_allowed' })
  const auth = await requireCapability(req, res, 'marketplaces.manage')
  if (!auth) return
  if (getMissingEnvVars(VTEX_ENV_VARS).length > 0) return void res.status(503).json({ ok: false, error: 'config_missing', message: 'Configuração segura da integração VTEX pendente.' })
  if (!(await checkRateLimit(res, `vtex-connect:${auth.companyId}`, 5, 1800, { req, route: '/api/integrations/vtex/connect', policy: 'critical' }))) return
  const requestId = getRequestId(req, res)
  try {
    const credentials = {
      accountName: normalizeVtexAccountName(req.body?.accountName),
      appKey: validateVtexCredential(req.body?.appKey, 'appKey'),
      appToken: validateVtexCredential(req.body?.appToken, 'appToken'),
    }
    const channelMappings = normalizeVtexChannelMappings(req.body?.channelMappings)
    const historyMonths = normalizeVtexHistoryMonths(req.body?.historyMonths)
    const supabase = await getSupabaseAdmin()
    const { data: currentConnection, error: currentConnectionError } = await supabase
      .from('marketplace_connections')
      .select('id, external_account_id, provider_metadata')
      .eq('company_id', auth.companyId)
      .eq('provider', 'vtex')
      .maybeSingle()
    if (currentConnectionError) throw new Error(currentConnectionError.message)
    if (isExternalAccountSwitch(currentConnection?.external_account_id, credentials.accountName)) {
      res.status(409).json({ ok: false, error: 'VTEX_ACCOUNT_MISMATCH', message: 'A conta VTEX informada é diferente da conexão existente. A conexão e o histórico atuais foram preservados.' })
      return
    }
    const test = await testVtexConnection(credentials)
    if (!test.valid || test.missingRequired.length > 0) {
      res.status(200).json({ ok: false, error: test.valid ? 'VTEX_PERMISSION_REQUIRED' : 'VTEX_INVALID_CREDENTIALS', message: test.valid ? 'Credencial válida, mas faltam permissões para concluir a integração.' : 'A credencial VTEX é inválida.', permissions: test.permissions })
      return
    }
    const { data, error } = await supabase.from('marketplace_connections').upsert({
      company_id: auth.companyId,
      provider: 'vtex',
      status: 'connected',
      external_account_id: credentials.accountName,
      credential_key_encrypted: encryptSecret(credentials.appKey),
      credential_secret_encrypted: encryptSecret(credentials.appToken),
      permissions: Object.fromEntries(test.permissions.map((permission) => [permission.domain, permission.ok])),
      provider_metadata: { ...(currentConnection?.provider_metadata ?? {}), authMethod: 'application_key', channelMappings, historyMonths },
      last_error: null,
      failure_count: 0,
      circuit_open_until: null,
      next_sync_at: null,
      sync_started_at: null,
    }, { onConflict: 'company_id,provider' }).select('id, provider, status, external_account_id, permissions, last_sync_at, last_success_at').single()
    if (error) throw new Error(`Failed to persist VTEX connection: ${error.message}`)
    await writeSecurityAudit({ requestId, actorUserId: auth.userId, companyId: auth.companyId, action: 'vtex.connect', targetType: 'marketplace_connection', targetId: data.id, metadata: { accountName: credentials.accountName } })
    await logSyncEvent({ companyId: auth.companyId, connectionId: data.id, provider: 'vtex', eventType: 'connection_tested', status: 'success', message: 'VTEX connection established after permission validation' })
    res.status(200).json({ ok: true, connection: { id: data.id, provider: data.provider, status: data.status, accountName: data.external_account_id, permissions: data.permissions, lastSyncAt: data.last_sync_at, lastSuccessAt: data.last_success_at } })
  } catch (error) {
    const safe = publicVtexError(error)
    res.status(200).json({ ok: false, error: safe.code, message: safe.message })
  }
}
