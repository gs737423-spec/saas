import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCapability } from '../../../src/server/auth/authorization.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'
import { getRequestId } from '../../../src/server/security/requestContext.js'
import { writeSecurityAudit } from '../../../src/server/security/auditLog.js'
import { encryptSecret } from '../../../src/server/integrations/crypto.js'
import { getMissingEnvVars, getSupabaseAdmin, VTEX_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'
import { loadVtexConnection, testVtexConnection } from '../../../src/server/integrations/vtex/connection.js'
import { publicVtexError } from '../../../src/server/integrations/vtex/errors.js'
import { normalizeVtexAccountName, normalizeVtexChannelMappings, validateVtexCredential } from '../../../src/server/integrations/vtex/validation.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'PUT') return void res.status(405).json({ ok: false, error: 'method_not_allowed' })
  const auth = await requireCapability(req, res, 'marketplaces.manage')
  if (!auth) return
  if (getMissingEnvVars(VTEX_ENV_VARS).length > 0) return void res.status(503).json({ ok: false, error: 'config_missing', message: 'Configuração segura da integração VTEX pendente.' })
  if (!(await checkRateLimit(res, `vtex-credentials:${auth.companyId}`, 5, 1800, { req, route: '/api/integrations/vtex/credentials', policy: 'critical' }))) return
  try {
    const current = await loadVtexConnection(auth.companyId)
    const credentials = {
      accountName: normalizeVtexAccountName(req.body?.accountName ?? current.external_account_id),
      appKey: validateVtexCredential(req.body?.appKey, 'appKey'),
      appToken: validateVtexCredential(req.body?.appToken, 'appToken'),
    }
    const channelMappings = normalizeVtexChannelMappings(req.body?.channelMappings ?? current.provider_metadata?.channelMappings)
    const test = await testVtexConnection(credentials)
    if (!test.valid || test.missingRequired.length > 0) return void res.status(200).json({ ok: false, error: test.valid ? 'VTEX_PERMISSION_REQUIRED' : 'VTEX_INVALID_CREDENTIALS', message: 'As novas credenciais não foram aplicadas. A conexão anterior foi preservada.', permissions: test.permissions })
    const supabase = await getSupabaseAdmin()
    const { error } = await supabase.from('marketplace_connections').update({ external_account_id: credentials.accountName, credential_key_encrypted: encryptSecret(credentials.appKey), credential_secret_encrypted: encryptSecret(credentials.appToken), permissions: Object.fromEntries(test.permissions.map((permission) => [permission.domain, permission.ok])), provider_metadata: { ...(current.provider_metadata ?? {}), authMethod: 'application_key', channelMappings }, status: 'connected', last_error: null, failure_count: 0, circuit_open_until: null }).eq('id', current.id).eq('company_id', auth.companyId)
    if (error) throw new Error(error.message)
    const requestId = getRequestId(req, res)
    await writeSecurityAudit({ requestId, actorUserId: auth.userId, companyId: auth.companyId, action: 'vtex.credentials_rotate', targetType: 'marketplace_connection', targetId: current.id })
    await logSyncEvent({ companyId: auth.companyId, connectionId: current.id, provider: 'vtex', eventType: 'credentials_rotated', status: 'success', message: 'VTEX credentials rotated after validation' })
    res.status(200).json({ ok: true })
  } catch (error) {
    const safe = publicVtexError(error)
    res.status(200).json({ ok: false, error: safe.code, message: safe.message })
  }
}
