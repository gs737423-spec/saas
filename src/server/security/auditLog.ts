import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { securityLog } from './logger.js'

export interface AuditEvent {
  requestId: string
  actorUserId: string
  companyId?: string
  action: string
  targetType?: string
  targetId?: string
  metadata?: Record<string, string | number | boolean | null>
}

export async function writeSecurityAudit(event: AuditEvent): Promise<void> {
  try {
    const supabase = await getSupabaseAdmin()
    const { error } = await supabase.from('security_audit_logs').insert({
      request_id: event.requestId,
      actor_user_id: event.actorUserId,
      company_id: event.companyId ?? null,
      action: event.action,
      target_type: event.targetType ?? null,
      target_id: event.targetId ?? null,
      metadata: event.metadata ?? {},
    })
    if (error) throw new Error(error.code ?? 'audit_insert_failed')
  } catch {
    securityLog('error', 'security_audit.write_failed', { requestId: event.requestId, userId: event.actorUserId, companyId: event.companyId, reason: event.action })
  }
}
