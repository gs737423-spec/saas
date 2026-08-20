import { describe, expect, it } from 'vitest'
import { parseRequestedCompanyId, resolveMembership } from '../../src/server/auth/requireCompany.js'

const tenantA = '00000000-0000-4000-8000-00000000000a'
const tenantB = '00000000-0000-4000-8000-00000000000b'

describe('tenant A/B and identifier tampering', () => {
  const membershipA = { company_id: tenantA, role: 'owner' }
  const membershipB = { company_id: tenantB, role: 'viewer' }

  it('never treats knowledge of tenant B id as tenant B membership', () => {
    expect(resolveMembership([membershipA], tenantB)).toEqual({ status: 'forbidden' })
    expect(resolveMembership([membershipB], tenantA)).toEqual({ status: 'forbidden' })
  })

  it('binds the selected role to the selected tenant for a legitimate multi-tenant user', () => {
    expect(resolveMembership([membershipA, membershipB], tenantB)).toEqual({ status: 'resolved', membership: membershipB })
    expect(resolveMembership([membershipA, membershipB], tenantA)).toEqual({ status: 'resolved', membership: membershipA })
  })

  it('rejects encoding, array, suffix and object tampering before membership resolution', () => {
    for (const value of [`${tenantA}/../${tenantB}`, `${tenantA}%00`, `${tenantA} `, [tenantA], { company_id: tenantA }, 1]) {
      expect(parseRequestedCompanyId(value)).toBeNull()
    }
  })
})
