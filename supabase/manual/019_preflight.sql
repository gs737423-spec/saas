-- Migration 019 pre-flight. READ ONLY: run only after 018 verification passes.
-- Any non-zero issue_count, missing dependency, or listed 019 artifact is a
-- STOP condition. Do not repair production data inside the migration.

select required.object_name,
       to_regclass(required.object_name) is not null as present
from (values
  ('public.companies'),
  ('public.marketplace_connections'),
  ('public.marketplace_products'),
  ('public.marketplace_inventory'),
  ('public.sync_logs'),
  ('public.orders'),
  ('public.order_items'),
  ('public.security_audit_logs')
) as required(object_name)
order by required.object_name;

select required.function_signature,
       to_regprocedure(required.function_signature) is not null as present
from (values
  ('public.touch_updated_at()'),
  ('public.user_company_ids()'),
  ('public.is_platform_admin()'),
  ('public.delete_company_if_empty(uuid,uuid,text)')
) as required(function_signature)
order by required.function_signature;

-- Provider and channel inventory. These queries also work before the 019
-- columns exist because to_jsonb(record) returns null for an absent key.
select provider, count(*) as order_count
from public.orders
group by provider
order by provider;

select provider,
       coalesce(to_jsonb(o) ->> 'sales_channel', '<NULL_OR_ABSENT>') as sales_channel,
       count(*) as order_count
from public.orders o
group by provider, coalesce(to_jsonb(o) ->> 'sales_channel', '<NULL_OR_ABSENT>')
order by provider, sales_channel;

select 'magalu_orders_to_map_directly' as observation_name, count(*) as observation_count
from public.orders
where provider = 'magalu'
union all
select 'vtex_orders_without_resolved_channel', count(*)
from public.orders o
where provider = 'vtex'
  and nullif(btrim(to_jsonb(o) ->> 'sales_channel'), '') is null
union all
select 'vtex_unresolved_currently_global_eligible', count(*)
from public.orders o
where provider = 'vtex'
  and (
    nullif(btrim(to_jsonb(o) ->> 'sales_channel'), '') is null
    or to_jsonb(o) ->> 'sales_channel' = 'unknown_marketplace'
    or to_jsonb(o) ->> 'sales_channel' like 'external:vtex:%'
    or to_jsonb(o) ->> 'channel_resolution_status' = 'unresolved'
  )
  and case lower(coalesce(to_jsonb(o) ->> 'analytics_included', 'true'))
        when 'false' then false else true
      end;

select 'structurally_invalid_existing_sales_channel' as check_name, count(*) as issue_count
from public.orders o
where nullif(btrim(to_jsonb(o) ->> 'sales_channel'), '') is not null
  and (char_length(to_jsonb(o) ->> 'sales_channel') > 160
       or to_jsonb(o) ->> 'sales_channel' !~ '^[a-z0-9][a-z0-9._:-]*$')
union all
select 'direct_provider_existing_channel_mismatch', count(*)
from public.orders o
where provider in ('mercadolivre','shopee','amazon','magalu','loja_propria')
  and nullif(btrim(to_jsonb(o) ->> 'sales_channel'), '') is not null
  and to_jsonb(o) ->> 'sales_channel' <> provider;

select 'unsupported_connection_provider' as check_name, count(*) as issue_count
from public.marketplace_connections
where provider not in ('mercadolivre','shopee','amazon','magalu','loja_propria','vtex')
union all
select 'unsupported_connection_status', count(*)
from public.marketplace_connections
where status not in ('disconnected','pending','connecting','connected','syncing','requires_attention','error','expired')
union all
select 'unsupported_product_provider', count(*)
from public.marketplace_products
where provider not in ('mercadolivre','shopee','amazon','magalu','loja_propria','vtex')
union all
select 'unsupported_inventory_provider', count(*)
from public.marketplace_inventory
where provider not in ('mercadolivre','shopee','amazon','magalu','loja_propria','vtex')
union all
select 'unsupported_order_provider', count(*)
from public.orders
where provider not in ('mercadolivre','shopee','amazon','magalu','loja_propria','vtex')
union all
select 'unsupported_sync_log_provider', count(*)
from public.sync_logs
where provider not in ('mercadolivre','shopee','amazon','magalu','loja_propria','vtex')
union all
select 'unsupported_sync_log_event_type', count(*)
from public.sync_logs
where event_type not in (
  'oauth_started','oauth_connected','oauth_error','token_refreshed',
  'sync_started','sync_success','sync_error','sync_partial',
  'validation_error','config_missing','connection_missing',
  'connection_tested','credentials_rotated','connection_disconnected',
  'sync_queued','sync_stage','channel_discovered','provider_rate_limited','credentials_invalid'
);

select 'connection_without_company' as check_name, count(*) as issue_count
from public.marketplace_connections mc
left join public.companies c on c.id::text = mc.company_id
where c.id is null
union all
select 'product_connection_tenant_or_provider_mismatch', count(*)
from public.marketplace_products p
join public.marketplace_connections mc on mc.id = p.connection_id
where p.company_id <> mc.company_id or p.provider <> mc.provider
union all
select 'inventory_connection_tenant_or_provider_mismatch', count(*)
from public.marketplace_inventory i
join public.marketplace_connections mc on mc.id = i.connection_id
where i.company_id <> mc.company_id or i.provider <> mc.provider
union all
select 'order_connection_tenant_or_provider_mismatch', count(*)
from public.orders o
join public.marketplace_connections mc on mc.id = o.connection_id
where o.company_id <> mc.company_id or o.provider <> mc.provider
union all
select 'sync_log_connection_tenant_or_provider_mismatch', count(*)
from public.sync_logs s
join public.marketplace_connections mc on mc.id = s.connection_id
where s.company_id <> mc.company_id or s.provider <> mc.provider
union all
select 'order_item_order_tenant_mismatch', count(*)
from public.order_items oi
join public.orders o on o.id = oi.order_id
where oi.company_id <> o.company_id;

select 'blank_order_identity' as check_name, count(*) as issue_count
from public.orders
where btrim(provider) = '' or btrim(external_order_id) = ''
union all
select 'prospective_canonical_order_duplicates', count(*)
from (
  select company_id, provider || ':' || external_order_id as canonical_order_key
  from public.orders
  group by company_id, provider || ':' || external_order_id
  having count(*) > 1
) duplicates;

select n.nspname as schema_name, c.relname as preexisting_019_relation, c.relkind
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'marketplace_categories','marketplace_inventory_sources','integration_sync_runs','order_source_refs',
    'sales_channels','vtex_channel_mappings',
    'marketplace_connections_company_id_provider_uidx','orders_company_id_uidx',
    'orders_company_canonical_key_uidx','orders_company_channel_ordered_idx',
    'marketplace_categories_company_connection_idx','marketplace_inventory_sources_company_product_idx',
    'integration_sync_runs_one_active_idx','integration_sync_runs_company_created_idx',
    'order_source_refs_company_canonical_idx','sales_channels_company_status_idx',
    'vtex_channel_mappings_company_resolution_idx'
  )
order by c.relname;

select a.attrelid::regclass::text as table_name, a.attname as preexisting_019_column,
       pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type
from pg_catalog.pg_attribute a
where a.attnum > 0 and not a.attisdropped
  and (
    (a.attrelid = 'public.marketplace_connections'::regclass and a.attname in (
      'credential_key_encrypted','credential_secret_encrypted','provider_metadata','permissions',
      'last_success_at','next_sync_at','failure_count','circuit_open_until'))
    or (a.attrelid = 'public.marketplace_products'::regclass and a.attname in (
      'parent_product_id','category_path','source_metadata'))
    or (a.attrelid = 'public.orders'::regclass and a.attname in (
      'canonical_order_key','sales_channel','source_account','source_updated_at',
      'analytics_included','unavailable_reason','channel_resolution_status'))
  )
order by table_name, preexisting_019_column;

select event_object_table as table_name, trigger_name as preexisting_019_trigger
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name in ('trg_marketplace_categories_updated_at','trg_integration_sync_runs_updated_at',
    'trg_sales_channels_updated_at','trg_vtex_channel_mappings_updated_at')
order by trigger_name;

select tablename, policyname as preexisting_019_policy
from pg_catalog.pg_policies
where schemaname = 'public'
  and policyname in (
    'marketplace_categories_select_own','marketplace_inventory_sources_select_own',
    'integration_sync_runs_select_own','order_source_refs_select_own',
    'sales_channels_select_own','vtex_channel_mappings_select_own'
  )
order by tablename, policyname;
