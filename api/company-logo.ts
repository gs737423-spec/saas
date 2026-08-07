import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getSupabaseAdmin } from '../src/server/integrations/supabaseAdmin.js'
import { requireCompany } from '../src/server/auth/requireCompany.js'
import { checkRateLimit } from '../src/server/auth/rateLimit.js'

const MAX_BYTES = 2 * 1024 * 1024 // 2MB — imagem já vem recortada/redimensionada pelo browser antes de chegar aqui

// Logo da PRÓPRIA empresa (requireCompany já resolve isso — cliente comum
// nunca sobe logo de outra empresa; admin precisa de ?company_id= explícito,
// igual todo outro endpoint que ele usa). Aceita um dataURL base64 (imagem
// já recortada quadrada e redimensionada no browser, ver
// CompanyAvatar.tsx) — sobrescreve sempre o mesmo arquivo (nome fixo por
// empresa), então nunca acumula lixo no bucket.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'method_not_allowed' })
    return
  }

  const auth = await requireCompany(req, res)
  if (!auth) return

  if (!(await checkRateLimit(res, `company-logo:${auth.companyId}`, 10, 1800))) return

  try {
    const dataUrl = typeof req.body?.image === 'string' ? req.body.image : ''
    const match = /^data:(image\/(png|jpeg|webp));base64,(.+)$/.exec(dataUrl)
    if (!match) {
      res.status(400).json({ ok: false, message: 'Imagem inválida — envie PNG, JPEG ou WebP.' })
      return
    }
    const [, contentType, ext, base64] = match
    const buffer = Buffer.from(base64, 'base64')
    if (buffer.byteLength > MAX_BYTES) {
      res.status(400).json({ ok: false, message: 'Imagem muito grande (máximo 2MB).' })
      return
    }

    const supabase = await getSupabaseAdmin()
    const path = `${auth.companyId}.${ext === 'jpeg' ? 'jpg' : ext}`

    const { error: uploadError } = await supabase.storage
      .from('company-logos')
      .upload(path, buffer, { contentType, upsert: true })
    if (uploadError) throw new Error(uploadError.message)

    const { data: publicUrlData } = supabase.storage.from('company-logos').getPublicUrl(path)
    // Cache-busting — o navegador não sabe que o conteúdo mudou num nome de
    // arquivo fixo, sem isso a logo antiga fica em cache até o usuário
    // limpar o navegador.
    const logoUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`

    const { error: updateError } = await supabase.from('companies').update({ logo_url: logoUrl }).eq('id', auth.companyId)
    if (updateError) throw new Error(updateError.message)

    res.status(200).json({ ok: true, logoUrl })
  } catch (err) {
    console.error('[api/company-logo]', err)
    res.status(500).json({ ok: false, message: 'Erro ao salvar a logo.' })
  }
}
