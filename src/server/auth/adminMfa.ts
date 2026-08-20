export type AssuranceLevel = 'aal1' | 'aal2'

export function getAssuranceLevel(token: string | null): AssuranceLevel {
  try {
    const payload = token?.split('.')[1]
    if (!payload) return 'aal1'
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { aal?: unknown }
    return claims.aal === 'aal2' ? 'aal2' : 'aal1'
  } catch {
    return 'aal1'
  }
}

export function hasVerifiedMfaFactor(factors: Array<{ status?: string }> | null | undefined): boolean {
  return (factors ?? []).some((factor) => factor.status === 'verified')
}
