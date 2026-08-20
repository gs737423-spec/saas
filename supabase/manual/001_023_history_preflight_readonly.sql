-- READ-ONLY: confirma a presenca fisica dos contratos centrais de cada
-- migration antes de reconciliar supabase_migrations.schema_migrations.
-- Nao cria, altera ou remove objetos nem dados.

with checks as (
  select 1 as version, '001' as migration,
    to_regclass('public.marketplace_connections') is not null
    and to_regclass('public.sync_logs') is not null
    and to_regclass('public.marketplace_products') is not null
    and to_regclass('public.marketplace_inventory') is not null
    and to_regprocedure('public.touch_updated_at()') is not null as applied
  union all select 2, '002',
    (select count(*) = 4 from information_schema.columns
      where table_schema = 'public' and column_name = 'company_id'
        and table_name in ('marketplace_connections','sync_logs','marketplace_products','marketplace_inventory'))
    and exists (select 1 from pg_constraint where conname = 'sync_logs_event_type_check')
  union all select 3, '003',
    to_regclass('public.companies') is not null
    and to_regclass('public.company_members') is not null
    and exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'companies')
  union all select 4, '004',
    to_regprocedure('public.user_company_ids()') is not null
    and (select count(*) = 4 from pg_policies where schemaname = 'public'
      and policyname in ('marketplace_connections_select_own','sync_logs_select_own','marketplace_products_select_own','marketplace_inventory_select_own'))
  union all select 5, '005',
    to_regclass('public.platform_admins') is not null
    and to_regprocedure('public.is_platform_admin()') is not null
  union all select 6, '006',
    to_regclass('public.rate_limits') is not null
    and to_regprocedure('public.check_rate_limit(text,integer,integer)') is not null
  union all select 7, '007',
    to_regclass('public.orders') is not null
    and to_regclass('public.order_items') is not null
  union all select 8, '008',
    (select count(*) = 3 from information_schema.columns where table_schema = 'public'
      and table_name = 'companies' and column_name in ('contact_email','contact_phone','notes'))
  union all select 9, '009',
    (select count(*) = 4 from information_schema.columns where table_schema = 'public'
      and table_name = 'companies' and column_name in ('cnpj','whatsapp','website','status'))
  union all select 10, '010',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'fee_amount')
  union all select 11, '011',
    (select count(*) = 3 from information_schema.columns where table_schema = 'public'
      and table_name = 'marketplace_products' and column_name in ('category_id','category_name','cost_price'))
  union all select 12, '012',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'companies' and column_name = 'receita_data')
  union all select 13, '013', to_regclass('public.leads') is not null
  union all select 14, '014',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'companies' and column_name = 'logo_url')
  union all select 15, '015',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'marketplace_connections' and column_name = 'sync_started_at')
  union all select 16, '016',
    to_regclass('public.support_tickets') is not null and to_regclass('public.support_messages') is not null
  union all select 17, '017',
    exists (select 1 from pg_constraint where conname = 'support_tickets_subject_length')
    and exists (select 1 from pg_constraint where conname = 'support_messages_body_length')
  union all select 18, '018',
    to_regclass('public.security_audit_logs') is not null
    and to_regprocedure('public.delete_company_if_empty(uuid,uuid,text)') is not null
    and exists (select 1 from pg_constraint where conname = 'company_members_role_check')
  union all select 19, '019',
    to_regclass('public.sales_channels') is not null
    and to_regclass('public.marketplace_categories') is not null
    and to_regclass('public.marketplace_inventory_sources') is not null
    and to_regclass('public.integration_sync_runs') is not null
    and to_regclass('public.order_source_refs') is not null
    and to_regclass('public.vtex_channel_mappings') is not null
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'canonical_order_key')
  union all select 20, '020',
    exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'integration_sync_runs' and column_name = 'last_heartbeat_at')
  union all select 21, '021',
    (select count(*) = 3 from information_schema.columns where table_schema = 'public'
      and table_name = 'vtex_channel_mappings' and column_name in ('identifier_type','identifier_value','resolution_source'))
    and exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'sales_channels' and column_name = 'logo_key')
    and to_regclass('public.vtex_channel_mappings_identifier_uidx') is not null
  union all select 22, '022',
    exists (select 1 from pg_constraint
      where conname = 'vtex_channel_mappings_resolution_source_check'
        and pg_get_constraintdef(oid) like '%vtex_affiliate_registry%')
  union all select 23, '023',
    to_regprocedure('public.provision_company_with_owner(jsonb,uuid,uuid,text)') is not null
)
select version, migration, applied
from checks
order by version;
