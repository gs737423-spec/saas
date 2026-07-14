import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Recebe pedidos de demonstração do site institucional.
 *
 * Encaminha o lead para um webhook externo definido em `LEADS_WEBHOOK_URL`
 * (ex.: Make, Zapier, n8n, Slack Incoming Webhook, ou um endpoint próprio).
 * Nenhum segredo fica no front-end — o site apenas faz POST para /api/leads.
 *
 * Se `LEADS_WEBHOOK_URL` NÃO estiver configurado, responde 501 com
 * `configured: false`. O front, nesse caso, NUNCA mostra sucesso falso:
 * orienta o visitante a usar um canal alternativo.
 *
 * Configuração no Vercel:
 *   LEADS_WEBHOOK_URL = https://hooks.suaferramenta.com/...
 */

interface LeadPayload {
  name?: unknown
  email?: unknown
  whatsapp?: unknown
  company?: unknown
  marketplaces?: unknown
  monthlyOrders?: unknown
  consent?: unknown
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, message: 'Método não permitido.' })
    return
  }

  const body = (req.body ?? {}) as LeadPayload

  // Validação server-side (defesa em profundidade — o front também valida)
  const errors: string[] = []
  if (!isNonEmptyString(body.name)) errors.push('name')
  if (!isNonEmptyString(body.email) || !emailRe.test(String(body.email))) errors.push('email')
  if (!isNonEmptyString(body.whatsapp)) errors.push('whatsapp')
  if (!isNonEmptyString(body.company)) errors.push('company')
  if (body.consent !== true) errors.push('consent')

  if (errors.length > 0) {
    res.status(422).json({ ok: false, message: 'Dados inválidos.', fields: errors })
    return
  }

  const webhook = process.env.LEADS_WEBHOOK_URL
  if (!webhook) {
    // Canal de destino ainda não configurado — não fingimos envio.
    res.status(501).json({
      ok: false,
      configured: false,
      message: 'O canal de recebimento de leads ainda não foi configurado.',
    })
    return
  }

  const lead = {
    name: String(body.name).trim(),
    email: String(body.email).trim().toLowerCase(),
    whatsapp: String(body.whatsapp).trim(),
    company: String(body.company).trim(),
    marketplaces: isNonEmptyString(body.marketplaces) ? String(body.marketplaces).trim() : null,
    monthlyOrders: isNonEmptyString(body.monthlyOrders) ? String(body.monthlyOrders).trim() : null,
    source: 'site-institucional',
    receivedAt: new Date().toISOString(),
  }

  try {
    const upstream = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
    })
    if (!upstream.ok) throw new Error(`webhook status ${upstream.status}`)
    res.status(200).json({ ok: true, message: 'Recebido.' })
  } catch (err) {
    console.error('[api/leads]', err)
    res.status(502).json({ ok: false, message: 'Não foi possível registrar o pedido agora.' })
  }
}
