-- READ-ONLY runtime audit for the climario VTEX connection.
select jsonb_build_object(
  'run', (
    select jsonb_build_object(
      'id', id, 'status', status, 'stage', stage,
      'heartbeat', last_heartbeat_at, 'updated', updated_at,
      'checkpoint', checkpoint - 'catalogSkuIds',
      'counts', counts, 'errors', errors
    )
    from public.integration_sync_runs
    where connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
    order by created_at desc limit 1
  ),
  'products', (
    select jsonb_build_object(
      'rows', count(*), 'sku_distinct', count(distinct external_product_id),
      'price_null', count(*) filter (where price is null),
      'price_zero', count(*) filter (where price = 0),
      'updated_min', min(updated_at), 'updated_max', max(updated_at)
    )
    from public.marketplace_products
    where company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
      and connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
  ),
  'inventory', (
    select jsonb_build_object(
      'rows', count(*), 'sku_distinct', count(distinct external_product_id),
      'qty_zero', count(*) filter (where available_quantity = 0),
      'qty_sum', coalesce(sum(available_quantity), 0),
      'last_sync_min', min(last_sync_at), 'last_sync_max', max(last_sync_at)
    )
    from public.marketplace_inventory
    where company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
      and connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
  ),
  'orders', (
    select jsonb_build_object(
      'rows', count(*), 'ordered_min', min(ordered_at),
      'ordered_max', max(ordered_at), 'updated_max', max(updated_at)
    )
    from public.orders
    where company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
      and connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
  ),
  'mappings', (
    select jsonb_agg(jsonb_build_object(
      'key', external_key, 'type', identifier_type,
      'value', identifier_value, 'name', external_marketplace_name,
      'canonical', canonical_channel, 'status', resolution_status,
      'source', resolution_source, 'last_seen', last_seen_at
    ) order by resolution_status, identifier_value)
    from public.vtex_channel_mappings
    where company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
      and connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
  )
) as audit;

-- Uma amostra por identifier pendente, preservando somente metadata de canal
-- e a lista de chaves do payload (sem itens, comprador ou credenciais).
with pending as (
  select identifier_type, identifier_value
  from public.vtex_channel_mappings
  where company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
    and connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
    and resolution_status <> 'resolved'
)
select p.identifier_type, p.identifier_value,
  sample.external_sales_channel,
  sample.channel_key,
  sample.channel_resolution_status,
  sample.channel_metadata,
  sample.payload_keys
from pending p
left join lateral (
  select osr.external_sales_channel, osr.channel_key, osr.channel_resolution_status,
    jsonb_build_object(
      'affiliateId', o.raw_payload->>'affiliateId',
      'salesChannel', o.raw_payload->>'salesChannel',
      'origin', o.raw_payload->>'origin',
      'marketplaceOrderId', o.raw_payload->>'marketplaceOrderId',
      'marketplaceServicesEndpoint', o.raw_payload->>'marketplaceServicesEndpoint',
      'marketplace', o.raw_payload->'marketplace'
    ) as channel_metadata,
    (select jsonb_agg(key order by key) from jsonb_object_keys(o.raw_payload) key) as payload_keys
  from public.order_source_refs osr
  join public.orders o on o.company_id = osr.company_id and o.id = osr.order_id
  where osr.company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
    and osr.connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
    and (
      (p.identifier_type = 'affiliate_id' and lower(btrim(osr.affiliate_id)) = p.identifier_value)
      or (p.identifier_type = 'sales_channel' and lower(btrim(osr.external_sales_channel)) = p.identifier_value)
    )
  order by osr.last_seen_at desc limit 1
) sample on true
order by p.identifier_type, p.identifier_value;

-- Prova se cada affiliate pendente possui uma associacao deterministica com
-- salesChannel nos pedidos reais (sem atribuir significado ao codigo).
select lower(btrim(osr.affiliate_id)) as affiliate_id,
  lower(btrim(osr.external_sales_channel)) as sales_channel,
  count(*) as order_count
from public.order_source_refs osr
join public.vtex_channel_mappings vcm
  on vcm.company_id = osr.company_id
 and vcm.connection_id = osr.connection_id
 and vcm.identifier_type = 'affiliate_id'
 and vcm.identifier_value = lower(btrim(osr.affiliate_id))
 and vcm.resolution_status <> 'resolved'
where osr.company_id = '935183c9-85f4-4000-808b-8eb6a26934f5'
  and osr.connection_id = 'fbbdf7ca-e502-43ef-a0ba-81ae9b53817e'
group by lower(btrim(osr.affiliate_id)), lower(btrim(osr.external_sales_channel))
order by affiliate_id, order_count desc;
