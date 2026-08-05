import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Consulta CNPJ na Receita Federal via BrasilAPI (gratuita, sem chave) —
 * usado pelo formulário de contato do site pra confirmar que o CNPJ digitado
 * existe de verdade, cruzar com o nome da empresa informado, e anexar os
 * dados oficiais no e-mail que chega pro time comercial.
 *
 * Nunca usar pra decisão automática silenciosa: o front sempre mostra o
 * resultado (razão social/nome fantasia oficiais) pro usuário conferir,
 * nunca bloqueia sem explicar o motivo.
 */

interface BrasilApiCnpjResponse {
  razao_social?: string
  nome_fantasia?: string
  descricao_situacao_cadastral?: string
  data_situacao_cadastral?: string
  data_inicio_atividade?: string
  cnae_fiscal_descricao?: string
  natureza_juridica?: string
  porte?: string
  capital_social?: number
  ddd_telefone_1?: string
  email?: string
  logradouro?: string
  numero?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
}

export interface CnpjInfo {
  razaoSocial: string | null
  nomeFantasia: string | null
  situacaoCadastral: string | null
  dataSituacaoCadastral: string | null
  dataInicioAtividade: string | null
  atividadePrincipal: string | null
  naturezaJuridica: string | null
  porte: string | null
  capitalSocial: number | null
  telefone: string | null
  email: string | null
  endereco: string | null
}

function buildEndereco(d: BrasilApiCnpjResponse): string | null {
  const parts = [
    d.logradouro && d.numero ? `${d.logradouro}, ${d.numero}` : d.logradouro,
    d.bairro,
    d.municipio && d.uf ? `${d.municipio}/${d.uf}` : d.municipio,
    d.cep,
  ].filter(Boolean)
  return parts.length > 0 ? parts.join(' — ') : null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ ok: false, message: 'Método não permitido.' })
    return
  }

  const raw = typeof req.query.cnpj === 'string' ? req.query.cnpj : ''
  const digits = raw.replace(/\D/g, '')

  if (digits.length !== 14) {
    res.status(422).json({ ok: false, message: 'CNPJ precisa ter 14 dígitos.' })
    return
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    let upstream: Response
    try {
      upstream = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`, {
        headers: { 'User-Agent': 'MKTOnline/1.0 (+https://mktonline.com.br)', Accept: 'application/json' },
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeout)
    }

    if (upstream.status === 404) {
      res.status(200).json({ ok: false, found: false, message: 'CNPJ não encontrado na Receita Federal.' })
      return
    }
    if (!upstream.ok) throw new Error(`BrasilAPI status ${upstream.status}`)

    const d = (await upstream.json()) as BrasilApiCnpjResponse

    const info: CnpjInfo = {
      razaoSocial: d.razao_social ?? null,
      nomeFantasia: d.nome_fantasia ?? null,
      situacaoCadastral: d.descricao_situacao_cadastral ?? null,
      dataSituacaoCadastral: d.data_situacao_cadastral ?? null,
      dataInicioAtividade: d.data_inicio_atividade ?? null,
      atividadePrincipal: d.cnae_fiscal_descricao ?? null,
      naturezaJuridica: d.natureza_juridica ?? null,
      porte: d.porte ?? null,
      capitalSocial: typeof d.capital_social === 'number' ? d.capital_social : null,
      telefone: d.ddd_telefone_1 ?? null,
      email: d.email ?? null,
      endereco: buildEndereco(d),
    }

    res.status(200).json({ ok: true, found: true, ...info })
  } catch (err) {
    console.error('[api/cnpj-lookup]', err)
    // Falha de rede/serviço fora do ar — não bloqueia o formulário por causa
    // disso, só avisa que não deu pra confirmar agora.
    res.status(200).json({ ok: false, found: null, message: 'Não foi possível confirmar o CNPJ agora. Você pode continuar mesmo assim.' })
  }
}
