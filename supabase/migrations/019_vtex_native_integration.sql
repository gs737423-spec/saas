-- VTEX native read-only integration foundation.
-- CREATED LOCALLY. DO NOT APPLY REMOTELY WITHOUT STAGING REVIEW.
-- Expand -> migrate -> verify. No destructive contraction is performed here.

begin;

-- ---------------------------------------------------------------------------
-- Provider and connection expansion
-- ---------------------------------------------------------------------------
alter table public.marketplace_connections drop constraint if exists marketplace_connections_provider_check;
alter table public.marketplace_connections add constraint marketplace_connections_provider_check
  check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex'));

alter table public.marketplace_connections drop constraint if exists marketplace_connections_status_check;
alter table public.marketplace_connections add constraint marketplace_connections_status_check
  check (status in ('disconnected', 'pending', 'connecting', 'connected', 'syncing', 'requires_attention', 'error', 'expired'));

alter table public.marketplace_connections add column if not exists credential_key_encrypted text;
alter table public.marketplace_connections add column if not exists credential_secret_encrypted text;
alter table public.marketplace_connections add column if not exists provider_metadata jsonb not null default '{}'::jsonb;
alter table public.marketplace_connections add column if not exists permissions jsonb not null default '{}'::jsonb;
alter table public.marketplace_connections add column if not exists last_success_at timestamptz;
alter table public.marketplace_connections add column if not exists next_sync_at timestamptz;
alter table public.marketplace_connections add column if not exists failure_count integer not null default 0 check (failure_count >= 0);
alter table public.marketplace_connections add column if not exists circuit_open_until timestamptz;

alter table public.sync_logs drop constraint if exists sync_logs_provider_check;
alter table public.sync_logs add constraint sync_logs_provider_check
  check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex'));

alter table public.sync_logs drop constraint if exists sync_logs_event_type_check;
alter table public.sync_logs add constraint sync_logs_event_type_check check (event_type in (
  'oauth_started', 'oauth_connected', 'oauth_error', 'token_refreshed',
  'sync_started', 'sync_success', 'sync_error', 'sync_partial',
  'validation_error', 'config_missing', 'connection_missing',
  'connection_tested', 'credentials_rotated', 'connection_disconnected',
  'sync_queued', 'sync_stage', 'channel_discovered', 'provider_rate_limited', 'credentials_invalid'
));

alter table public.marketplace_products drop constraint if exists marketplace_products_provider_check;
alter table public.marketplace_products add constraint marketplace_products_provider_check
  check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex'));
alter table public.marketplace_products add column if not exists parent_product_id text;
alter table public.marketplace_products add column if not exists category_path jsonb;
alter table public.marketplace_products add column if not exists source_metadata jsonb not null default '{}'::jsonb;

alter table public.marketplace_inventory drop constraint if exists marketplace_inventory_provider_check;
alter table public.marketplace_inventory add constraint marketplace_inventory_provider_check
  check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex'));

-- `null` means that the provider did not return a finite inventory value.
-- This keeps unavailable/unlimited VTEX stock distinct from a real zero.
alter table public.marketplace_products alter column available_quantity drop not null;
alter table public.marketplace_inventory alter column available_quantity drop not null;

-- Composite referenced keys let every new foreign key prove tenant and
-- provider consistency instead of trusting a privileged writer to do so.
create unique index if not exists marketplace_connections_company_id_provider_uidx
  on public.marketplace_connections (company_id, id, provider);
create unique index if not exists orders_company_id_uidx
  on public.orders (company_id, id);

alter table public.marketplace_products
  drop constraint if exists marketplace_products_company_connection_provider_fkey;
alter table public.marketplace_products
  add constraint marketplace_products_company_connection_provider_fkey
  foreign key (company_id, connection_id, provider)
  references public.marketplace_connections (company_id, id, provider) on delete cascade;

alter table public.marketplace_inventory
  drop constraint if exists marketplace_inventory_company_connection_provider_fkey;
alter table public.marketplace_inventory
  add constraint marketplace_inventory_company_connection_provider_fkey
  foreign key (company_id, connection_id, provider)
  references public.marketplace_connections (company_id, id, provider) on delete cascade;

alter table public.orders
  drop constraint if exists orders_company_connection_provider_fkey;
alter table public.orders
  add constraint orders_company_connection_provider_fkey
  foreign key (company_id, connection_id, provider)
  references public.marketplace_connections (company_id, id, provider) on delete cascade;

alter table public.order_items
  drop constraint if exists order_items_company_order_fkey;
alter table public.order_items
  add constraint order_items_company_order_fkey
  foreign key (company_id, order_id)
  references public.orders (company_id, id) on delete cascade;

alter table public.orders drop constraint if exists orders_provider_check;
alter table public.orders add constraint orders_provider_check
  check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex'));
alter table public.orders add column if not exists canonical_order_key text;
alter table public.orders add column if not exists sales_channel text;
alter table public.orders add column if not exists source_account text;
alter table public.orders add column if not exists source_updated_at timestamptz;
alter table public.orders add column if not exists analytics_included boolean not null default true;
alter table public.orders add column if not exists unavailable_reason text;
alter table public.orders add column if not exists channel_resolution_status text not null default 'resolved';
alter table public.orders drop constraint if exists orders_channel_resolution_status_check;
alter table public.orders add constraint orders_channel_resolution_status_check
  check (channel_resolution_status in ('resolved', 'unresolved', 'ignored'));

-- Sales channels are a tenant-scoped analytic dimension, not a provider enum.
-- New VTEX affiliates can therefore be registered without changing this schema.
create table if not exists public.sales_channels (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  canonical_key text not null
    check (char_length(canonical_key) between 1 and 160 and canonical_key ~ '^[a-z0-9][a-z0-9._:-]*$'),
  display_name text not null check (char_length(display_name) between 1 and 160),
  channel_type text not null check (channel_type in ('marketplace', 'own_store', 'external', 'other')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, canonical_key)
);
create index if not exists sales_channels_company_status_idx
  on public.sales_channels (company_id, status, canonical_key);
alter table public.sales_channels enable row level security;
drop policy if exists sales_channels_select_own on public.sales_channels;
create policy sales_channels_select_own on public.sales_channels for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

update public.orders
set canonical_order_key = coalesce(canonical_order_key, provider || ':' || external_order_id),
    sales_channel = case
      when sales_channel is not null then sales_channel
      when provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria') then provider
      else 'external:vtex:unmapped'
    end,
    analytics_included = case
      when provider = 'vtex' and (sales_channel is null or sales_channel in ('unknown_marketplace', 'external:vtex:unmapped')) then true
      when sales_channel is not null then analytics_included
      else true
    end,
    unavailable_reason = case
      when provider = 'vtex' and (sales_channel is null or sales_channel in ('unknown_marketplace', 'external:vtex:unmapped'))
        then 'VTEX_CHANNEL_MAPPING_REQUIRED'
      when sales_channel is not null then unavailable_reason
      when provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria') then null
      else coalesce(unavailable_reason, 'VTEX_CHANNEL_MAPPING_REQUIRED')
    end,
    channel_resolution_status = case
      when provider = 'vtex' and (sales_channel is null or sales_channel in ('unknown_marketplace', 'external:vtex:unmapped')) then 'unresolved'
      when sales_channel is not null then channel_resolution_status
      else 'resolved'
    end
where canonical_order_key is null or sales_channel is null;

-- If an earlier local draft was applied, convert its closed unresolved marker
-- without removing the order from valid global analytics.
update public.orders
set sales_channel = 'external:vtex:unmapped',
    analytics_included = true,
    channel_resolution_status = 'unresolved',
    unavailable_reason = coalesce(unavailable_reason, 'VTEX_CHANNEL_MAPPING_REQUIRED')
where provider = 'vtex' and sales_channel = 'unknown_marketplace';

insert into public.sales_channels (company_id, canonical_key, display_name, channel_type)
select distinct
  company_id,
  sales_channel,
  case sales_channel
    when 'mercadolivre' then 'Mercado Livre'
    when 'shopee' then 'Shopee'
    when 'amazon' then 'Amazon'
    when 'magalu' then 'Magalu'
    when 'loja_propria' then 'Loja Própria'
    when 'external:vtex:unmapped' then 'Canal VTEX não mapeado'
    else initcap(replace(replace(sales_channel, '_', ' '), ':', ' '))
  end,
  case
    when sales_channel = 'loja_propria' then 'own_store'
    when sales_channel like 'external:%' then 'external'
    else 'marketplace'
  end
from public.orders
where sales_channel is not null
on conflict (company_id, canonical_key) do nothing;

alter table public.orders
  drop constraint if exists orders_company_sales_channel_fkey;
alter table public.orders
  add constraint orders_company_sales_channel_fkey
  foreign key (company_id, sales_channel)
  references public.sales_channels (company_id, canonical_key) on update cascade on delete restrict;

do $$ begin
  if exists (
    select 1 from public.orders
    group by company_id, canonical_order_key
    having count(*) > 1
  ) then
    raise exception 'Duplicate canonical order keys detected; reconcile order sources before applying migration 019';
  end if;
end $$;

alter table public.orders alter column canonical_order_key set not null;
create unique index if not exists orders_company_canonical_key_uidx
  on public.orders (company_id, canonical_order_key);
create index if not exists orders_company_channel_ordered_idx
  on public.orders (company_id, sales_channel, ordered_at desc)
  where analytics_included = true;

-- ---------------------------------------------------------------------------
-- Provider category hierarchy and warehouse-level inventory provenance
-- ---------------------------------------------------------------------------
create table if not exists public.marketplace_categories (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  connection_id uuid not null,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex')),
  external_category_id text not null,
  parent_external_id text,
  name text not null,
  path jsonb not null default '[]'::jsonb check (jsonb_typeof(path) = 'array'),
  level integer check (level is null or level >= 0),
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (company_id, connection_id, provider)
    references public.marketplace_connections (company_id, id, provider) on delete restrict,
  unique (company_id, connection_id, external_category_id)
);
create index if not exists marketplace_categories_company_connection_idx
  on public.marketplace_categories (company_id, connection_id);
alter table public.marketplace_categories enable row level security;
drop policy if exists marketplace_categories_select_own on public.marketplace_categories;
create policy marketplace_categories_select_own on public.marketplace_categories for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

create table if not exists public.marketplace_inventory_sources (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  connection_id uuid not null,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex')),
  external_product_id text not null,
  warehouse_id text not null,
  warehouse_name text,
  total_quantity integer check (total_quantity is null or total_quantity >= 0),
  reserved_quantity integer check (reserved_quantity is null or reserved_quantity >= 0),
  available_quantity integer check (available_quantity is null or available_quantity >= 0),
  unlimited_quantity boolean not null default false,
  last_sync_at timestamptz not null default now(),
  foreign key (company_id, connection_id, provider)
    references public.marketplace_connections (company_id, id, provider) on delete restrict,
  unique (company_id, connection_id, external_product_id, warehouse_id)
);
create index if not exists marketplace_inventory_sources_company_product_idx
  on public.marketplace_inventory_sources (company_id, connection_id, external_product_id);
alter table public.marketplace_inventory_sources enable row level security;
drop policy if exists marketplace_inventory_sources_select_own on public.marketplace_inventory_sources;
create policy marketplace_inventory_sources_select_own on public.marketplace_inventory_sources for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

-- ---------------------------------------------------------------------------
-- Durable sync state and canonical order provenance
-- ---------------------------------------------------------------------------
create table if not exists public.integration_sync_runs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  connection_id uuid not null,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex')),
  mode text not null check (mode in ('full', 'incremental')),
  status text not null default 'queued' check (status in ('queued', 'running', 'partial', 'success', 'failed')),
  stage text not null default 'queued' check (char_length(stage) between 1 and 64),
  checkpoint jsonb not null default '{}'::jsonb check (jsonb_typeof(checkpoint) = 'object'),
  counts jsonb not null default '{}'::jsonb check (jsonb_typeof(counts) = 'object'),
  errors jsonb not null default '[]'::jsonb
    check (jsonb_typeof(errors) = 'array' and pg_column_size(errors) <= 32768),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (company_id, connection_id, provider)
    references public.marketplace_connections (company_id, id, provider) on delete restrict
);
create unique index if not exists integration_sync_runs_one_active_idx
  on public.integration_sync_runs (company_id, connection_id)
  where status in ('queued', 'running');
create index if not exists integration_sync_runs_company_created_idx
  on public.integration_sync_runs (company_id, created_at desc);
alter table public.integration_sync_runs enable row level security;
drop policy if exists integration_sync_runs_select_own on public.integration_sync_runs;
create policy integration_sync_runs_select_own on public.integration_sync_runs for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

create table if not exists public.order_source_refs (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  order_id uuid not null,
  connection_id uuid not null,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria', 'vtex')),
  source_account text,
  external_order_id text not null,
  marketplace_order_id text,
  affiliate_id text,
  external_sales_channel text,
  external_marketplace_name text,
  channel_key text not null,
  channel_resolution_status text not null
    check (channel_resolution_status in ('resolved', 'unresolved', 'ignored')),
  canonical_order_key text not null,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  foreign key (company_id, order_id)
    references public.orders (company_id, id) on delete cascade,
  foreign key (company_id, connection_id, provider)
    references public.marketplace_connections (company_id, id, provider) on delete restrict,
  unique (company_id, connection_id, external_order_id)
);
alter table public.order_source_refs add column if not exists external_sales_channel text;
alter table public.order_source_refs add column if not exists external_marketplace_name text;
alter table public.order_source_refs add column if not exists channel_key text;
alter table public.order_source_refs add column if not exists channel_resolution_status text;
update public.order_source_refs source
set channel_key = coalesce(source.channel_key, orders.sales_channel),
    channel_resolution_status = coalesce(source.channel_resolution_status, orders.channel_resolution_status)
from public.orders orders
where orders.id = source.order_id and orders.company_id = source.company_id
  and (source.channel_key is null or source.channel_resolution_status is null);
alter table public.order_source_refs alter column channel_key set not null;
alter table public.order_source_refs alter column channel_resolution_status set not null;
alter table public.order_source_refs drop constraint if exists order_source_refs_channel_resolution_status_check;
alter table public.order_source_refs add constraint order_source_refs_channel_resolution_status_check
  check (channel_resolution_status in ('resolved', 'unresolved', 'ignored'));
alter table public.order_source_refs drop constraint if exists order_source_refs_company_channel_fkey;
alter table public.order_source_refs add constraint order_source_refs_company_channel_fkey
  foreign key (company_id, channel_key)
  references public.sales_channels (company_id, canonical_key) on update cascade on delete restrict;
create index if not exists order_source_refs_company_canonical_idx
  on public.order_source_refs (company_id, canonical_order_key);
alter table public.order_source_refs enable row level security;
drop policy if exists order_source_refs_select_own on public.order_source_refs;
create policy order_source_refs_select_own on public.order_source_refs for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

-- External VTEX identity -> tenant-scoped analytic channel. Affiliate IDs are
-- never interpreted globally because their meaning can differ by connection.
create table if not exists public.vtex_channel_mappings (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  connection_id uuid not null,
  source_provider text not null default 'vtex' check (source_provider = 'vtex'),
  external_key text not null check (char_length(external_key) between 1 and 320),
  affiliate_id text,
  external_marketplace_id text,
  external_marketplace_name text,
  external_sales_channel text,
  canonical_channel text not null,
  resolution_status text not null check (resolution_status in ('resolved', 'unresolved', 'ignored')),
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (company_id, connection_id, source_provider)
    references public.marketplace_connections (company_id, id, provider) on delete restrict,
  foreign key (company_id, canonical_channel)
    references public.sales_channels (company_id, canonical_key) on update cascade on delete restrict,
  unique (company_id, connection_id, source_provider, external_key)
);
create index if not exists vtex_channel_mappings_company_resolution_idx
  on public.vtex_channel_mappings (company_id, connection_id, resolution_status, last_seen_at desc);
alter table public.vtex_channel_mappings enable row level security;
drop policy if exists vtex_channel_mappings_select_own on public.vtex_channel_mappings;
create policy vtex_channel_mappings_select_own on public.vtex_channel_mappings for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

drop trigger if exists trg_marketplace_categories_updated_at on public.marketplace_categories;
create trigger trg_marketplace_categories_updated_at before update on public.marketplace_categories
  for each row execute function touch_updated_at();
drop trigger if exists trg_integration_sync_runs_updated_at on public.integration_sync_runs;
create trigger trg_integration_sync_runs_updated_at before update on public.integration_sync_runs
  for each row execute function touch_updated_at();
drop trigger if exists trg_sales_channels_updated_at on public.sales_channels;
create trigger trg_sales_channels_updated_at before update on public.sales_channels
  for each row execute function touch_updated_at();
drop trigger if exists trg_vtex_channel_mappings_updated_at on public.vtex_channel_mappings;
create trigger trg_vtex_channel_mappings_updated_at before update on public.vtex_channel_mappings
  for each row execute function touch_updated_at();

revoke all on public.marketplace_categories, public.marketplace_inventory_sources,
  public.integration_sync_runs, public.order_source_refs, public.sales_channels,
  public.vtex_channel_mappings from anon, authenticated;
grant select on public.marketplace_categories, public.marketplace_inventory_sources,
  public.integration_sync_runs, public.order_source_refs, public.sales_channels,
  public.vtex_channel_mappings to authenticated;
grant all on public.marketplace_categories, public.marketplace_inventory_sources,
  public.integration_sync_runs, public.order_source_refs, public.sales_channels,
  public.vtex_channel_mappings to service_role;

-- Keep the guarded company deletion transaction aware of the new operational
-- tables. This replaces the function from migration 018 without broadening its
-- execution grants or deletion behavior.
create or replace function public.delete_company_if_empty(p_company_id uuid, p_actor_user_id uuid, p_request_id text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_counts jsonb; v_company public.companies%rowtype;
begin
  if p_request_id is null or char_length(p_request_id) not between 8 and 128 then raise exception 'invalid request id'; end if;
  if not exists (select 1 from public.platform_admins where user_id = p_actor_user_id) then raise exception 'platform admin required'; end if;
  select * into v_company from public.companies where id = p_company_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  select jsonb_build_object(
    'connections',(select count(*) from public.marketplace_connections where company_id=p_company_id::text),
    'products',(select count(*) from public.marketplace_products where company_id=p_company_id::text),
    'inventory',(select count(*) from public.marketplace_inventory where company_id=p_company_id::text),
    'categories',(select count(*) from public.marketplace_categories where company_id=p_company_id::text),
    'inventorySources',(select count(*) from public.marketplace_inventory_sources where company_id=p_company_id::text),
    'syncRuns',(select count(*) from public.integration_sync_runs where company_id=p_company_id::text),
    'orderSourceRefs',(select count(*) from public.order_source_refs where company_id=p_company_id::text),
    'salesChannels',(select count(*) from public.sales_channels where company_id=p_company_id::text),
    'vtexChannelMappings',(select count(*) from public.vtex_channel_mappings where company_id=p_company_id::text),
    'syncLogs',(select count(*) from public.sync_logs where company_id=p_company_id::text),
    'orders',(select count(*) from public.orders where company_id=p_company_id::text),
    'orderItems',(select count(*) from public.order_items where company_id=p_company_id::text),
    'supportTickets',(select count(*) from public.support_tickets where company_id=p_company_id),
    'supportMessages',(select count(*) from public.support_messages where company_id=p_company_id),
    'storedLogo',case when v_company.logo_url is null then 0 else 1 end
  ) into v_counts;
  insert into public.security_audit_logs(request_id,actor_user_id,company_id,action,target_type,target_id)
    values(p_request_id,p_actor_user_id,p_company_id,'company.delete_attempt','company',p_company_id::text);
  if exists (select 1 from jsonb_each_text(v_counts) item where item.value::bigint > 0) then
    insert into public.security_audit_logs(request_id,actor_user_id,company_id,action,target_type,target_id,metadata)
      values(p_request_id,p_actor_user_id,p_company_id,'company.delete_blocked','company',p_company_id::text,v_counts);
    return jsonb_build_object('status','blocked','dependencies',v_counts);
  end if;
  delete from public.companies where id=p_company_id;
  insert into public.security_audit_logs(request_id,actor_user_id,company_id,action,target_type,target_id)
    values(p_request_id,p_actor_user_id,p_company_id,'company.delete','company',p_company_id::text);
  return jsonb_build_object('status','deleted');
end; $$;
revoke all on function public.delete_company_if_empty(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.delete_company_if_empty(uuid,uuid,text) to service_role;

commit;
