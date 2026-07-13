-- Incremental migration: multi-tenant readiness + additional sync_log events.
--
-- No real multi-company/login system exists yet. Every row gets a fixed
-- `company_id = 'default-company'` default so the current single-tenant MVP
-- keeps working unmodified, but every table and future query is already
-- shaped so a real `workspace_id`/`company_id` (once auth ships) can never
-- accidentally mix data between tenants — the column, the index and the
-- uniqueness constraints already account for it.

alter table marketplace_connections add column if not exists company_id text not null default 'default-company';
alter table sync_logs add column if not exists company_id text not null default 'default-company';
alter table marketplace_products add column if not exists company_id text not null default 'default-company';
alter table marketplace_inventory add column if not exists company_id text not null default 'default-company';

-- Re-scope uniqueness/lookups to be per-company instead of global.
-- Each new constraint is dropped-if-exists before being (re)added so this
-- migration can be run more than once without erroring (plain ADD CONSTRAINT
-- has no IF NOT EXISTS in Postgres).
alter table marketplace_connections drop constraint if exists marketplace_connections_provider_key;
alter table marketplace_connections drop constraint if exists marketplace_connections_company_provider_key;
alter table marketplace_connections add constraint marketplace_connections_company_provider_key unique (company_id, provider);

alter table marketplace_products drop constraint if exists marketplace_products_connection_id_external_product_id_key;
alter table marketplace_products drop constraint if exists marketplace_products_company_connection_external_key;
alter table marketplace_products add constraint marketplace_products_company_connection_external_key unique (company_id, connection_id, external_product_id);

alter table marketplace_inventory drop constraint if exists marketplace_inventory_connection_id_external_product_id_key;
alter table marketplace_inventory drop constraint if exists marketplace_inventory_company_connection_external_key;
alter table marketplace_inventory add constraint marketplace_inventory_company_connection_external_key unique (company_id, connection_id, external_product_id);

create index if not exists marketplace_connections_company_id_idx on marketplace_connections (company_id);
create index if not exists marketplace_products_company_id_idx on marketplace_products (company_id);
create index if not exists marketplace_inventory_company_id_idx on marketplace_inventory (company_id);
create index if not exists sync_logs_company_id_idx on sync_logs (company_id);

-- Fase 3 sync needs two more controlled failure states: the sync endpoint
-- was asked to run without valid env vars (config_missing) or without an
-- existing connection row (connection_missing) — both must be logged, not
-- silently ignored.
alter table sync_logs drop constraint if exists sync_logs_event_type_check;
alter table sync_logs add constraint sync_logs_event_type_check check (event_type in (
  'oauth_started', 'oauth_connected', 'oauth_error',
  'token_refreshed',
  'sync_started', 'sync_success', 'sync_error', 'sync_partial',
  'validation_error', 'config_missing', 'connection_missing'
));
