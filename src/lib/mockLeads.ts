// Solicitações de cadastro vindas do formulário do site institucional
// (api/leads.ts hoje só envia e-mail, não persiste em tabela ainda).
// Mock explícito até existir uma tabela `leads` real no Supabase — ver
// docs/02-Decisions para o próximo passo de persistência.
export interface MockLead {
  id: string
  nomeFantasia: string
  razaoSocial: string
  cnpj: string
  inscricaoEstadual: string
  cnae: string
  dataAbertura: string
  whatsapp: string
  dataSolicitacao: string
  status: 'pendente'
}

export const MOCK_LEADS: MockLead[] = [
  {
    id: 'lead-1',
    nomeFantasia: 'Nova Era Calçados',
    razaoSocial: 'Nova Era Comercio de Calcados Ltda',
    cnpj: '45.123.987/0001-22',
    inscricaoEstadual: '456.789.123.114',
    cnae: '47.82-2-01 — Comércio varejista de calçados',
    dataAbertura: '14/02/2019',
    whatsapp: '+55 21 97777-1234',
    dataSolicitacao: '03/08/2026',
    status: 'pendente',
  },
  {
    id: 'lead-2',
    nomeFantasia: 'Casa Verde Utilidades',
    razaoSocial: 'Casa Verde Utilidades Domesticas Eireli',
    cnpj: '19.876.234/0001-55',
    inscricaoEstadual: '198.762.340.011',
    cnae: '47.75-3-00 — Comércio varejista de artigos de uso doméstico',
    dataAbertura: '02/09/2021',
    whatsapp: '+55 41 96666-5678',
    dataSolicitacao: '04/08/2026',
    status: 'pendente',
  },
  {
    id: 'lead-3',
    nomeFantasia: 'TechFast Acessórios',
    razaoSocial: 'TechFast Acessorios Eletronicos Ltda',
    cnpj: '33.445.678/0001-09',
    inscricaoEstadual: '334.456.780.099',
    cnae: '47.63-6-00 — Comércio varejista de artigos de eletrônicos',
    dataAbertura: '27/06/2023',
    whatsapp: '+55 11 95555-9012',
    dataSolicitacao: '05/08/2026',
    status: 'pendente',
  },
]

export const MOCK_LEADS_COUNT = MOCK_LEADS.length
