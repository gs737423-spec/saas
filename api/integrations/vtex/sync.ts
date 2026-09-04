import type { VercelRequest, VercelResponse } from '@vercel/node'
import { requireCapability } from '../../../src/server/auth/authorization.js'
import { checkRateLimit } from '../../../src/server/auth/rateLimit.js'
import { publicVtexError } from '../../../src/server/integrations/vtex/errors.js'
import { getMissingEnvVars, VTEX_ENV_VARS } from '../../../src/server/integrations/supabaseAdmin.js'
import { processVtexSyncRun, queueVtexSync } from '../../../src/server/integrations/vtex/sync.js'

export const config = { maxDuration: 300 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return void res.status(405).json({ ok: false, error: 'method_not_allowed' })
  const auth = await requireCapability(req, res, 'marketplaces.manage')
  if (!auth) return
  if (getMissingEnvVars(VTEX_ENV_VARS).length > 0) return void res.status(503).json({ ok: false, error: 'config_missing', message: 'Configuração segura da integração VTEX pendente.' })
  if (!(await checkRateLimit(res, `vtex-sync:${auth.companyId}`, 10, 1800, { req, route: '/api/integrations/vtex/sync', policy: 'critical' }))) return
  try {
    const mode = req.body?.mode === 'incremental' ? 'incremental' : 'full'
    const queued = await queueVtexSync(auth.companyId, mode, 'manual')
    const run = await processVtexSyncRun(auth.companyId, queued.id)
    // `processVtexSyncRun` nunca devolve `status:'running'` para quem chama
    // — todo yield por orçamento de tempo devolve `'queued'` (só o banco
    // passa por `'running'` internamente). Sync manual que só progrediu
    // normalmente (caso comum em catálogo/histórico grande) chegava aqui
    // como `ok:false`, indistinguível de falha real.
    res.status(200).json({ ok: run.status === 'success' || run.status === 'queued' || run.status === 'partial', run: { id: run.id, mode: run.mode, status: run.status, stage: run.stage, checkpoint: run.checkpoint, counts: run.counts, errors: run.errors } })
  } catch (error) {
    const safe = publicVtexError(error)
    res.status(200).json({ ok: false, error: safe.code, message: safe.message })
  }
}
