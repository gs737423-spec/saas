begin;

-- Expand-only financial contract. Existing application versions ignore these
-- columns; the new runtime must only be deployed after this migration.
alter table public.orders
  add column if not exists refund_amount numeric,
  add column if not exists refund_status text not null default 'unknown',
  add column if not exists refund_updated_at timestamptz;

alter table public.orders
  drop constraint if exists orders_refund_status_check;

alter table public.orders
  add constraint orders_refund_status_check
  check (refund_status in ('known', 'unknown', 'partial'));

alter table public.orders
  drop constraint if exists orders_refund_amount_non_negative_check;

alter table public.orders
  add constraint orders_refund_amount_non_negative_check
  check (refund_amount is null or refund_amount >= 0);

comment on column public.orders.refund_amount is
  'Provider-confirmed refunded amount. NULL means unavailable; consult refund_status.';
comment on column public.orders.refund_status is
  'Completeness of refund_amount: known, unknown, or partial.';
comment on column public.orders.refund_updated_at is
  'Latest provider timestamp associated with the confirmed refund snapshot.';

commit;
