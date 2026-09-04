export const COMPANY_PROVISION_RPC = 'provision_company_with_owner'

export function normalizeOwnerEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

export function ownerProvisionParams(input: { company: Record<string, unknown>; ownerUserId: string; actorUserId: string; requestId: string }) {
  return {
    p_company: input.company,
    p_owner_user_id: input.ownerUserId,
    p_actor_user_id: input.actorUserId,
    p_request_id: input.requestId,
  }
}
