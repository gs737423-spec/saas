-- RLS real por company_id nas tabelas de integração (defesa em profundidade).
--
-- Hoje api/** sempre usa service_role (bypassa RLS), então na prática o
-- isolamento já é garantido no código (requireCompany + .eq('company_id', ...)).
-- Estas policies são a segunda camada: se a service_role key algum dia
-- vazar, ou se qualquer código futuro passar a usar a chave anon/authenticated
-- direto nessas tabelas, ninguém consegue ler/escrever fora da própria
-- empresa — antes disso não existia policy nenhuma (deny-all totalmente
-- dependente da chave nunca vazar).
--
-- Só SELECT é liberado pro `authenticated`. Insert/update/delete continuam
-- deny-all pra anon/authenticated — toda escrita de integração passa por
-- api/** com service_role, nunca pelo client direto.

-- Retorna text (não uuid): company_id nas 4 tabelas acima é `text` desde a
-- migration 002 (linhas antigas podem até ter o literal 'default-company',
-- não um uuid válido) — comparar como texto evita erro de cast em runtime.
create or replace function user_company_ids() returns setof text as $$
  select company_id::text from company_members where user_id = auth.uid()
$$ language sql stable security definer set search_path = public;

drop policy if exists marketplace_connections_select_own on marketplace_connections;
create policy marketplace_connections_select_own on marketplace_connections
  for select
  using (company_id in (select user_company_ids()));

drop policy if exists sync_logs_select_own on sync_logs;
create policy sync_logs_select_own on sync_logs
  for select
  using (company_id in (select user_company_ids()));

drop policy if exists marketplace_products_select_own on marketplace_products;
create policy marketplace_products_select_own on marketplace_products
  for select
  using (company_id in (select user_company_ids()));

drop policy if exists marketplace_inventory_select_own on marketplace_inventory;
create policy marketplace_inventory_select_own on marketplace_inventory
  for select
  using (company_id in (select user_company_ids()));
