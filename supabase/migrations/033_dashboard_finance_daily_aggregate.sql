-- Additive aggregate for the Marketplace revenue series. The API retains its
-- existing response shape while the database groups the large order set.

begin;

create or replace function public.dashboard_finance_daily_aggregate(
  p_company_id text,
  p_connection_ids uuid[],
  p_since timestamptz,
  p_until timestamptz
)
returns table(order_day date, sales_channel text, gross_revenue numeric)
language sql
security definer
set search_path = ''
as $$
  select (o.ordered_at at time zone 'America/Sao_Paulo')::date as order_day,
    coalesce(o.sales_channel, '') as sales_channel,
    coalesce(sum(o.total_amount), 0)::numeric as gross_revenue
  from public.orders o
  where o.company_id = p_company_id
    and o.connection_id = any(p_connection_ids)
    and o.status = 'paid'
    and o.analytics_included = true
    and o.ordered_at >= p_since and o.ordered_at < p_until
  group by 1, 2;
$$;

revoke all on function public.dashboard_finance_daily_aggregate(text, uuid[], timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_finance_daily_aggregate(text, uuid[], timestamptz, timestamptz) to service_role;

commit;
