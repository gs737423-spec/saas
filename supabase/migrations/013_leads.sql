-- Solicitações de cadastro vindas do formulário do site institucional
-- (api/leads.ts) — até aqui só existiam por e-mail, tela AdminLeads.tsx
-- rodava com dado de exemplo (MOCK_LEADS). Grava o que o formulário
-- realmente enviou (nunca fabrica campo que o lead não preencheu) mais o
-- snapshot da Receita Federal já consultado no front, mesmo shape de
-- receita_data em companies (ver 012).
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  whatsapp text not null,
  company text not null,
  cnpj text not null,
  marketplaces text,
  message text not null,
  receita_data jsonb,
  status text not null default 'pendente' check (status in ('pendente', 'aprovado', 'recusado')),
  created_at timestamptz not null default now()
);

create index if not exists leads_status_idx on leads (status, created_at desc);

alter table leads enable row level security;

-- Só admin da plataforma lê/edita — nenhum cliente tem acesso a lead de
-- outra empresa (nem da própria, lead não pertence a company_id nenhum
-- ainda nesse ponto do funil). service_role (usado pelos endpoints
-- api/admin/**) ignora RLS por padrão, então a policy aqui é só defesa
-- em profundidade caso algo chame com anon/authenticated key por engano.
create policy "leads_no_direct_access" on leads
  for all
  using (false)
  with check (false);
