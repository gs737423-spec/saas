// Solicitações de cadastro vindas do formulário do site institucional
// (api/leads.ts hoje só envia e-mail, não persiste em tabela ainda).
// Mock explícito até existir uma tabela `leads` real no Supabase — ver
// docs/02-Decisions para o próximo passo de persistência.
export interface MockLead {
  id: string
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  dataSolicitacao: string
  status: 'pendente'

  // Bloco A — o que o lead preencheu no formulário
  nomeContato: string
  email: string
  whatsapp: string
  assunto: string
  interesses: ('mercadolivre' | 'shopee' | 'amazon' | 'lojapropria')[]

  // Bloco B — varredura Receita Federal
  statusReceita: 'ATIVA' | 'INAPTA' | 'BAIXADA'
  inscricaoEstadual: string
  dataAbertura: string
  naturezaJuridica: string
  capitalSocial: string
  endereco: string
  socios: string[]
  cnaeCodigo: string
  cnaeDescricao: string
}

export const MOCK_LEADS: MockLead[] = [
  {
    id: 'lead-1',
    nomeFantasia: 'Nova Era Calçados',
    razaoSocial: 'Nova Era Comercio de Calcados Ltda',
    cnpj: '45.123.987/0001-22',
    dataSolicitacao: '03/08/2026',
    status: 'pendente',
    nomeContato: 'Fernanda Ribeiro',
    email: 'fernanda@novaeracalcados.com.br',
    whatsapp: '+55 21 97777-1234',
    assunto: 'Quer consolidar Mercado Livre e Shopee numa gestão só',
    interesses: ['mercadolivre', 'shopee'],
    statusReceita: 'ATIVA',
    inscricaoEstadual: '456.789.123.114',
    dataAbertura: '14/02/2019',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    capitalSocial: 'R$ 50.000,00',
    endereco: 'Rua das Palmeiras, 482 — Tijuca, Rio de Janeiro/RJ — CEP 20520-000',
    socios: ['Fernanda Ribeiro', 'Marcos Ribeiro'],
    cnaeCodigo: '47.82-2-01',
    cnaeDescricao: 'Comércio varejista de calçados',
  },
  {
    id: 'lead-2',
    nomeFantasia: 'Casa Verde Utilidades',
    razaoSocial: 'Casa Verde Utilidades Domesticas Eireli',
    cnpj: '19.876.234/0001-55',
    dataSolicitacao: '04/08/2026',
    status: 'pendente',
    nomeContato: 'Paulo Andrade',
    email: 'paulo@casaverdeutilidades.com.br',
    whatsapp: '+55 41 96666-5678',
    assunto: 'Loja própria crescendo, quer entrar em marketplace pela primeira vez',
    interesses: ['lojapropria', 'mercadolivre'],
    statusReceita: 'ATIVA',
    inscricaoEstadual: '198.762.340.011',
    dataAbertura: '02/09/2021',
    naturezaJuridica: 'Empresa Individual de Responsabilidade Limitada',
    capitalSocial: 'R$ 15.000,00',
    endereco: 'Av. Sete de Setembro, 1290 — Batel, Curitiba/PR — CEP 80240-000',
    socios: ['Paulo Andrade'],
    cnaeCodigo: '47.75-3-00',
    cnaeDescricao: 'Comércio varejista de artigos de uso doméstico',
  },
  {
    id: 'lead-3',
    nomeFantasia: 'TechFast Acessórios',
    razaoSocial: 'TechFast Acessorios Eletronicos Ltda',
    cnpj: '33.445.678/0001-09',
    dataSolicitacao: '05/08/2026',
    status: 'pendente',
    nomeContato: 'Juliana Kimura',
    email: 'juliana@techfastacessorios.com.br',
    whatsapp: '+55 11 95555-9012',
    assunto: 'Já vende em 3 canais, precisa parar de perder estoque',
    interesses: ['mercadolivre', 'shopee', 'amazon'],
    statusReceita: 'ATIVA',
    inscricaoEstadual: '334.456.780.099',
    dataAbertura: '27/06/2023',
    naturezaJuridica: 'Sociedade Empresária Limitada',
    capitalSocial: 'R$ 80.000,00',
    endereco: 'Rua Vergueiro, 3140 — Vila Mariana, São Paulo/SP — CEP 04101-300',
    socios: ['Juliana Kimura', 'Rafael Kimura', 'André Souza'],
    cnaeCodigo: '47.63-6-00',
    cnaeDescricao: 'Comércio varejista de artigos de eletrônicos',
  },
]

export const MOCK_LEADS_COUNT = MOCK_LEADS.length
