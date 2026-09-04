begin;

-- Saldo ausente na origem não é saldo zero. Este ajuste mantém o contrato do
-- relatório: só itens com saldo conhecido podem entrar em alertas de estoque
-- baixo e nos seus contadores. Não altera nenhuma linha de dados.
create or replace function public.dashboard_report_products(
  p_company_id text,
  p_connection_ids uuid[],
  p_since timestamptz,
  p_until timestamptz,
  p_previous_since timestamptz
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with current_sales as (
    select o.connection_id, oi.external_product_id,
      sum(oi.quantity)::bigint as units,
      sum(oi.quantity * oi.unit_price)::numeric as revenue
    from public.orders o
    join public.order_items oi on oi.company_id = o.company_id and oi.order_id = o.id
    where o.company_id = p_company_id and o.connection_id = any(p_connection_ids)
      and o.status = 'paid' and o.analytics_included = true
      and o.ordered_at >= p_since and o.ordered_at < p_until
    group by o.connection_id, oi.external_product_id
  ),
  previous_sales as (
    select o.connection_id, oi.external_product_id,
      sum(oi.quantity * oi.unit_price)::numeric as revenue
    from public.orders o
    join public.order_items oi on oi.company_id = o.company_id and oi.order_id = o.id
    where o.company_id = p_company_id and o.connection_id = any(p_connection_ids)
      and o.status = 'paid' and o.analytics_included = true
      and o.ordered_at >= p_previous_since and o.ordered_at < p_since
    group by o.connection_id, oi.external_product_id
  ),
  base as (
    select p.connection_id, p.external_product_id, p.sku, p.title, p.provider,
      p.category_id, p.category_name, p.price, p.cost_price,
      i.available_quantity as stock, coalesce(cs.units, 0)::bigint as units,
      coalesce(cs.revenue, 0)::numeric as revenue, ps.revenue as previous_revenue
    from public.marketplace_products p
    left join public.marketplace_inventory i on i.company_id = p.company_id
      and i.connection_id = p.connection_id and i.external_product_id = p.external_product_id and i.active = true
    left join current_sales cs on cs.connection_id = p.connection_id and cs.external_product_id = p.external_product_id
    left join previous_sales ps on ps.connection_id = p.connection_id and ps.external_product_id = p.external_product_id
    where p.company_id = p_company_id and p.connection_id = any(p_connection_ids) and p.active = true
  ),
  enriched as (
    select b.*, sum(revenue) over() as total_revenue,
      case when cost_price is not null and price is not null and price > 0 then ((price - cost_price) / price) * 100 else null end as margin,
      case when previous_revenue is not null and previous_revenue > 0 then ((revenue - previous_revenue) / previous_revenue) * 100 else null end as trend
    from base b
  ),
  top_products as (
    select * from enriched order by revenue desc, title asc limit 8
  ),
  low_stock_products as (
    select * from enriched where stock is not null and stock <= 10 order by stock asc, revenue desc, title asc limit 100
  ),
  metrics as (
    select count(*) filter (where stock is not null and stock <= 10)::integer as low_stock_count,
      count(*) filter (where cost_price is null)::integer as without_cost_count
    from enriched
  )
  select jsonb_build_object(
    'topProducts', coalesce((select jsonb_agg(jsonb_build_object(
      'id', external_product_id, 'connectionId', connection_id, 'sku', sku, 'name', title, 'provider', provider,
      'categoryId', category_id, 'category', category_name, 'price', price, 'costPrice', cost_price, 'margin', margin,
      'stock', stock, 'revenue', revenue, 'units', units, 'trend', trend,
      'sharePct', case when total_revenue > 0 then (revenue / total_revenue) * 100 else 0 end
    )) from top_products), '[]'::jsonb),
    'lowStockProducts', coalesce((select jsonb_agg(jsonb_build_object(
      'id', external_product_id, 'connectionId', connection_id, 'sku', sku, 'name', title, 'provider', provider,
      'categoryId', category_id, 'category', category_name, 'price', price, 'costPrice', cost_price, 'margin', margin,
      'stock', stock, 'revenue', revenue, 'units', units, 'trend', trend,
      'sharePct', case when total_revenue > 0 then (revenue / total_revenue) * 100 else 0 end
    )) from low_stock_products), '[]'::jsonb),
    'metrics', jsonb_build_object(
      'lowStockCount', (select low_stock_count from metrics),
      'withoutCostCount', (select without_cost_count from metrics)
    )
  );
$$;

revoke all on function public.dashboard_report_products(text, uuid[], timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
grant execute on function public.dashboard_report_products(text, uuid[], timestamptz, timestamptz, timestamptz) to service_role;

commit;
