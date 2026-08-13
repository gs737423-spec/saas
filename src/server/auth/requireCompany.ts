import type { User } from '@supabase/supabase-js'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../integrations/supabaseAdmin.js'
import { securityLog } from '../security/logger.js'
import { writeSecurityAudit } from '../security/auditLog.js'
import { getRequestId } from '../security/requestContext.js'
import { getBearerToken, requireUser } from './requireUser.js'

const UNDEFINED_TABLE = '42P01'
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type CompanyRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'unknown'

export interface CompanyMembership {
  company_id: string
  role: unknown
}

export interface CompanyContext {
  user: User
  userId: string
  companyId: string
  role: CompanyRole
  isAdmin: boolean
  isPlatformAdmin: boolean
  aal: 'aal1' | 'aal2'
  requestId: string
}

export type MembershipResolution =
  | { status: 'resolved'; membership: CompanyMembership }
  | { status: 'none' }
  | { status: 'context_required' }
  | { status: 'forbidden' }

export function normalizeCompanyRole(value: unknown): CompanyRole {
  return value === 'owner' || value === 'admin' || value === 'manager' || value === 'member' || value === 'viewer' ? value : 'unknown'
}

export function resolveMembership(memberships: CompanyMembership[], requestedCompanyId: string | null): MembershipResolution {
  if (memberships.length === 0) return { status: 'none' }
  if (requestedCompanyId) {
    const membership = memberships.find((item) => item.company_id === requestedCompanyId)
    return membership ? { status: 'resolved', membership } : { status: 'forbidden' }
  }
  if (memberships.length === 1) return { status: 'resolved', membership: memberships[0] }
  return { status: 'context_required' }
}

export function parseRequestedCompanyId(value: unknown): string | null {
  return typeof value === 'string' && UUID.test(value) ? value : null
}

function requestedCompanyId(req: VercelRequest): { value: string | null; supplied: boolean } {
  const header = req.headers['x-company-id']
  const headerValue = Array.isArray(header) ? header[0] : header
  const queryValue = typeof req.query.company_id === 'string' ? req.query.company_id : null
  const value = typeof headerValue === 'string' ? headerValue : queryValue
  return { value: parseRequestedCompanyId(value), supplied: value !== null && value !== undefined }
}

function assuranceLevel(req: VercelRequest): 'aal1' | 'aal2' {
  try {
    const token = getBearerToken(req)
    const payload = token?.split('.')[1]
    if (!payload) return 'aal1'
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { aal?: unknown }
    return claims.aal === 'aal2' ? 'aal2' : 'aal1'
  } catch {
    return 'aal1'
  }
}

export async function requireCompany(req: VercelRequest, res: VercelResponse): Promise<CompanyContext | null> {
  const requestId = getRequestId(req, res)
  const user = await requireUser(req, res)
  if (!user) return null
  const supabase = await getSupabaseAdmin()

  const { data: adminRow, error: adminError } = await supabase.from('platform_admins').select('user_id').eq('user_id', user.id).maybeSingle()
  if (adminError && adminError.code !== UNDEFINED_TABLE) {
    res.status(500).json({ ok: false, error: { code: 'SERVER_ERROR', message: 'Falha ao verificar permiss\u00e3o de administrador.' }, requestId })
    return null
  }

  const requested = requestedCompanyId(req)
  if (requested.supplied && !requested.value) {
    res.status(400).json({ ok: false, error: { code: 'INVALID_COMPANY_CONTEXT', message: 'Contexto de empresa inv\u00e1lido.' }, requestId })
    return null
  }
  const explicitCompanyId = requested.value
  if (adminRow) {
    if (!explicitCompanyId) {
      res.status(409).json({ ok: false, error: { code: 'COMPANY_CONTEXT_REQUIRED', message: 'Administrador precisa escolher uma empresa explicitamente.' }, requestId })
      return null
    }
    const { data: company, error } = await supabase.from('companies').select('id').eq('id', explicitCompanyId).maybeSingle()
    if (error || !company) {
      res.status(404).json({ ok: false, error: { code: 'COMPANY_NOT_FOUND', message: 'Empresa n\u00e3o encontrada.' }, requestId })
      return null
    }
    securityLog('info', 'platform_admin.tenant_access', { requestId, route: req.url, userId: user.id, companyId: explicitCompanyId, actorRole: 'platform_admin', status: 'allowed' })
    await writeSecurityAudit({ requestId, actorUserId: user.id, companyId: explicitCompanyId, action: 'platform_admin.tenant_access', targetType: 'company', targetId: explicitCompanyId })
    return { user, userId: user.id, companyId: explicitCompanyId, role: 'unknown', isAdmin: true, isPlatformAdmin: true, aal: assuranceLevel(req), requestId }
  }

  const { data, error } = await supabase.from('company_members').select('company_id, role').eq('user_id', user.id)
  if (error) {
    const status = error.code === UNDEFINED_TABLE ? 503 : 500
    const code = error.code === UNDEFINED_TABLE ? 'NOT_CONFIGURED' : 'SERVER_ERROR'
    res.status(status).json({ ok: false, error: { code, message: 'Falha ao resolver empresa do usu\u00e1rio.' }, requestId })
    return null
  }

  const resolution = resolveMembership((data ?? []) as CompanyMembership[], explicitCompanyId)
  if (resolution.status === 'none') {
    res.status(403).json({ ok: false, error: { code: 'NO_COMPANY', message: 'Usu\u00e1rio n\u00e3o est\u00e1 vinculado a nenhuma empresa.' }, requestId })
    return null
  }
  if (resolution.status === 'context_required') {
    res.status(409).json({ ok: false, error: { code: 'COMPANY_CONTEXT_REQUIRED', message: 'Escolha uma empresa para continuar.' }, requestId })
    return null
  }
  if (resolution.status === 'forbidden') {
    res.status(403).json({ ok: false, error: { code: 'COMPANY_ACCESS_DENIED', message: 'Acesso negado para a empresa informada.' }, requestId })
    return null
  }

  return {
    user,
    userId: user.id,
    companyId: resolution.membership.company_id,
    role: normalizeCompanyRole(resolution.membership.role),
    isAdmin: false,
    isPlatformAdmin: false,
    aal: assuranceLevel(req),
    requestId,
  }
}
