-- Additive performance migration. Keeps existing readers/writers intact and
-- introduces a compact aggregate for dashboard reads with no transaction
-- ledger. Safe while old application versions are still deployed.

begin;

create index if not exists orders_company_connection_paid_analytics_ordered_idx
  on public.orders (company_id, connection_id, ordered_at desc)
  where status = 'paid' and analytics_included = true;

create index if not exists sync_logs_company_created_at_idx
  on public.sync_logs (company_id, created_at desc);

create or replace function public.dashboard_finance_aggregate(
  p_company_id text,
  p_connection_ids uuid[],
  p_since timestamptz,
  p_until timestamptz,
  p_previous_since timestamptz default null
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with current_orders as (
    select sales_channel, total_amount, fee_amount, fee_status,
      refund_amount, refund_status
    from public.orders
    where company_id = p_company_id
      and connection_id = any(p_connection_ids)
      and status = 'paid'
      and analytics_included = true
      and ordered_at >= p_since and ordered_at < p_until
  ), channel_rows as (
    select coalesce(sales_channel, '') as sales_channel,
      count(*)::integer as orders_count,
      coalesce(sum(total_amount), 0)::numeric as gross_revenue,
      coalesce(sum(case when fee_status in ('known', 'partial') then coalesce(fee_amount, 0) else 0 end), 0)::numeric as fees,
      count(*) filter (where fee_status = 'known' and fee_amount is not null)::integer as fee_known_orders,
      count(*) filter (where fee_status = 'partial')::integer as fee_partial_orders,
      coalesce(sum(case when refund_status in ('known', 'partial') and coalesce(refund_amount, 0) >= 0 then coalesce(refund_amount, 0) else 0 end), 0)::numeric as refunds,
      count(*) filter (where refund_status = 'known' and refund_amount is not null)::integer as refund_known_orders,
      count(*) filter (where refund_status = 'partial')::integer as refund_partial_orders,
      count(*) filter (where refund_status in ('known', 'partial') and coalesce(refund_amount, 0) > 0)::integer as refunded_orders
    from current_orders group by coalesce(sales_channel, '')
  ), previous_rows as (
    select count(*)::integer as orders_count, coalesce(sum(total_amount), 0)::numeric as gross_revenue
    from public.orders
    where p_previous_since is not null
      and company_id = p_company_id and connection_id = any(p_connection_ids)
      and status = 'paid' and analytics_included = true
      and ordered_at >= p_previous_since and ordered_at < p_since
  )
  select jsonb_build_object(
    'channels', coalesce((select jsonb_agg(jsonb_build_object(
      'salesChannel', sales_channel, 'ordersCount', orders_count,
      'grossRevenue', gross_revenue, 'fees', fees,
      'feeKnownOrders', fee_known_orders, 'feePartialOrders', fee_partial_orders,
      'refunds', refunds, 'refundKnownOrders', refund_known_orders,
      'refundPartialOrders', refund_partial_orders, 'refundedOrders', refunded_orders
    )) from channel_rows), '[]'::jsonb),
    'previous', jsonb_build_object('ordersCount', (select orders_count from previous_rows), 'grossRevenue', (select gross_revenue from previous_rows))
  );
$$;

revoke all on function public.dashboard_finance_aggregate(text, uuid[], timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_finance_aggregate(text, uuid[], timestamptz, timestamptz, timestamptz) to service_role;

commit;
