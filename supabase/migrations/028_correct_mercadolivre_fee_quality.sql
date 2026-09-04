begin;

-- Migration 024 promoted every historical Mercado Livre fee to `known`.
-- The connector only receives `sale_fee` per order item, which is useful but
-- does not prove complete coverage of every marketplace deduction. Preserve
-- the imported amount while correcting only its completeness classification.
update public.orders
set fee_status = 'partial'
where provider = 'mercadolivre'
  and fee_status = 'known';

comment on column public.orders.fee_status is
  'Completeness of fee_amount: known, unknown, or partial. Mercado Livre sale_fee coverage is partial.';

commit;
