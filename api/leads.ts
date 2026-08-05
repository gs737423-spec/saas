import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'

/**
 * Recebe pedidos de contato do site institucional e manda por e-mail direto
 * pro time comercial (SMTP, não mais webhook externo) — porta de entrada
 * real da empresa: é daqui que vem o CNPJ/contato usados depois pra criar a
 * empresa no painel admin.
 *
 * Configuração no Vercel:
 *   LEADS_SMTP_HOST, LEADS_SMTP_PORT, LEADS_SMTP_USER, LEADS_SMTP_PASS — a
 *   mesma caixa de e-mail usada como remetente (ex.: comercial@mktonline.com.br).
 *   LEADS_EMAIL_TO — pra onde o lead chega (pode ser a mesma caixa).
 */

interface LeadPayload {
  name?: unknown
  whatsapp?: unknown
  company?: unknown
  cnpj?: unknown
  message?: unknown
  consent?: unknown
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const MESSAGE_MAX = 1500
const REQUIRED_ENV = ['LEADS_SMTP_HOST', 'LEADS_SMTP_PORT', 'LEADS_SMTP_USER', 'LEADS_SMTP_PASS', 'LEADS_EMAIL_TO'] as const

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, message: 'Método não permitido.' })
    return
  }

  const body = (req.body ?? {}) as LeadPayload

  const errors: string[] = []
  if (!isNonEmptyString(body.name)) errors.push('name')
  if (!isNonEmptyString(body.whatsapp)) errors.push('whatsapp')
  if (!isNonEmptyString(body.company)) errors.push('company')
  if (!isNonEmptyString(body.cnpj)) errors.push('cnpj')
  if (!isNonEmptyString(body.message) || String(body.message).trim().length > MESSAGE_MAX) errors.push('message')
  if (body.consent !== true) errors.push('consent')

  if (errors.length > 0) {
    res.status(422).json({ ok: false, message: 'Dados inválidos.', fields: errors })
    return
  }

  const missingEnv = REQUIRED_ENV.filter((k) => !process.env[k])
  if (missingEnv.length > 0) {
    console.error('[api/leads] missing env vars:', missingEnv.join(', '))
    res.status(501).json({ ok: false, configured: false, message: 'O canal de recebimento de leads ainda não foi configurado.' })
    return
  }

  const name = String(body.name).trim()
  const whatsapp = String(body.whatsapp).trim()
  const company = String(body.company).trim()
  const cnpj = String(body.cnpj).trim()
  const message = String(body.message).trim()

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.LEADS_SMTP_HOST,
      port: Number(process.env.LEADS_SMTP_PORT),
      secure: Number(process.env.LEADS_SMTP_PORT) === 465,
      auth: { user: process.env.LEADS_SMTP_USER, pass: process.env.LEADS_SMTP_PASS },
    })

    await transporter.sendMail({
      from: `"MKTOnline — Site" <${process.env.LEADS_SMTP_USER}>`,
      to: process.env.LEADS_EMAIL_TO,
      replyTo: undefined,
      subject: `Novo contato — ${company} · CNPJ ${cnpj} · ${whatsapp}`,
      text: [
        `Nome: ${name}`,
        `Empresa: ${company}`,
        `CNPJ: ${cnpj}`,
        `WhatsApp: ${whatsapp}`,
        '',
        'Assunto:',
        message,
      ].join('\n'),
      html: `
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Empresa:</strong> ${escapeHtml(company)}</p>
        <p><strong>CNPJ:</strong> ${escapeHtml(cnpj)}</p>
        <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>
        <p><strong>Assunto:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    })

    res.status(200).json({ ok: true, message: 'Recebido.' })
  } catch (err) {
    console.error('[api/leads]', err)
    res.status(502).json({ ok: false, message: 'Não foi possível registrar o pedido agora.' })
  }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}
