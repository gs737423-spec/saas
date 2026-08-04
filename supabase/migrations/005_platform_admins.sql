-- Usuários "da casa" (equipe interna) — enxergam qualquer empresa pra dar
-- consultoria (faturamento, pedidos, etc), nunca editam/excluem nada de
-- cliente (todo o client de marketplace já é read-only, ver client.ts).
-- Cadastro é manual (insert direto no Supabase pela equipe, nunca via app).

create table if not exists platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table platform_admins enable row level security;

-- Um admin só confirma a própria linha (não lista a equipe toda pelo client).
drop policy if exists platform_admins_select_own on platform_admins;
create policy platform_admins_select_own on platform_admins
  for select
  using (user_id = auth.uid());

create or replace function is_platform_admin() returns boolean as $$
  select exists (select 1 from platform_admins where user_id = auth.uid())
$$ language sql stable security definer set search_path = public;

-- Amplia as policies de leitura já criadas (003/004): admin vê qualquer
-- empresa/membership/linha de integração, cliente continua só a própria.
drop policy if exists companies_select_own on companies;
create policy companies_select_own on companies
  for select
  using (is_platform_admin() or id in (select company_id from company_members where user_id = auth.uid()));

drop policy if exists company_members_select_own on company_members;
create policy company_members_select_own on company_members
  for select
  using (is_platform_admin() or user_id = auth.uid());

drop policy if exists marketplace_connections_select_own on marketplace_connections;
create policy marketplace_connections_select_own on marketplace_connections
  for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

drop policy if exists sync_logs_select_own on sync_logs;
create policy sync_logs_select_own on sync_logs
  for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

drop policy if exists marketplace_products_select_own on marketplace_products;
create policy marketplace_products_select_own on marketplace_products
  for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

drop policy if exists marketplace_inventory_select_own on marketplace_inventory;
create policy marketplace_inventory_select_own on marketplace_inventory
  for select
  using (is_platform_admin() or company_id in (select user_company_ids()));
