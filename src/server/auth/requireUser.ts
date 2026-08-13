import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin, getMissingEnvVars, CORE_ENV_VARS } from '../integrations/supabaseAdmin.js'

export function getBearerToken(req: VercelRequest): string | null {
  const header = req.headers.authorization
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

/**
 * Valida o Bearer token (access_token do Supabase Auth) enviado pelo client
 * e retorna o usuário autenticado, ou já responde 401 e retorna null.
 * `getUser(token)` verifica o JWT contra o Supabase Auth — não é apenas
 * decodificar localmente, então um token expirado/forjado é rejeitado.
 */
export async function requireUser(req: VercelRequest, res: VercelResponse) {
  // Sem isso, toda rota que chama requireUser derruba a função inteira
  // (FUNCTION_INVOCATION_FAILED) em vez de responder — mesma checagem que
  // status.ts/logs.ts/inventory.ts já fazem antes de tocar no Supabase.
  const missing = getMissingEnvVars(CORE_ENV_VARS)
  if (missing.length > 0) {
    // Nomes são seguros para um usuário autenticado e evitam uma mensagem
    // genérica que leva o operador a procurar a variável errada na Vercel.
    res.status(503).json({ ok: false, error: 'config_missing', missing, message: 'Configuração do Supabase pendente no servidor.' })
    return null
  }

  const token = getBearerToken(req)

  if (!token) {
    res.status(401).json({ ok: false, error: 'unauthorized', message: 'Sessão ausente.' })
    return null
  }

  const supabase = await getSupabaseAdmin()
  const { data, error } = await supabase.auth.getUser(token)

  if (error || !data.user) {
    res.status(401).json({ ok: false, error: 'unauthorized', message: 'Sessão inválida ou expirada.' })
    return null
  }

  return data.user
}
