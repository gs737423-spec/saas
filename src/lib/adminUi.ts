const AVATAR_HUES = ['#00E1FF', '#3BE38E', '#FFC95A', '#FF5E7D', '#3A8DFF']

export function hueFor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_HUES[h % AVATAR_HUES.length]
}

export function initialsFor(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?'
}

export function maskCnpj(raw: string | null | undefined): string {
  const digits = (raw ?? '').replace(/\D/g, '')
  if (digits.length !== 14) return raw || '—'
  return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
}

// Espelha CnpjInfo de api/cnpj-lookup.ts — duplicado de propósito (front não
// importa tipos do lado serverless, build target diferente; mesmo padrão de
// ConversionSection.tsx). Fonte única no lado do cliente: qualquer tela que
// mostra dado da Receita usa este tipo (perfil da empresa, modal de
// cadastro, análise de solicitação).
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

export function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60) return 'agora'
  if (diff < 3600) return `há ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `há ${Math.floor(diff / 3600)}h`
  if (diff < 2592000) return `há ${Math.floor(diff / 86400)}d`
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}
