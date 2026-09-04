begin;

-- Catálogos grandes não podem ser agregados e transferidos integralmente a
-- cada navegação. Estas funções são somente-leitura, exigem empresa e
-- conexões já autorizadas pelo endpoint e retornam uma página pequena junto
-- com os metadados necessários para a interface.

create index if not exists orders_company_connection_analytics_ordered_idx
  on public.orders (company_id, connection_id, ordered_at)
  where status = 'paid' and analytics_included = true;

create index if not exists order_items_company_order_product_idx
  on public.order_items (company_id, order_id, external_product_id);

create or replace function public.dashboard_products_page(
  p_company_id text,
  p_connection_ids uuid[],
  p_since timestamptz,
  p_until timestamptz,
  p_previous_since timestamptz,
  p_page integer default 1,
  p_page_size integer default 100,
  p_search text default null,
  p_providers text[] default null,
  p_category_keys text[] default null,
  p_sort text default 'revenue',
  p_sort_dir text default 'desc'
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with
  settings as (
    select greatest(1, coalesce(p_page, 1)) as page_number,
           least(100, greatest(1, coalesce(p_page_size, 100))) as page_size,
           lower(coalesce(nullif(trim(p_search), ''), '')) as search_term,
           case when p_sort in ('sku', 'name', 'marketplace', 'units', 'stock', 'revenue', 'margin', 'trend') then p_sort else 'revenue' end as sort_key,
           case when lower(p_sort_dir) = 'asc' then 'asc' else 'desc' end as sort_dir
  ),
  current_sales as (
    select o.connection_id, oi.external_product_id,
      sum(oi.quantity)::bigint as units,
      sum(oi.quantity * oi.unit_price)::numeric as revenue
    from public.orders o
    join public.order_items oi on oi.company_id = o.company_id and oi.order_id = o.id
    where o.company_id = p_company_id
      and o.connection_id = any(p_connection_ids)
      and o.status = 'paid' and o.analytics_included = true
      and o.ordered_at >= p_since and o.ordered_at < p_until
    group by o.connection_id, oi.external_product_id
  ),
  previous_sales as (
    select o.connection_id, oi.external_product_id,
      sum(oi.quantity * oi.unit_price)::numeric as revenue
    from public.orders o
    join public.order_items oi on oi.company_id = o.company_id and oi.order_id = o.id
    where o.company_id = p_company_id
      and o.connection_id = any(p_connection_ids)
      and o.status = 'paid' and o.analytics_included = true
      and o.ordered_at >= p_previous_since and o.ordered_at < p_since
    group by o.connection_id, oi.external_product_id
  ),
  base as (
    select
      p.connection_id, p.external_product_id, p.sku, p.title, p.provider,
      p.category_id, p.category_name, p.price, p.cost_price,
      i.available_quantity as stock,
      coalesce(cs.units, 0)::bigint as units,
      coalesce(cs.revenue, 0)::numeric as revenue,
      ps.revenue as previous_revenue,
      case when p.category_id is not null and btrim(p.category_id) <> '' then 'id:' || btrim(p.category_id)
           when p.category_name is not null and btrim(p.category_name) <> '' then 'name:' || lower(btrim(p.category_name))
           else 'uncategorised' end as category_key
    from public.marketplace_products p
    left join public.marketplace_inventory i
      on i.company_id = p.company_id and i.connection_id = p.connection_id
      and i.external_product_id = p.external_product_id and i.active = true
    left join current_sales cs on cs.connection_id = p.connection_id and cs.external_product_id = p.external_product_id
    left join previous_sales ps on ps.connection_id = p.connection_id and ps.external_product_id = p.external_product_id
    where p.company_id = p_company_id and p.connection_id = any(p_connection_ids) and p.active = true
  ),
  filtered as (
    select b.*,
      case when b.cost_price is not null and b.price is not null and b.price > 0 then ((b.price - b.cost_price) / b.price) * 100 else null end as margin,
      case when b.previous_revenue is not null and b.previous_revenue > 0 then ((b.revenue - b.previous_revenue) / b.previous_revenue) * 100 else null end as trend
    from base b cross join settings s
    where (s.search_term = '' or lower(coalesce(b.title, '')) like '%' || s.search_term || '%'
       or lower(coalesce(b.sku, '')) like '%' || s.search_term || '%'
       or lower(coalesce(b.category_name, '')) like '%' || s.search_term || '%')
      and (coalesce(cardinality(p_providers), 0) = 0 or b.provider = any(p_providers))
      and (coalesce(cardinality(p_category_keys), 0) = 0 or b.category_key = any(p_category_keys))
  ),
  category_options as (
    select category_key as key,
      coalesce(nullif(btrim(category_name), ''), 'Sem categoria') as label
    from base
    group by category_key, coalesce(nullif(btrim(category_name), ''), 'Sem categoria')
  ),
  summary as (
    select count(*)::integer as total_rows,
      count(*) filter (where coalesce(stock, 0) > 0)::integer as with_stock,
      avg(margin) as average_margin,
      coalesce(sum(units), 0)::bigint as total_units,
      coalesce(sum(revenue), 0)::numeric as total_revenue
    from filtered
  ),
  best_seller as (
    select title, sku, units, trend from filtered
    order by units desc, revenue desc, title asc limit 1
  ),
  lowest_turn as (
    select title, sku, units, trend from filtered
    order by units asc, revenue asc, title asc limit 1
  ),
  ranked as (
    select f.*, count(*) over() as total_rows, sum(revenue) over() as total_revenue
    from filtered f
  ),
  page_rows as (
    select r.*
    from ranked r cross join settings s
    order by
      case when s.sort_key in ('sku', 'name', 'marketplace') and s.sort_dir = 'asc' then
        case s.sort_key when 'sku' then lower(coalesce(r.sku, '')) when 'name' then lower(r.title) else r.provider end end asc nulls last,
      case when s.sort_key in ('sku', 'name', 'marketplace') and s.sort_dir = 'desc' then
        case s.sort_key when 'sku' then lower(coalesce(r.sku, '')) when 'name' then lower(r.title) else r.provider end end desc nulls last,
      case when s.sort_key in ('units', 'stock', 'revenue', 'margin', 'trend') and s.sort_dir = 'asc' then
        case s.sort_key when 'units' then r.units::numeric when 'stock' then r.stock::numeric when 'revenue' then r.revenue when 'margin' then r.margin when 'trend' then r.trend end end asc nulls last,
      case when s.sort_key in ('units', 'stock', 'revenue', 'margin', 'trend') and s.sort_dir = 'desc' then
        case s.sort_key when 'units' then r.units::numeric when 'stock' then r.stock::numeric when 'revenue' then r.revenue when 'margin' then r.margin when 'trend' then r.trend end end desc nulls last,
      r.external_product_id asc
    limit (select page_size from settings)
    offset ((select page_number - 1 from settings) * (select page_size from settings))
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'id', external_product_id, 'connectionId', connection_id, 'sku', sku,
      'name', title, 'provider', provider, 'categoryId', category_id,
      'category', category_name, 'price', price, 'costPrice', cost_price,
      'margin', margin, 'stock', stock, 'revenue', revenue, 'units', units,
      'trend', trend, 'sharePct', case when total_revenue > 0 then (revenue / total_revenue) * 100 else 0 end
    )) from page_rows), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'page', (select page_number from settings), 'pageSize', (select page_size from settings),
      'totalRows', (select total_rows from summary),
      'totalPages', greatest(1, ceil((select total_rows from summary)::numeric / (select page_size from settings))::integer)
    ),
    'categoryOptions', coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label) order by label) from category_options), '[]'::jsonb),
    'metrics', jsonb_build_object(
      'active', (select total_rows from summary), 'withStock', (select with_stock from summary),
      'averageMargin', (select average_margin from summary), 'totalUnits', (select total_units from summary),
      'totalRevenue', (select total_revenue from summary),
      'bestSeller', (select jsonb_build_object('name', title, 'sku', sku, 'units', units, 'trend', trend) from best_seller),
      'lowestTurn', (select jsonb_build_object('name', title, 'sku', sku, 'units', units, 'trend', trend) from lowest_turn)
    )
  );
$$;

create or replace function public.dashboard_inventory_page(
  p_company_id text,
  p_connection_ids uuid[],
  p_since timestamptz,
  p_page integer default 1,
  p_page_size integer default 100,
  p_abc text[] default null,
  p_providers text[] default null,
  p_category_keys text[] default null,
  p_only_critical boolean default false,
  p_only_stalled boolean default false,
  p_only_low_coverage boolean default false,
  p_only_excess boolean default false,
  p_sort text default 'revenue'
)
returns jsonb
language sql
security definer
set search_path = ''
as $$
  with
  settings as (
    select greatest(1, coalesce(p_page, 1)) as page_number,
      least(100, greatest(1, coalesce(p_page_size, 100))) as page_size,
      case when p_sort in ('revenue', 'stock', 'units30d', 'coverage') then p_sort else 'revenue' end as sort_key
  ),
  sales as (
    select o.connection_id, oi.external_product_id,
      sum(oi.quantity)::bigint as sold_quantity,
      sum(oi.quantity * oi.unit_price)::numeric as revenue
    from public.orders o
    join public.order_items oi on oi.company_id = o.company_id and oi.order_id = o.id
    where o.company_id = p_company_id and o.connection_id = any(p_connection_ids)
      and o.status = 'paid' and o.analytics_included = true
      and o.ordered_at >= p_since
    group by o.connection_id, oi.external_product_id
  ),
  base as (
    select i.connection_id, i.external_product_id, i.sku, i.title, i.provider,
      i.available_quantity, i.last_sync_at, p.price, p.status, p.category_id, p.category_name,
      coalesce(s.sold_quantity, 0)::bigint as sold_quantity, coalesce(s.revenue, 0)::numeric as revenue,
      case when p.category_id is not null and btrim(p.category_id) <> '' then 'id:' || btrim(p.category_id)
           when p.category_name is not null and btrim(p.category_name) <> '' then 'name:' || lower(btrim(p.category_name))
           else 'uncategorised' end as category_key
    from public.marketplace_inventory i
    left join public.marketplace_products p
      on p.company_id = i.company_id and p.connection_id = i.connection_id
      and p.external_product_id = i.external_product_id and p.active = true
    left join sales s on s.connection_id = i.connection_id and s.external_product_id = i.external_product_id
    where i.company_id = p_company_id and i.connection_id = any(p_connection_ids) and i.active = true
  ),
  with_coverage as (
    select b.*, case when b.available_quantity is not null and b.sold_quantity > 0
      then b.available_quantity::numeric / (b.sold_quantity::numeric / 30) else null end as coverage_days
    from base b
  ),
  with_abc_window as (
    select c.*, sum(c.revenue) filter (where c.revenue > 0) over() as abc_total,
      sum(case when c.revenue > 0 then c.revenue else 0 end) over (order by c.revenue desc, c.connection_id, c.external_product_id rows between unbounded preceding and current row) as abc_cumulative
    from with_coverage c
  ),
  classified as (
    select w.*, case when w.revenue <= 0 or w.abc_total <= 0 then null
      when w.abc_cumulative / w.abc_total <= .80 then 'A'
      when w.abc_cumulative / w.abc_total <= .95 then 'B' else 'C' end as abc_class
    from with_abc_window w
  ),
  filtered as (
    select c.* from classified c
    where (coalesce(cardinality(p_abc), 0) = 0 or c.abc_class = any(p_abc))
      and (coalesce(cardinality(p_providers), 0) = 0 or c.provider = any(p_providers))
      and (coalesce(cardinality(p_category_keys), 0) = 0 or c.category_key = any(p_category_keys))
      and (not p_only_critical or (c.coverage_days is not null and c.coverage_days < 7))
      and (not p_only_low_coverage or (c.coverage_days is not null and c.coverage_days < 15))
      and (not p_only_excess or (c.coverage_days is not null and c.coverage_days > 45))
      and (not p_only_stalled or c.sold_quantity <= 0 or c.coverage_days >= 45)
  ),
  category_options as (
    select category_key as key, coalesce(nullif(btrim(category_name), ''), 'Sem categoria') as label
    from base group by category_key, coalesce(nullif(btrim(category_name), ''), 'Sem categoria')
  ),
  category_stats as (
    select category_key as key, coalesce(nullif(btrim(category_name), ''), 'Sem categoria') as label, sum(revenue) as revenue
    from base group by category_key, coalesce(nullif(btrim(category_name), ''), 'Sem categoria')
  ),
  totals as (
    select count(*)::integer as total_items,
      count(*) filter (where price is not null and available_quantity is not null)::integer as priced_items,
      coalesce(sum(case when price is not null and available_quantity is not null then price * available_quantity else 0 end), 0)::numeric as total_value,
      count(*) filter (where sold_quantity <= 0 or coverage_days >= 45)::integer as stalled_count,
      count(*) filter (where abc_class = 'A')::integer as curva_a_count,
      coalesce(sum(revenue), 0)::numeric as total_revenue
    from classified
  ),
  ranked as (
    select f.*, count(*) over() as total_rows from filtered f
  ),
  page_rows as (
    select r.* from ranked r cross join settings s
    order by
      case when s.sort_key = 'revenue' then r.revenue end desc nulls last,
      case when s.sort_key = 'stock' then r.available_quantity end desc nulls last,
      case when s.sort_key = 'units30d' then r.sold_quantity end desc nulls last,
      case when s.sort_key = 'coverage' then r.coverage_days end desc nulls last,
      r.external_product_id asc
    limit (select page_size from settings)
    offset ((select page_number - 1 from settings) * (select page_size from settings))
  )
  select jsonb_build_object(
    'items', coalesce((select jsonb_agg(jsonb_build_object(
      'sku', sku, 'title', title, 'provider', provider, 'categoryId', category_id,
      'categoryName', category_name, 'availableQuantity', available_quantity, 'price', price,
      'status', status, 'soldQuantity', sold_quantity, 'revenue30d', revenue,
      'turnoverRate', case when available_quantity is not null and available_quantity > 0 then sold_quantity::numeric / available_quantity else null end,
      'abcClass', abc_class, 'lastSyncAt', last_sync_at
    )) from page_rows), '[]'::jsonb),
    'pagination', jsonb_build_object(
      'page', (select page_number from settings), 'pageSize', (select page_size from settings),
      'totalRows', (select count(*) from filtered),
      'totalPages', greatest(1, ceil((select count(*) from filtered)::numeric / (select page_size from settings))::integer)
    ),
    'categoryOptions', coalesce((select jsonb_agg(jsonb_build_object('key', key, 'label', label) order by label) from category_options), '[]'::jsonb),
    'metrics', jsonb_build_object(
      'totalItems', (select total_items from totals), 'pricedItems', (select priced_items from totals),
      'totalValue', (select total_value from totals), 'stalledCount', (select stalled_count from totals),
      'curvaACount', (select curva_a_count from totals), 'totalRevenue', (select total_revenue from totals),
      'topCategory', (select jsonb_build_object('key', key, 'label', label, 'revenue', revenue) from category_stats order by revenue desc, label asc limit 1)
    )
  );
$$;

revoke all on function public.dashboard_products_page(text, uuid[], timestamptz, timestamptz, timestamptz, integer, integer, text, text[], text[], text, text) from public, anon, authenticated;
grant execute on function public.dashboard_products_page(text, uuid[], timestamptz, timestamptz, timestamptz, integer, integer, text, text[], text[], text, text) to service_role;
revoke all on function public.dashboard_inventory_page(text, uuid[], timestamptz, integer, integer, text[], text[], text[], boolean, boolean, boolean, boolean, text) from public, anon, authenticated;
grant execute on function public.dashboard_inventory_page(text, uuid[], timestamptz, integer, integer, text[], text[], text[], boolean, boolean, boolean, boolean, text) to service_role;

commit;
