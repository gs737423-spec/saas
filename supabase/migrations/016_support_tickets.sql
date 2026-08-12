-- Sistema de suporte: tenant abre tickets e troca mensagens com a equipe;
-- admin vê/responde tickets de todas as empresas. Sem notificação por
-- email (fora de escopo por ora). Mesmo padrão de isolamento das demais
-- tabelas tenant-scoped: toda leitura/escrita real passa por api/** com
-- service_role + requireCompany/requireAdmin; RLS aqui é defesa em
-- profundidade (ver 004_integration_rls_policies.sql).
--
-- Renumerada de 013 para 016 (colidia com 013_leads.sql — dois arquivos
-- com o mesmo prefixo numérico). Conteúdo idêntico ao original.

create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  subject text not null,
  status text not null default 'aberto' check (status in ('aberto', 'em_andamento', 'resolvido', 'fechado')),
  priority text not null default 'normal' check (priority in ('baixa', 'normal', 'alta', 'urgente')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_company_id_idx on support_tickets (company_id);
create index if not exists support_tickets_status_idx on support_tickets (status);
create index if not exists support_tickets_updated_at_idx on support_tickets (updated_at desc);

alter table support_tickets enable row level security;

drop trigger if exists trg_support_tickets_updated_at on support_tickets;
create trigger trg_support_tickets_updated_at
  before update on support_tickets
  for each row execute function touch_updated_at();

-- company_id denormalizado aqui (não só via join com support_tickets) —
-- mesmo padrão de order_items (007): simplifica a policy de RLS (índice
-- direto, sem subquery contra outra tabela) e a query de listagem admin.
create table if not exists support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references support_tickets(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  author_id uuid not null references auth.users(id),
  author_role text not null check (author_role in ('cliente', 'admin')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_messages_ticket_id_idx on support_messages (ticket_id);
create index if not exists support_messages_company_id_idx on support_messages (company_id);

alter table support_messages enable row level security;

-- SELECT liberado pro dono (via user_company_ids()) ou admin. Sem policy
-- de INSERT/UPDATE pra anon/authenticated — toda escrita passa por api/**
-- com service_role, igual ao restante do projeto (ver 004).
drop policy if exists support_tickets_select_own on support_tickets;
create policy support_tickets_select_own on support_tickets
  for select
  using (is_platform_admin() or company_id::text in (select user_company_ids()));

drop policy if exists support_messages_select_own on support_messages;
create policy support_messages_select_own on support_messages
  for select
  using (is_platform_admin() or company_id::text in (select user_company_ids()));
