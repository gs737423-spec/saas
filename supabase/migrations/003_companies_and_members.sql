-- Multi-tenant real: companies + membership, com RLS de verdade.
--
-- Substitui o `company_id = 'default-company'` fixo (ver 002) por resolução
-- real: usuário autenticado -> company_members -> company_id. As tabelas de
-- integração (marketplace_connections etc, ver create_marketplace_integrations.sql)
-- continuam sem policy própria (deny-all pra anon/authenticated, só
-- service_role acessa via api/**) — o isolamento por tenant nelas é feito no
-- código (requireCompany + .eq('company_id', ...)), não em RLS, porque
-- service_role sempre ignora RLS mesmo que exista policy.
--
-- companies/company_members SIM precisam de RLS real porque nada impede o
-- client autenticado de consultar essas tabelas diretamente com a anon key.

create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists company_members (
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid not null references companies (id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (user_id, company_id)
);

alter table companies enable row level security;
alter table company_members enable row level security;

-- Um usuário só vê a própria empresa (via join implícito com company_members).
drop policy if exists companies_select_own on companies;
create policy companies_select_own on companies
  for select
  using (id in (select company_id from company_members where user_id = auth.uid()));

-- Um usuário só vê suas próprias linhas de membership (nunca a de outro usuário).
drop policy if exists company_members_select_own on company_members;
create policy company_members_select_own on company_members
  for select
  using (user_id = auth.uid());

-- Nenhum insert/update/delete liberado pro client (anon/authenticated) —
-- alta de empresa/membro é operação administrativa, feita via service_role.
