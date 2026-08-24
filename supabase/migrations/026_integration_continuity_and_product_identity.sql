-- Additive integration continuity and product identity fields.
-- Applied to vintec-production and verified on 2026-08-24.

begin;

alter table public.marketplace_connections add column if not exists catalog_checkpoint jsonb not null default '{}'::jsonb;
alter table public.marketplace_connections add column if not exists orders_checkpoint jsonb not null default '{}'::jsonb;
alter table public.marketplace_connections add column if not exists catalog_last_sync_at timestamptz;
alter table public.marketplace_connections add column if not exists inventory_last_sync_at timestamptz;
alter table public.marketplace_connections add column if not exists orders_last_sync_at timestamptz;

alter table public.marketplace_products add column if not exists brand_external_id text;
alter table public.marketplace_products add column if not exists brand_name text;
alter table public.marketplace_products add column if not exists last_seen_at timestamptz;
alter table public.marketplace_products add column if not exists active boolean not null default true;

alter table public.marketplace_inventory add column if not exists last_seen_at timestamptz;
alter table public.marketplace_inventory add column if not exists active boolean not null default true;

create index if not exists marketplace_products_company_connection_active_idx
  on public.marketplace_products (company_id, connection_id, active, last_seen_at);
create index if not exists marketplace_inventory_company_connection_active_idx
  on public.marketplace_inventory (company_id, connection_id, active, last_seen_at);

commit;
