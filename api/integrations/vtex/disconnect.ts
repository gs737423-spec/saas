import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCapability } from '../../../src/server/auth/authorization.js'
import { getRequestId } from '../../../src/server/security/requestContext.js'
import { writeSecurityAudit } from '../../../src/server/security/auditLog.js'
import { getSupabaseAdmin } from '../../../src/server/integrations/supabaseAdmin.js'
import { logSyncEvent } from '../../../src/server/integrations/syncLog.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') return void res.status(405).json({ ok: false, error: 'method_not_allowed' })
  const auth = await requireCapability(req, res, 'marketplaces.manage')
  if (!auth) return
  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase.from('marketplace_connections').update({ status: 'disconnected', credential_key_encrypted: null, credential_secret_encrypted: null, circuit_open_until: null, sync_started_at: null }).eq('company_id', auth.companyId).eq('provider', 'vtex').select('id').maybeSingle()
  if (error) return void res.status(500).json({ ok: false, message: 'Não foi possível desconectar a VTEX.' })
  if (data) {
    const requestId = getRequestId(req, res)
    await writeSecurityAudit({ requestId, actorUserId: auth.userId, companyId: auth.companyId, action: 'vtex.disconnect', targetType: 'marketplace_connection', targetId: data.id })
    await logSyncEvent({ companyId: auth.companyId, connectionId: data.id, provider: 'vtex', eventType: 'connection_disconnected', status: 'info', message: 'VTEX disconnected; synchronized data preserved' })
  }
  res.status(200).json({ ok: true, dataPreserved: true })
}
