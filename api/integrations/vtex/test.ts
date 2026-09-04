import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCapability } from '../../../src/server/auth/authorization.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'
import { publicVtexError } from '../../../src/server/integrations/vtex/errors.js'
import { testVtexConnection } from '../../../src/server/integrations/vtex/connection.js'
import { normalizeVtexAccountName, validateVtexCredential } from '../../../src/server/integrations/vtex/validation.js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return void res.status(405).json({ ok: false, error: 'method_not_allowed' })
  const auth = await requireCapability(req, res, 'marketplaces.manage')
  if (!auth) return
  if (!(await checkRateLimit(res, `vtex-test:${auth.companyId}`, 10, 1800, { req, route: '/api/integrations/vtex/test', policy: 'critical' }))) return
  try {
    const result = await testVtexConnection({
      accountName: normalizeVtexAccountName(req.body?.accountName),
      appKey: validateVtexCredential(req.body?.appKey, 'appKey'),
      appToken: validateVtexCredential(req.body?.appToken, 'appToken'),
    })
    res.status(200).json({ ok: result.valid && result.missingRequired.length === 0, result })
  } catch (error) {
    const safe = publicVtexError(error)
    res.status(200).json({ ok: false, error: safe.code, message: safe.message })
  }
}
