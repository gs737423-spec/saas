import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../../src/server/integrations/supabaseAdmin.js'
import { requireUser } from '../../src/server/auth/requireUser.js'

const UNDEFINED_TABLE = '42P01'

// Único endpoint que um usuário comum também pode chamar (sem exigir já
// ser admin) — é como o frontend descobre se deve mostrar o link "Admin"
// no menu, sem expor nenhum dado de empresa nessa checagem.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const user = await requireUser(req, res)
    if (!user) return

    const supabase = await getSupabaseAdmin()
    const { data, error } = await supabase
      .from('platform_admins')
      .select('user_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (error && error.code !== UNDEFINED_TABLE) throw new Error(error.message)

    res.status(200).json({ ok: true, isAdmin: !!data })
  } catch (err) {
    console.error('[api/admin/me]', err)
    res.status(200).json({ ok: false, isAdmin: false })
  }
}
