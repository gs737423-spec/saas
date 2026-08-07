import type { VercelRequest, VercelResponse } from '@vercel/node'
import { checkRateLimit } from '../src/server/auth/rateLimit.js'
import { clientIp } from '../src/server/auth/clientIp.js'

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
  cnae_fiscal?: number
  cnae_fiscal_descricao?: string
  cnaes_secundarios?: { codigo: number; descricao: string }[]
  natureza_juridica?: string
  porte?: string
  capital_social?: number
  ddd_telefone_1?: string
  ddd_telefone_2?: string
  email?: string
  logradouro?: string
  numero?: string
  bairro?: string
  municipio?: string
  uf?: string
  cep?: string
  identificador_matriz_filial?: string
  opcao_pelo_simples?: boolean | null
  opcao_pelo_mei?: boolean | null
  qsa?: { nome_socio?: string; qualificacao_socio?: string }[]
}

export interface CnpjInfo {
  razaoSocial: string | null
  nomeFantasia: string | null
  situacaoCadastral: string | null
  dataSituacaoCadastral: string | null
  dataInicioAtividade: string | null
  atividadePrincipal: string | null
  cnaeCodigo: string | null
  cnaesSecundarios: string[]
  naturezaJuridica: string | null
  porte: string | null
  capitalSocial: number | null
  telefone: string | null
  email: string | null
  endereco: string | null
  matrizFilial: string | null
  simplesNacional: string | null
  socios: string[]
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

  // Endpoint público, sem auth — sem isso vira proxy grátis pra BrasilAPI
  // (enumeração de CNPJ, abuso de cota de terceiro, possível banimento do IP
  // do servidor).
  if (!(await checkRateLimit(res, `cnpj-lookup:${clientIp(req)}`, 30, 1800))) return

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
      cnaeCodigo: typeof d.cnae_fiscal === 'number' ? String(d.cnae_fiscal) : null,
      cnaesSecundarios: (d.cnaes_secundarios ?? []).map((c) => c.descricao).filter(Boolean),
      naturezaJuridica: d.natureza_juridica ?? null,
      porte: d.porte ?? null,
      capitalSocial: typeof d.capital_social === 'number' ? d.capital_social : null,
      telefone: [d.ddd_telefone_1, d.ddd_telefone_2].filter(Boolean).join(' / ') || null,
      email: d.email ?? null,
      endereco: buildEndereco(d),
      matrizFilial: d.identificador_matriz_filial ?? null,
      simplesNacional: d.opcao_pelo_mei ? 'MEI' : d.opcao_pelo_simples ? 'Optante pelo Simples Nacional' : d.opcao_pelo_simples === false ? 'Não optante pelo Simples Nacional' : null,
      socios: (d.qsa ?? []).map((s) => [s.nome_socio, s.qualificacao_socio].filter(Boolean).join(' — ')).filter(Boolean),
    }

    res.status(200).json({ ok: true, found: true, ...info })
  } catch (err) {
    console.error('[api/cnpj-lookup]', err)
    // Falha de rede/serviço fora do ar — não bloqueia o formulário por causa
    // disso, só avisa que não deu pra confirmar agora.
    res.status(200).json({ ok: false, found: null, message: 'Não foi possível confirmar o CNPJ agora. Você pode continuar mesmo assim.' })
  }
}
