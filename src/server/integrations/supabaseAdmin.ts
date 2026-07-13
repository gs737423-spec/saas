import type { SupabaseClient } from '@supabase/supabase-js'

/** Env vars required for ANY Supabase-backed integration operation. */
export const CORE_ENV_VARS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const

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

/** Returns the subset of `names` that are missing/empty in `process.env`. */
export function getMissingEnvVars(names: readonly string[]): string[] {
  return names.filter((name) => !process.env[name] || process.env[name]!.trim() === '')
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
  cachedClient = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  return cachedClient
}
