-- Migration 019 verification. READ ONLY: run immediately after applying 019.

select required.object_name,
       to_regclass(required.object_name) is not null as present,
       coalesce(c.relrowsecurity, false) as rls_enabled
from (values
  ('public.marketplace_categories'),
  ('public.marketplace_inventory_sources'),
  ('public.integration_sync_runs'),
  ('public.order_source_refs'),
  ('public.sales_channels'),
  ('public.vtex_channel_mappings')
) as required(object_name)
left join pg_catalog.pg_class c on c.oid = to_regclass(required.object_name)
order by required.object_name;

select a.attrelid::regclass::text as table_name,
       a.attname as column_name,
       pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
       a.attnotnull as not_null,
       pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_expression
from pg_catalog.pg_attribute a
left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where a.attnum > 0 and not a.attisdropped
  and a.attrelid in (
    'public.marketplace_connections'::regclass,
    'public.marketplace_products'::regclass,
    'public.marketplace_inventory'::regclass,
    'public.orders'::regclass,
    'public.marketplace_categories'::regclass,
    'public.marketplace_inventory_sources'::regclass,
    'public.integration_sync_runs'::regclass,
    'public.order_source_refs'::regclass,
    'public.sales_channels'::regclass,
    'public.vtex_channel_mappings'::regclass
  )
order by table_name, a.attnum;

select con.conrelid::regclass::text as table_name,
       con.conname,
       con.contype,
       con.convalidated,
       pg_catalog.pg_get_constraintdef(con.oid) as definition
from pg_catalog.pg_constraint con
where con.conrelid in (
  'public.marketplace_connections'::regclass,
  'public.marketplace_products'::regclass,
  'public.marketplace_inventory'::regclass,
  'public.sync_logs'::regclass,
  'public.orders'::regclass,
  'public.order_items'::regclass,
  'public.marketplace_categories'::regclass,
  'public.marketplace_inventory_sources'::regclass,
  'public.integration_sync_runs'::regclass,
  'public.order_source_refs'::regclass,
  'public.sales_channels'::regclass,
  'public.vtex_channel_mappings'::regclass
)
order by table_name, con.conname;

select indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and indexname in (
    'marketplace_connections_company_id_provider_uidx','orders_company_id_uidx',
    'orders_company_canonical_key_uidx','orders_company_channel_ordered_idx',
    'marketplace_categories_company_connection_idx','marketplace_inventory_sources_company_product_idx',
    'integration_sync_runs_one_active_idx','integration_sync_runs_company_created_idx',
    'order_source_refs_company_canonical_idx','sales_channels_company_status_idx',
    'vtex_channel_mappings_company_resolution_idx'
  )
order by indexname;

select tablename, policyname, cmd, roles, qual, with_check
from pg_catalog.pg_policies
where schemaname = 'public'
  and tablename in ('marketplace_categories','marketplace_inventory_sources','integration_sync_runs','order_source_refs',
    'sales_channels','vtex_channel_mappings')
order by tablename, policyname;

select table_name,
       has_table_privilege('anon', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') as anon_has_dml,
       has_table_privilege('authenticated', 'public.' || table_name, 'SELECT') as authenticated_can_select,
       has_table_privilege('authenticated', 'public.' || table_name, 'INSERT,UPDATE,DELETE') as authenticated_can_mutate,
       has_table_privilege('service_role', 'public.' || table_name, 'SELECT,INSERT,UPDATE,DELETE') as service_role_has_dml
from (values
  ('marketplace_categories'),
  ('marketplace_inventory_sources'),
  ('integration_sync_runs'),
  ('order_source_refs'),
  ('sales_channels'),
  ('vtex_channel_mappings')
) as tables(table_name)
order by table_name;

select 'null_canonical_order_key' as check_name, count(*) as issue_count
from public.orders where canonical_order_key is null
union all
select 'duplicate_canonical_order_key', count(*)
from (
  select company_id, canonical_order_key from public.orders
  group by company_id, canonical_order_key having count(*) > 1
) duplicates
union all
select 'direct_provider_channel_mismatch', count(*)
from public.orders
where provider in ('mercadolivre','shopee','amazon','magalu','loja_propria')
  and sales_channel is distinct from provider
union all
select 'magalu_misclassified_as_non_magalu', count(*)
from public.orders
where provider = 'magalu' and sales_channel is distinct from 'magalu'
union all
select 'vtex_unresolved_excluded_from_global_analytics', count(*)
from public.orders
where provider = 'vtex'
  and channel_resolution_status = 'unresolved'
  and analytics_included = false
union all
select 'vtex_unresolved_without_reason', count(*)
from public.orders
where provider = 'vtex'
  and channel_resolution_status = 'unresolved'
  and unavailable_reason is distinct from 'VTEX_CHANNEL_MAPPING_REQUIRED'
union all
select 'order_without_registered_channel', count(*)
from public.orders o
left join public.sales_channels c
  on c.company_id = o.company_id and c.canonical_key = o.sales_channel
where c.id is null
union all
select 'unresolved_channel_misclassified_as_own_store', count(*)
from public.orders
where channel_resolution_status = 'unresolved' and sales_channel = 'loja_propria'
union all
select 'vtex_marketplace_signal_misclassified_as_own_store', count(*)
from public.orders o
join public.order_source_refs source on source.order_id = o.id and source.company_id = o.company_id
where o.provider = 'vtex' and o.sales_channel = 'loja_propria'
  and (source.affiliate_id is not null or source.marketplace_order_id is not null)
union all
select 'category_connection_tenant_or_provider_mismatch', count(*)
from public.marketplace_categories x
join public.marketplace_connections mc on mc.id = x.connection_id
where x.company_id <> mc.company_id or x.provider <> mc.provider
union all
select 'inventory_source_connection_tenant_or_provider_mismatch', count(*)
from public.marketplace_inventory_sources x
join public.marketplace_connections mc on mc.id = x.connection_id
where x.company_id <> mc.company_id or x.provider <> mc.provider
union all
select 'sync_run_connection_tenant_or_provider_mismatch', count(*)
from public.integration_sync_runs x
join public.marketplace_connections mc on mc.id = x.connection_id
where x.company_id <> mc.company_id or x.provider <> mc.provider
union all
select 'order_source_order_tenant_mismatch', count(*)
from public.order_source_refs x join public.orders o on o.id = x.order_id
where x.company_id <> o.company_id
union all
select 'order_source_connection_tenant_or_provider_mismatch', count(*)
from public.order_source_refs x
join public.marketplace_connections mc on mc.id = x.connection_id
where x.company_id <> mc.company_id or x.provider <> mc.provider
union all
select 'vtex_mapping_connection_tenant_or_provider_mismatch', count(*)
from public.vtex_channel_mappings x
join public.marketplace_connections mc on mc.id = x.connection_id
where x.company_id <> mc.company_id or mc.provider <> 'vtex'
union all
select 'vtex_mapping_channel_tenant_mismatch', count(*)
from public.vtex_channel_mappings x
left join public.sales_channels c
  on c.company_id = x.company_id and c.canonical_key = x.canonical_channel
where c.id is null;

select event_object_table as table_name, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in ('trg_marketplace_categories_updated_at','trg_integration_sync_runs_updated_at',
    'trg_sales_channels_updated_at','trg_vtex_channel_mappings_updated_at')
order by trigger_name;

select p.prosecdef as delete_rpc_security_definer,
       p.proconfig as delete_rpc_config,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute,
       position('MARKETPLACE_CATEGORIES' in upper(pg_catalog.pg_get_functiondef(p.oid))) > 0 as checks_categories,
       position('MARKETPLACE_INVENTORY_SOURCES' in upper(pg_catalog.pg_get_functiondef(p.oid))) > 0 as checks_inventory_sources,
       position('INTEGRATION_SYNC_RUNS' in upper(pg_catalog.pg_get_functiondef(p.oid))) > 0 as checks_sync_runs,
       position('ORDER_SOURCE_REFS' in upper(pg_catalog.pg_get_functiondef(p.oid))) > 0 as checks_order_sources,
       position('SALES_CHANNELS' in upper(pg_catalog.pg_get_functiondef(p.oid))) > 0 as checks_sales_channels,
       position('VTEX_CHANNEL_MAPPINGS' in upper(pg_catalog.pg_get_functiondef(p.oid))) > 0 as checks_vtex_channel_mappings
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.oid = 'public.delete_company_if_empty(uuid,uuid,text)'::regprocedure;

select table_name, column_name as unsafe_plaintext_credential_column
from information_schema.columns
where table_schema = 'public'
  and table_name = 'marketplace_connections'
  and (column_name like '%credential%' or column_name like '%secret%'
       or column_name like '%access_token%' or column_name like '%refresh_token%')
  and column_name not like '%encrypted%'
order by column_name;
