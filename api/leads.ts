import type { VercelRequest, VercelResponse } from '@vercel/node'
import nodemailer from 'nodemailer'
import { getSupabaseAdmin } from '../src/server/integrations/supabaseAdmin.js'
import { checkRateLimit } from '../src/server/auth/rateLimit.js'
import { clientIp } from '../src/server/auth/clientIp.js'

/**
 * Recebe pedidos de contato do site institucional e manda por e-mail direto
 * pro time comercial (SMTP, não mais webhook externo) — porta de entrada
 * real da empresa: é daqui que vem o CNPJ/contato usados depois pra criar a
 * empresa no painel admin. O e-mail também traz os dados da Receita Federal
 * (já consultados no front, em api/cnpj-lookup.ts) e se esse CNPJ já é
 * cliente cadastrado na plataforma.
 *
 * Configuração no Vercel:
 *   LEADS_SMTP_HOST, LEADS_SMTP_PORT, LEADS_SMTP_USER, LEADS_SMTP_PASS — a
 *   mesma caixa de e-mail usada como remetente (ex.: comercial@mktonline.com.br).
 *   LEADS_EMAIL_TO — pra onde o lead chega (pode ser a mesma caixa).
 */

interface CnpjInfoPayload {
  razaoSocial?: unknown
  nomeFantasia?: unknown
  situacaoCadastral?: unknown
  dataSituacaoCadastral?: unknown
  dataInicioAtividade?: unknown
  atividadePrincipal?: unknown
  cnaeCodigo?: unknown
  cnaesSecundarios?: unknown
  naturezaJuridica?: unknown
  porte?: unknown
  capitalSocial?: unknown
  telefone?: unknown
  email?: unknown
  endereco?: unknown
  matrizFilial?: unknown
  simplesNacional?: unknown
  socios?: unknown
}

interface LeadPayload {
  name?: unknown
  whatsapp?: unknown
  company?: unknown
  cnpj?: unknown
  marketplaces?: unknown
  message?: unknown
  consent?: unknown
  cnpjInfo?: CnpjInfoPayload | null
}

const isNonEmptyString = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0
const MESSAGE_MAX = 1500
const REQUIRED_ENV = ['LEADS_SMTP_HOST', 'LEADS_SMTP_PORT', 'LEADS_SMTP_USER', 'LEADS_SMTP_PASS', 'LEADS_EMAIL_TO'] as const

const RECEITA_FIELDS: { key: keyof CnpjInfoPayload; label: string }[] = [
  { key: 'razaoSocial', label: 'Razão social' },
  { key: 'nomeFantasia', label: 'Nome fantasia' },
  { key: 'situacaoCadastral', label: 'Situação cadastral' },
  { key: 'dataSituacaoCadastral', label: 'Data da situação' },
  { key: 'dataInicioAtividade', label: 'Início de atividade' },
  { key: 'matrizFilial', label: 'Matriz/Filial' },
  { key: 'atividadePrincipal', label: 'Atividade principal (CNAE)' },
  { key: 'cnaeCodigo', label: 'Código CNAE' },
  { key: 'cnaesSecundarios', label: 'CNAEs secundários' },
  { key: 'naturezaJuridica', label: 'Natureza jurídica' },
  { key: 'porte', label: 'Porte' },
  { key: 'simplesNacional', label: 'Simples Nacional' },
  { key: 'capitalSocial', label: 'Capital social' },
  { key: 'telefone', label: 'Telefone cadastrado' },
  { key: 'email', label: 'E-mail cadastrado' },
  { key: 'endereco', label: 'Endereço' },
  { key: 'socios', label: 'Sócios / administradores' },
]

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ ok: false, message: 'Método não permitido.' })
    return
  }

  // Endpoint público, sem auth — sem isso, um script pode gerar centenas de
  // e-mails reais pra caixa comercial (custo de cota SMTP + flood da caixa).
  if (!(await checkRateLimit(res, `leads:${clientIp(req)}`, 5, 1800))) return

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
  const cnpjDigits = cnpj.replace(/\D/g, '')
  const marketplaces = isNonEmptyString(body.marketplaces) ? String(body.marketplaces).trim() : null
  const message = String(body.message).trim()

  const supabase = await getSupabaseAdmin()

  // Checa se esse CNPJ já é cliente cadastrado na plataforma — não bloqueia
  // nada, só avisa o time (lead pode ser um cliente já existente tentando
  // outro canal, ou um segundo contato da mesma empresa).
  let existingCompany: { name: string; status: string } | null = null
  try {
    const { data } = await supabase.from('companies').select('name, status').eq('cnpj', cnpjDigits).maybeSingle()
    if (data) existingCompany = { name: data.name, status: data.status }
  } catch (err) {
    console.error('[api/leads] company lookup failed (non-blocking)', err)
  }

  // Grava o lead de verdade (tela AdminLeads.tsx lê daqui) — nunca bloqueia
  // o envio do e-mail se a gravação falhar (ex: migration 013 ainda não
  // rodou em produção), e vice-versa: e-mail é o canal de aviso imediato,
  // a tabela é o histórico/fila de triagem.
  try {
    await supabase.from('leads').insert({
      name,
      whatsapp,
      company,
      cnpj: cnpjDigits,
      marketplaces,
      message,
      receita_data: body.cnpjInfo ?? null,
    })
  } catch (err) {
    console.error('[api/leads] failed to persist lead (non-blocking)', err)
  }

  const receitaLines = RECEITA_FIELDS
    .map(({ key, label }) => {
      const v = body.cnpjInfo?.[key]
      if (Array.isArray(v)) {
        const items = v.filter(isNonEmptyString)
        if (items.length === 0) return null
        return { label, value: items.join('; ') }
      }
      if (!isNonEmptyString(v) && typeof v !== 'number') return null
      const value = key === 'capitalSocial' && typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR')}` : String(v)
      return { label, value }
    })
    .filter((v): v is { label: string; value: string } => v !== null)

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.LEADS_SMTP_HOST,
      port: Number(process.env.LEADS_SMTP_PORT),
      secure: Number(process.env.LEADS_SMTP_PORT) === 465,
      auth: { user: process.env.LEADS_SMTP_USER, pass: process.env.LEADS_SMTP_PASS },
    })

    const statusLine = existingCompany
      ? `Já é cliente cadastrado — "${existingCompany.name}" (status: ${existingCompany.status})`
      : 'Lead novo — sem cadastro na plataforma ainda'

    await transporter.sendMail({
      from: `"MKTOnline — Site" <${process.env.LEADS_SMTP_USER}>`,
      to: Array.from(new Set([process.env.LEADS_EMAIL_TO, 'diretoria@mktonline.com.br'].filter(Boolean))).join(', '),
      subject: `Novo contato — ${company} · CNPJ ${cnpj} · ${whatsapp}`,
      text: [
        `Nome: ${name}`,
        `Empresa: ${company}`,
        `CNPJ: ${cnpj}`,
        `WhatsApp: ${whatsapp}`,
        marketplaces ? `Marketplaces: ${marketplaces}` : null,
        `Cadastro: ${statusLine}`,
        '',
        'Assunto:',
        message,
        receitaLines.length > 0 ? '\nDados da Receita Federal:' : null,
        ...receitaLines.map((l) => `${l.label}: ${l.value}`),
      ].filter((l): l is string => l !== null).join('\n'),
      html: `
        <p><strong>Nome:</strong> ${escapeHtml(name)}</p>
        <p><strong>Empresa:</strong> ${escapeHtml(company)}</p>
        <p><strong>CNPJ:</strong> ${escapeHtml(cnpj)}</p>
        <p><strong>WhatsApp:</strong> ${escapeHtml(whatsapp)}</p>
        ${marketplaces ? `<p><strong>Marketplaces:</strong> ${escapeHtml(marketplaces)}</p>` : ''}
        <p><strong>Cadastro:</strong> ${escapeHtml(statusLine)}</p>
        <p><strong>Assunto:</strong></p>
        <p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>
        ${receitaLines.length > 0 ? `
          <hr style="margin:16px 0;border:none;border-top:1px solid #ddd">
          <p><strong>Dados da Receita Federal</strong></p>
          <table cellpadding="4" style="font-size:13px">
            ${receitaLines.map((l) => `<tr><td style="color:#555">${escapeHtml(l.label)}</td><td><strong>${escapeHtml(l.value)}</strong></td></tr>`).join('')}
          </table>
        ` : ''}
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
