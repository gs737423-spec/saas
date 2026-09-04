-- READ ONLY preflight for migration 023. No rows or schema are modified.
select
  to_regclass('public.companies') is not null as companies,
  to_regclass('public.company_members') is not null as company_members,
  to_regclass('public.platform_admins') is not null as platform_admins,
  to_regclass('public.marketplace_connections') is not null as marketplace_connections,
  to_regclass('public.orders') is not null as orders,
  to_regclass('public.order_items') is not null as order_items,
  to_regclass('public.support_tickets') is not null as support_tickets,
  to_regclass('public.support_messages') is not null as support_messages,
  to_regclass('public.integration_sync_runs') is not null as integration_sync_runs,
  to_regclass('public.vtex_channel_mappings') is not null as vtex_channel_mappings,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='marketplace_connections' and column_name='sync_started_at') as migration_015,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='orders' and column_name='fee_amount') as migration_010,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='integration_sync_runs' and column_name='last_heartbeat_at') as migration_020,
  ((select count(*)=3 from information_schema.columns where table_schema='public' and table_name='vtex_channel_mappings' and column_name in ('identifier_type','identifier_value','resolution_source'))
    and exists(select 1 from information_schema.columns where table_schema='public' and table_name='sales_channels' and column_name='logo_key')) as migration_021,
  exists(select 1 from pg_constraint where conname='vtex_channel_mappings_resolution_source_check' and pg_get_constraintdef(oid) like '%vtex_affiliate_registry%') as migration_022,
  to_regprocedure('public.provision_company_with_owner(jsonb,uuid,uuid,text)') is not null as migration_023,
  (select count(*) from public.platform_admins) as platform_admin_count,
  (select count(distinct pa.user_id) from public.platform_admins pa join auth.mfa_factors mf on mf.user_id=pa.user_id and mf.status='verified') as admins_with_verified_mfa,
  to_regclass('supabase_migrations.schema_migrations') as migration_history_table;
