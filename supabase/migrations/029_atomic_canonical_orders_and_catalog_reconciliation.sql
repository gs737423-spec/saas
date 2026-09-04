begin;

create or replace function public.persist_canonical_order_atomic(
  p_order jsonb,
  p_source jsonb,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_company_id text := nullif(p_order->>'company_id', '');
  v_connection_id uuid := nullif(p_order->>'connection_id', '')::uuid;
  v_provider text := nullif(p_order->>'provider', '');
  v_canonical_key text := nullif(p_order->>'canonical_order_key', '');
  v_external_order_id text := nullif(p_order->>'external_order_id', '');
  v_sales_channel text := nullif(p_order->>'sales_channel', '');
  v_existing_id uuid;
  v_existing_provider text;
  v_source_order_id uuid;
  v_order_id uuid;
  v_superseded_order_id uuid;
  v_inserted boolean := false;
  v_writer_wins boolean := true;
  v_incoming_direct boolean;
  v_existing_direct boolean := false;
begin
  if v_company_id is null or v_connection_id is null or v_provider is null
     or v_canonical_key is null or v_external_order_id is null
     or v_sales_channel is null or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_canonical_order_payload';
  end if;

  -- Serializes competing VTEX/direct-provider writers for the same tenant and
  -- canonical order for the duration of this transaction.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_company_id || ':' || v_canonical_key, 0)
  );

  insert into public.sales_channels (
    company_id, canonical_key, display_name, channel_type, status
  ) values (
    v_company_id,
    v_sales_channel,
    coalesce(nullif(p_order->>'sales_channel_display_name', ''), v_sales_channel),
    coalesce(nullif(p_order->>'sales_channel_type', ''), 'marketplace'),
    'active'
  ) on conflict (company_id, canonical_key) do nothing;

  select id, provider into v_existing_id, v_existing_provider
  from public.orders
  where company_id = v_company_id and canonical_order_key = v_canonical_key
  for update;

  select order_id into v_source_order_id
  from public.order_source_refs
  where company_id = v_company_id
    and connection_id = v_connection_id
    and external_order_id = v_external_order_id
  for update;

  if v_existing_id is null and v_source_order_id is not null then
    select provider into v_existing_provider
    from public.orders
    where id = v_source_order_id and company_id = v_company_id
    for update;
  end if;

  v_order_id := coalesce(v_existing_id, v_source_order_id);
  v_superseded_order_id := case
    when v_existing_id is not null and v_source_order_id is not null and v_existing_id <> v_source_order_id
      then v_source_order_id
    else null
  end;
  v_incoming_direct := v_provider <> 'vtex';
  v_existing_direct := coalesce(v_existing_provider <> 'vtex', false);

  if v_order_id is null then
    insert into public.orders (
      company_id, connection_id, provider, external_order_id,
      canonical_order_key, sales_channel, source_account, status,
      total_amount, fee_amount, fee_status, refund_amount, refund_status,
      refund_updated_at, currency, buyer_external_id, ordered_at,
      source_updated_at, analytics_included, unavailable_reason,
      channel_resolution_status, raw_payload
    ) values (
      v_company_id, v_connection_id, v_provider, v_external_order_id,
      v_canonical_key, v_sales_channel, nullif(p_order->>'source_account', ''), p_order->>'status',
      (p_order->>'total_amount')::numeric, nullif(p_order->>'fee_amount', '')::numeric,
      coalesce(nullif(p_order->>'fee_status', ''), 'unknown'),
      nullif(p_order->>'refund_amount', '')::numeric,
      coalesce(nullif(p_order->>'refund_status', ''), 'unknown'),
      nullif(p_order->>'refund_updated_at', '')::timestamptz,
      nullif(p_order->>'currency', ''), null, (p_order->>'ordered_at')::timestamptz,
      nullif(p_order->>'source_updated_at', '')::timestamptz,
      coalesce((p_order->>'analytics_included')::boolean, true),
      nullif(p_order->>'unavailable_reason', ''),
      coalesce(nullif(p_order->>'channel_resolution_status', ''), 'resolved'), null
    ) returning id into v_order_id;
    v_inserted := true;
  elsif not v_existing_direct or v_incoming_direct then
    update public.orders set
      connection_id = v_connection_id,
      provider = v_provider,
      external_order_id = v_external_order_id,
      canonical_order_key = v_canonical_key,
      sales_channel = v_sales_channel,
      source_account = nullif(p_order->>'source_account', ''),
      status = p_order->>'status',
      total_amount = (p_order->>'total_amount')::numeric,
      fee_amount = nullif(p_order->>'fee_amount', '')::numeric,
      fee_status = coalesce(nullif(p_order->>'fee_status', ''), 'unknown'),
      refund_amount = nullif(p_order->>'refund_amount', '')::numeric,
      refund_status = coalesce(nullif(p_order->>'refund_status', ''), 'unknown'),
      refund_updated_at = nullif(p_order->>'refund_updated_at', '')::timestamptz,
      currency = nullif(p_order->>'currency', ''),
      buyer_external_id = null,
      ordered_at = (p_order->>'ordered_at')::timestamptz,
      source_updated_at = nullif(p_order->>'source_updated_at', '')::timestamptz,
      analytics_included = coalesce((p_order->>'analytics_included')::boolean, true),
      unavailable_reason = nullif(p_order->>'unavailable_reason', ''),
      channel_resolution_status = coalesce(nullif(p_order->>'channel_resolution_status', ''), 'resolved'),
      raw_payload = null
    where id = v_order_id and company_id = v_company_id;
  else
    v_writer_wins := false;
  end if;

  if v_superseded_order_id is not null then
    update public.orders set
      analytics_included = false,
      unavailable_reason = 'DUPLICATE_CANONICAL_RECONCILED'
    where id = v_superseded_order_id and company_id = v_company_id;
  end if;

  insert into public.order_source_refs (
    company_id, order_id, connection_id, provider, source_account,
    external_order_id, marketplace_order_id, affiliate_id,
    external_sales_channel, external_marketplace_name, channel_key,
    channel_resolution_status, canonical_order_key, last_seen_at
  ) values (
    v_company_id, v_order_id, v_connection_id, v_provider,
    nullif(p_source->>'source_account', ''), v_external_order_id,
    nullif(p_source->>'marketplace_order_id', ''), nullif(p_source->>'affiliate_id', ''),
    nullif(p_source->>'external_sales_channel', ''), nullif(p_source->>'external_marketplace_name', ''),
    v_sales_channel, coalesce(nullif(p_source->>'channel_resolution_status', ''), 'resolved'),
    v_canonical_key, pg_catalog.now()
  ) on conflict (company_id, connection_id, external_order_id) do update set
    order_id = excluded.order_id,
    provider = excluded.provider,
    source_account = excluded.source_account,
    marketplace_order_id = excluded.marketplace_order_id,
    affiliate_id = excluded.affiliate_id,
    external_sales_channel = excluded.external_sales_channel,
    external_marketplace_name = excluded.external_marketplace_name,
    channel_key = excluded.channel_key,
    channel_resolution_status = excluded.channel_resolution_status,
    canonical_order_key = excluded.canonical_order_key,
    last_seen_at = excluded.last_seen_at;

  if v_writer_wins then
    delete from public.order_items
    where company_id = v_company_id and order_id = v_order_id;

    insert into public.order_items (
      company_id, order_id, external_product_id, sku, title, quantity, unit_price
    )
    select
      v_company_id, v_order_id, nullif(item->>'external_product_id', ''),
      nullif(item->>'sku', ''), item->>'title',
      (item->>'quantity')::integer, (item->>'unit_price')::numeric
    from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;
  end if;

  return jsonb_build_object(
    'orderId', v_order_id,
    'inserted', v_inserted,
    'deduplicated', (v_existing_id is not null or v_source_order_id is not null)
  );
end;
$$;

create or replace function public.reconcile_catalog_rows_atomic(
  p_company_id text,
  p_connection_id uuid,
  p_cycle_started_at timestamptz
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_company_id is null or p_connection_id is null or p_cycle_started_at is null then
    raise exception 'invalid_catalog_reconciliation_payload';
  end if;

  update public.marketplace_products set active = false
  where company_id = p_company_id and connection_id = p_connection_id and active = true
    and (last_seen_at is null or last_seen_at < p_cycle_started_at);

  update public.marketplace_inventory set active = false
  where company_id = p_company_id and connection_id = p_connection_id and active = true
    and (last_seen_at is null or last_seen_at < p_cycle_started_at);
end;
$$;

revoke all on function public.persist_canonical_order_atomic(jsonb, jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.persist_canonical_order_atomic(jsonb, jsonb, jsonb) to service_role;
revoke all on function public.reconcile_catalog_rows_atomic(text, uuid, timestamptz) from public, anon, authenticated;
grant execute on function public.reconcile_catalog_rows_atomic(text, uuid, timestamptz) to service_role;

commit;
