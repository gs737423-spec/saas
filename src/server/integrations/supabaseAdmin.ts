import type { SupabaseClient } from '@supabase/supabase-js'

/** Teto de segurança pra não paginar pra sempre se algo external ficar
 *  devolvendo página cheia indefinidamente (bug do provedor, não deveria
 *  acontecer) — 50k usuários é bem acima de qualquer volume real esperado. */
const LIST_USERS_MAX_PAGES = 50

/** Env vars required for ANY Supabase-backed integration operation. */
export const CORE_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const

/**
 * A URL do projeto não é segredo e já precisa existir no bundle do navegador
 * como `VITE_SUPABASE_URL`. No servidor, preferimos o nome sem prefixo; o
 * fallback evita que uma configuração Vercel válida para o cliente quebre as
 * APIs apenas por usar o mesmo nome público. Nunca há fallback para a chave
 * service_role: ela precisa permanecer exclusivamente server-side.
 */
export function getServerEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  if (value) return value

  if (name === 'SUPABASE_URL') {
    return process.env.VITE_SUPABASE_URL?.trim() || undefined
  }

  return undefined
}

/** Env vars additionally required for the Mercado Livre OAuth flow. */
export const MERCADOLIVRE_ENV_VARS = [
  ...CORE_ENV_VARS,
  'ML_CLIENT_ID',
  'ML_CLIENT_SECRET',
  'ML_REDIRECT_URI',
  'APP_BASE_URL',
  'OAUTH_STATE_SECRET',
  'INTEGRATIONS_ENCRYPTION_KEY',
] as const

/** Env vars additionally required for the Shopee OAuth flow. */
export const SHOPEE_ENV_VARS = [
  ...CORE_ENV_VARS,
  'SHOPEE_PARTNER_ID',
  'SHOPEE_PARTNER_KEY',
  'SHOPEE_API_HOST',
  'SHOPEE_REDIRECT_URI',
  'APP_BASE_URL',
  'OAUTH_STATE_SECRET',
  'INTEGRATIONS_ENCRYPTION_KEY',
] as const

/** Env vars required by VTEX persistence and encrypted credential use. */
export const VTEX_ENV_VARS = [
  ...CORE_ENV_VARS,
  'INTEGRATIONS_ENCRYPTION_KEY',
] as const

/** Returns the subset of `names` that are missing/empty in `process.env`. */
export function getMissingEnvVars(names: readonly string[]): string[] {
  return names.filter((name) => !getServerEnv(name))
}

let cachedClient: SupabaseClient | null = null

/**
 * Server-only Supabase client using the service role key — bypasses RLS.
 * NEVER import this from `src/` frontend code or `src/pages/**`; it must only
 * be used inside `api/**` handlers and `src/server/**` modules they call.
 *
 * The `@supabase/supabase-js` package is imported dynamically (not at module
 * top-level) so that merely importing this file — which api/** handlers do
 * even on the config_missing early-return path — can never itself crash a
 * Vercel function before the handler's own try/catch has a chance to run.
 * Call this only after confirming CORE_ENV_VARS are present.
 */
export async function getSupabaseAdmin(): Promise<SupabaseClient> {
  if (cachedClient) return cachedClient

  const missing = getMissingEnvVars(CORE_ENV_VARS)
  if (missing.length > 0) {
    throw new Error(`Missing required Supabase env vars: ${missing.join(', ')}`)
  }

  const { createClient } = await import('@supabase/supabase-js')
  cachedClient = createClient(getServerEnv('SUPABASE_URL')!, getServerEnv('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}

/**
 * Acha o id de um usuário já existente no Supabase Auth pelo e-mail,
 * paginando `listUsers` até achar (ou até acabar as páginas). Antes disto,
 * cada chamador buscava só a página 1 (1000 usuários) — plataforma com mais
 * de 1000 usuários no total (não por empresa) fazia convite de e-mail já
 * cadastrado falhar com "usuário não encontrado na listagem" mesmo ele
 * existindo, só porque caiu numa página seguinte.
 */
/** Teto de segurança pra `fetchAllRows` — 200 páginas de 1000 = 200k linhas,
 *  bem acima de qualquer volume real esperado por empresa hoje. */
const FETCH_ALL_ROWS_MAX_PAGES = 200

/**
 * PostgREST (Supabase) limita a 1000 linhas por resposta por padrão — uma
 * query sem `.range()` numa tabela maior que isso volta silenciosamente
 * TRUNCADA, sem erro. Bug real de produção: `marketplace_products` de uma
 * conta com 17k+ SKUs (VTEX) aparecia com só os primeiros 1000 nas telas de
 * Produtos/Estoque, sem nenhum aviso.
 *
 * `fetchPage(from, to)` deve devolver a MESMA query (filtros já aplicados)
 * com `.range(from, to)` aplicado por cima — esta função só cuida de
 * encadear as páginas até a última (página menor que `pageSize` = fim).
 */
export async function fetchAllRows<T>(
  // `PromiseLike`, não `Promise`: o builder do Supabase (PostgrestFilterBuilder)
  // é "thenable" mas não uma Promise real (não tem `.catch`/`.finally`) —
  // exigir `Promise` aqui rejeitava passar o builder direto, sem `await`
  // explícito nem cast, no callsite.
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  pageSize = 1000,
): Promise<{ data: T[]; error: { message: string } | null }> {
  const rows: T[] = []
  for (let page = 0; page < FETCH_ALL_ROWS_MAX_PAGES; page += 1) {
    const from = page * pageSize
    const { data, error } = await fetchPage(from, from + pageSize - 1)
    if (error) return { data: rows, error }
    rows.push(...(data ?? []))
    if (!data || data.length < pageSize) return { data: rows, error: null }
  }
  return {
    data: rows,
    error: { message: `Query excedeu o limite seguro de ${FETCH_ALL_ROWS_MAX_PAGES * pageSize} linhas; resultado não foi retornado parcialmente.` },
  }
}

export async function findUserIdByEmail(supabase: SupabaseClient, email: string): Promise<string | null> {
  const target = email.toLowerCase()
  for (let page = 1; page <= LIST_USERS_MAX_PAGES; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw new Error(error.message)
    const match = data.users.find((u) => u.email?.toLowerCase() === target)
    if (match) return match.id
    if (data.users.length < 1000) return null
  }
  return null
}
