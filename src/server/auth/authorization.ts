import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getRequestId } from '../security/requestContext.js'
import { securityLog } from '../security/logger.js'
import { writeSecurityAudit } from '../security/auditLog.js'
import { requireCompany, type CompanyContext, type CompanyRole } from './requireCompany.js'

export const CAPABILITIES = [
  'team.read', 'team.invite', 'team.remove',
  'company.read', 'company.settings.manage',
  'products.read', 'products.write',
  'inventory.read', 'inventory.write',
  'marketplaces.read', 'marketplaces.manage',
  'finance.read', 'reports.read',
  'support.read', 'support.write',
] as const

export type Capability = (typeof CAPABILITIES)[number]

const ALL_CAPABILITIES = new Set<Capability>(CAPABILITIES)
const OPERATION_READ: Capability[] = ['company.read', 'products.read', 'inventory.read', 'marketplaces.read', 'finance.read', 'reports.read', 'support.read']
const OPERATION_WRITE: Capability[] = ['products.write', 'inventory.write', 'marketplaces.manage', 'support.write']

const ROLE_CAPABILITIES: Record<CompanyRole, ReadonlySet<Capability>> = {
  owner: ALL_CAPABILITIES,
  admin: new Set([...OPERATION_READ, ...OPERATION_WRITE, 'team.read', 'team.invite', 'team.remove', 'company.settings.manage']),
  manager: new Set([...OPERATION_READ, ...OPERATION_WRITE, 'team.read']),
  member: new Set([...OPERATION_READ, ...OPERATION_WRITE, 'team.read']),
  viewer: new Set([...OPERATION_READ, 'team.read']),
  unknown: new Set(),
}

export function hasCapability(role: CompanyRole, capability: Capability): boolean {
  return ROLE_CAPABILITIES[role].has(capability)
}

export function canAssignRole(actorRole: CompanyRole, targetRole: CompanyRole): boolean {
  if (targetRole === 'owner' || targetRole === 'unknown') return false
  if (actorRole === 'owner') return ['admin', 'manager', 'member', 'viewer'].includes(targetRole)
  if (actorRole === 'admin') return ['manager', 'member', 'viewer'].includes(targetRole)
  return false
}

export function canRemoveRole(actorRole: CompanyRole, targetRole: CompanyRole): boolean {
  if (targetRole === 'owner' || targetRole === 'unknown') return false
  if (actorRole === 'owner') return true
  if (actorRole === 'admin') return ['manager', 'member', 'viewer'].includes(targetRole)
  return false
}

export async function requireCapability(req: VercelRequest, res: VercelResponse, capability: Capability): Promise<CompanyContext | null> {
  const context = await requireCompany(req, res)
  if (!context) return null
  if (context.isPlatformAdmin || hasCapability(context.role, capability)) return context

  const requestId = getRequestId(req, res)
  securityLog('warn', 'authorization.denied', {
    requestId,
    route: req.url,
    userId: context.userId,
    companyId: context.companyId,
    actorRole: context.role,
    status: 'forbidden',
    reason: capability,
  })
  await writeSecurityAudit({ requestId, actorUserId: context.userId, companyId: context.companyId, action: 'authorization.denied', metadata: { capability } })
  res.status(403).json({ ok: false, error: { code: 'FORBIDDEN', message: 'Voc\u00ea n\u00e3o tem permiss\u00e3o para esta a\u00e7\u00e3o.' }, requestId })
  return null
}
