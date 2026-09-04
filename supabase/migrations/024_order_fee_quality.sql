begin;

-- `0` is a valid fee amount and must not also mean "provider did not supply
-- fees". Existing readers remain compatible because they already handle
-- nullable numeric values; new code exposes completeness separately.
alter table public.orders
  alter column fee_amount drop not null,
  alter column fee_amount drop default;

-- Unknown inventory must remain NULL. The original schema defaulted omitted
-- values to zero; that would keep fabricating out-of-stock products whenever
-- a provider response lacks stock data.
alter table public.marketplace_products
  alter column available_quantity drop default,
  alter column sold_quantity drop not null,
  alter column sold_quantity drop default;

alter table public.marketplace_inventory
  alter column available_quantity drop default;

alter table public.orders
  add column if not exists fee_status text not null default 'unknown';

alter table public.orders
  drop constraint if exists orders_fee_status_check;

alter table public.orders
  add constraint orders_fee_status_check
  check (fee_status in ('known', 'unknown', 'partial'));

-- Mercado Livre is the only current writer that derives fees from the order
-- payload. VTEX/Shopee historical zeroes remain unknown rather than being
-- promoted to verified values.
update public.orders
set fee_status = 'known'
where provider = 'mercadolivre'
  and fee_status = 'unknown';

comment on column public.orders.fee_amount is
  'Marketplace fees. NULL means unavailable; consult fee_status.';
comment on column public.orders.fee_status is
  'Completeness of fee_amount: known, unknown, or partial.';

commit;
