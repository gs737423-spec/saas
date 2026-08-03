-- Pedidos reais dos marketplaces — base pra faturamento, ticket médio e
-- histórico de venda por produto (hoje 100% mock no dashboard). Mesmo
-- padrão de RLS das tabelas de integração: deny-all pra anon/authenticated
-- por padrão, SELECT liberado só via user_company_ids()/is_platform_admin()
-- (funções já criadas em 004/005 — reaproveitadas aqui, não redefinidas).

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  connection_id uuid not null references marketplace_connections(id) on delete cascade,
  provider text not null check (provider in ('mercadolivre', 'shopee', 'amazon', 'magalu', 'loja_propria')),
  external_order_id text not null,
  status text not null,
  total_amount numeric not null default 0,
  currency text,
  buyer_external_id text,
  ordered_at timestamptz not null,
  raw_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, connection_id, external_order_id)
);

create index if not exists orders_company_id_idx on orders (company_id);
create index if not exists orders_connection_id_idx on orders (connection_id);
create index if not exists orders_ordered_at_idx on orders (ordered_at desc);
create index if not exists orders_status_idx on orders (status);

alter table orders enable row level security;

drop trigger if exists trg_orders_updated_at on orders;
create trigger trg_orders_updated_at
  before update on orders
  for each row execute function touch_updated_at();

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  company_id text not null,
  order_id uuid not null references orders(id) on delete cascade,
  external_product_id text,
  sku text,
  title text not null,
  quantity integer not null default 1,
  unit_price numeric not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists order_items_company_id_idx on order_items (company_id);
create index if not exists order_items_order_id_idx on order_items (order_id);
create index if not exists order_items_sku_idx on order_items (sku);

alter table order_items enable row level security;

drop policy if exists orders_select_own on orders;
create policy orders_select_own on orders
  for select
  using (is_platform_admin() or company_id in (select user_company_ids()));

drop policy if exists order_items_select_own on order_items;
create policy order_items_select_own on order_items
  for select
  using (is_platform_admin() or company_id in (select user_company_ids()));
