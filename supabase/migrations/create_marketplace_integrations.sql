-- Marketplace integrations — minimal MVP schema (Mercado Livre: connection + products + inventory).
--
-- Orders, order items, and daily metrics tables are intentionally NOT created here yet —
-- they are documented in docs/integrations/marketplace-integrations.md and will ship in a
-- follow-up migration once the orders endpoint is validated against a real Mercado Livre token.
--
-- Security: every table below has RLS enabled with NO policies for `anon` or `authenticated`.
-- Only the Postgres role used via the Supabase service role key (which bypasses RLS entirely)
-- can read or write these rows. That key is read only inside Vercel Serverless Functions
-- (api/**) and is never sent to the browser.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- marketplace_connections
-- ---------------------------------------------------------------------------
create table if not exists marketplace_connections (
  id uuid primary key default gen_random_uuid(),
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria')),
  status text not null default 'disconnected' check (status in ('disconnected', 'pending', 'connected', 'error', 'expired')),
  external_account_id text,
  seller_id text,
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  scopes text,
  sync_interval_minutes integer not null default 60,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider)
);

alter table marketplace_connections enable row level security;

-- ---------------------------------------------------------------------------
-- sync_logs
-- ---------------------------------------------------------------------------
create table if not exists sync_logs (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid references marketplace_connections(id) on delete set null,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria')),
  event_type text not null check (event_type in (
    'oauth_started', 'oauth_connected', 'oauth_error',
    'token_refreshed',
    'sync_started', 'sync_success', 'sync_error', 'sync_partial',
    'validation_error'
  )),
  status text not null default 'info' check (status in ('info', 'success', 'error')),
  message text,
  payload jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists sync_logs_connection_id_idx on sync_logs (connection_id);
create index if not exists sync_logs_provider_created_at_idx on sync_logs (provider, created_at desc);

alter table sync_logs enable row level security;

-- ---------------------------------------------------------------------------
-- marketplace_products
-- ---------------------------------------------------------------------------
create table if not exists marketplace_products (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references marketplace_connections(id) on delete cascade,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria')),
  external_product_id text not null,
  sku text,
  title text not null,
  status text,
  price numeric,
  available_quantity integer not null default 0,
  sold_quantity integer not null default 0,
  permalink text,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_product_id)
);

create index if not exists marketplace_products_connection_id_idx on marketplace_products (connection_id);
create index if not exists marketplace_products_sku_idx on marketplace_products (sku);

alter table marketplace_products enable row level security;

-- ---------------------------------------------------------------------------
-- marketplace_inventory
-- ---------------------------------------------------------------------------
create table if not exists marketplace_inventory (
  id uuid primary key default gen_random_uuid(),
  connection_id uuid not null references marketplace_connections(id) on delete cascade,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria')),
  external_product_id text not null,
  sku text,
  title text not null,
  available_quantity integer not null default 0,
  sold_quantity_30d integer,
  coverage_days numeric,
  last_sync_at timestamptz not null default now(),
  raw_payload jsonb,
  unique (connection_id, external_product_id)
);

create index if not exists marketplace_inventory_connection_id_idx on marketplace_inventory (connection_id);
create index if not exists marketplace_inventory_sku_idx on marketplace_inventory (sku);

alter table marketplace_inventory enable row level security;

-- ---------------------------------------------------------------------------
-- updated_at auto-touch triggers
-- ---------------------------------------------------------------------------
create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_marketplace_connections_updated_at on marketplace_connections;
create trigger trg_marketplace_connections_updated_at
  before update on marketplace_connections
  for each row execute function touch_updated_at();

drop trigger if exists trg_marketplace_products_updated_at on marketplace_products;
create trigger trg_marketplace_products_updated_at
  before update on marketplace_products
  for each row execute function touch_updated_at();
