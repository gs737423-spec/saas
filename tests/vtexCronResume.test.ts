import { describe, expect, it, vi } from 'vitest'

// -----------------------------------------------------------------------
// Causa raiz real de produção: uma run `queued` (yieldada por orçamento de
// tempo) ficava esperando a conexão voltar a ficar "due" (intervalo de 24h,
// VTEX_AUTO_SYNC_INTERVAL_MS) antes do cron voltar a processá-la — mesmo o
// cron rodando a cada poucos minutos. `queueVtexSync` checava
// `isVtexSyncDue` ANTES de olhar se já existia uma run ativa; e o cron só
// visitava conexões que passavam pelo filtro de "due" no SQL, então uma
// conexão com run `queued` mas fora da janela de due nunca era nem chamada.
//
// A correção: `queueVtexSync` agora olha a run ativa PRIMEIRO — se existe
// `queued`/`running`, retoma ela incondicionalmente, sem checar due. O due
// só é aplicado quando NÃO há run ativa (decidindo se inicia uma sync nova).
// -----------------------------------------------------------------------

const connection = {
  id: 'connection-1',
  company_id: 'company-a',
  provider: 'vtex',
  status: 'connected',
  circuit_open_until: null,
  next_sync_at: '2099-01-01T00:00:00.000Z', // MUITO no futuro — conexão definitivamente NÃO due
  provider_metadata: {},
  sync_started_at: null,
}

vi.mock('../src/server/integrations/syncLog.js', () => ({ logSyncEvent: vi.fn(async () => undefined) }))
vi.mock('../src/server/integrations/vtex/connection.js', () => ({
  loadVtexConnection: vi.fn(async () => connection),
  credentialsFromConnection: vi.fn(),
}))

function makeSupabaseMock(options: { activeRun: Record<string, unknown> | null }) {
  const updateCalls: Array<{ table: string; patch: Record<string, unknown> }> = []
  const from = vi.fn((table: string) => {
    const builder: Record<string, unknown> = {}
    const chain = () => builder
    builder.select = vi.fn(chain)
    builder.eq = vi.fn(chain)
    builder.in = vi.fn(chain)
    builder.lt = vi.fn(chain)
    builder.or = vi.fn(chain)
    builder.gt = vi.fn(chain)
    builder.gte = vi.fn(chain)
    builder.order = vi.fn(chain)
    builder.maybeSingle = vi.fn(async () => {
      if (table === 'integration_sync_runs') return { data: options.activeRun, error: null }
      return { data: null, error: null }
    })
    builder.update = vi.fn((patch: Record<string, unknown>) => {
      updateCalls.push({ table, patch })
      return { eq: vi.fn(chain), lt: vi.fn(chain), neq: vi.fn(chain), select: vi.fn(async () => ({ data: [], error: null })) }
    })
    return builder
  })
  return { from, updateCalls } as unknown as { from: typeof from; updateCalls: typeof updateCalls }
}

vi.mock('../src/server/integrations/supabaseAdmin.js', () => ({
  getSupabaseAdmin: vi.fn(async () => makeSupabaseMock({ activeRun: null })),
}))

describe('queueVtexSync — run ativa tem prioridade sobre "due" (regressão real de produção)', () => {
  it('conexão NÃO due + run status=queued existente → retoma a run ativa, não lança VtexSyncNotDueError, não cria segunda run', async () => {
    const { getSupabaseAdmin } = await import('../src/server/integrations/supabaseAdmin.js')
    const activeRun = { id: 'run-1', status: 'queued', stage: 'orders', mode: 'incremental' }
    vi.mocked(getSupabaseAdmin).mockResolvedValueOnce(makeSupabaseMock({ activeRun }) as never)

    const { queueVtexSync } = await import('../src/server/integrations/vtex/sync.js')
    const result = await queueVtexSync('company-a', 'incremental', 'auto')

    expect(result).toEqual(activeRun) // retomou a existente, não criou outra
  })

  it('conexão NÃO due + nenhuma run ativa → continua bloqueando sync nova (VtexSyncNotDueError)', async () => {
    const { getSupabaseAdmin } = await import('../src/server/integrations/supabaseAdmin.js')
    vi.mocked(getSupabaseAdmin).mockResolvedValueOnce(makeSupabaseMock({ activeRun: null }) as never)

    const { queueVtexSync } = await import('../src/server/integrations/vtex/sync.js')
    const { VtexSyncNotDueError } = await import('../src/server/integrations/vtex/schedule.js')

    await expect(queueVtexSync('company-a', 'incremental', 'auto')).rejects.toBeInstanceOf(VtexSyncNotDueError)
  })
})
