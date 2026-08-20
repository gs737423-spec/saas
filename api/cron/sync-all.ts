import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getMissingEnvVars, CORE_ENV_VARS, MERCADOLIVRE_ENV_VARS, SHOPEE_ENV_VARS } from '../../src/server/integrations/supabaseAdmin.js'
import { runMercadoLivreSync } from '../../src/server/integrations/mercadolivre/sync.js'
import { runShopeeSync } from '../../src/server/integrations/shopee/sync.js'
import type { Provider } from '../../src/server/integrations/types.js'

// Sync recorrente automático — antes só existia o botão manual em cada
// endpoint /api/integrations/{provider}/sync.ts. Chamado pelo Vercel Cron
// (ver `crons` em vercel.json), nunca pelo navegador do cliente.
export const config = { maxDuration: 300 }

type Syncer = (companyId: string) => Promise<{ errors: string[] }>
const SYNCERS: Partial<Record<Provider, Syncer>> = {
  mercadolivre: runMercadoLivreSync,
  shopee: runShopeeSync,
}

interface SyncResult {
  companyId: string
  provider: Provider
  ok: boolean
  message?: string
}

interface CronConnection {
  company_id: string
  provider: Provider
  last_sync_at: string | null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Vercel Cron manda `Authorization: Bearer ${CRON_SECRET}` automaticamente
  // quando CRON_SECRET está configurado nas env vars do projeto — é a forma
  // oficial de garantir que só o próprio Cron da Vercel (não qualquer um que
  // ache a URL) consegue disparar sync de todas as empresas de uma vez.
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) {
    res.status(503).json({ ok: false, error: 'not_configured', message: 'CRON_SECRET não configurado no servidor.' })
    return
  }
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    res.status(401).json({ ok: false, error: 'unauthorized' })
    return
  }

  const missingCore = getMissingEnvVars(CORE_ENV_VARS)
  if (missingCore.length > 0) {
    res.status(200).json({ ok: false, error: 'config_missing', message: 'Configuração do Supabase pendente.', results: [] as SyncResult[] })
    return
  }

  // Providers sem env var configurada são pulados por inteiro (não tenta e
  // falha conexão por conexão) — mesmo padrão de skip usado nos endpoints
  // manuais de sync.
  const availableProviders = (Object.keys(SYNCERS) as Provider[]).filter((provider) => {
    const envVars = provider === 'mercadolivre' ? MERCADOLIVRE_ENV_VARS : provider === 'shopee' ? SHOPEE_ENV_VARS : null
    return envVars ? getMissingEnvVars(envVars).length === 0 : false
  })

  if (availableProviders.length === 0) {
    res.status(200).json({ ok: true, results: [] as SyncResult[], message: 'Nenhum provider com credenciais configuradas.' })
    return
  }

  try {
    const supabase = await getSupabaseAdmin()
    const { data: connections, error, count } = await supabase
      .from('marketplace_connections')
      .select('company_id, provider, last_sync_at', { count: 'exact' })
      .eq('status', 'connected')
      .in('provider', availableProviders)
      .order('last_sync_at', { ascending: true, nullsFirst: true })
      .order('company_id', { ascending: true })
      .order('provider', { ascending: true })
      // Uma conexão por tick é deliberado: cada sync individual pode consumir
      // quase todo o maxDuration. O cron roda a cada 5 minutos e o próximo
      // tick seleciona automaticamente a conexão com last_sync_at mais antigo,
      // sem depender de cursor que nenhum scheduler consumia.
      .limit(1)
    if (error) throw new Error(error.message)

    const results: SyncResult[] = []
    const orderedConnections = (connections ?? []) as CronConnection[]
    for (const conn of orderedConnections) {
      const provider = conn.provider as Provider
      const syncer = SYNCERS[provider]
      if (!syncer) continue
      try {
        const summary = await syncer(conn.company_id)
        results.push({ companyId: conn.company_id, provider, ok: summary.errors.length === 0 })
      } catch (err) {
        // 1 empresa falhando (token expirado, sync já em andamento, API fora
        // do ar) não pode abortar as demais — mesmo isolamento por item que
        // os syncs individuais já usam internamente.
        results.push({ companyId: conn.company_id, provider, ok: false, message: err instanceof Error ? err.message : 'Erro desconhecido' })
      }
    }

    const remainingCount = Math.max(0, (count ?? orderedConnections.length) - results.length)
    res.status(200).json({
      ok: true,
      partial: remainingCount > 0,
      syncedCount: results.length,
      remainingCount,
      continuation: remainingCount > 0 ? 'next_scheduled_tick' : null,
      results,
    })
  } catch (err) {
    console.error('[api/cron/sync-all]', err)
    res.status(500).json({ ok: false, message: 'Erro ao listar conexões pra sync agendado.' })
  }
}
