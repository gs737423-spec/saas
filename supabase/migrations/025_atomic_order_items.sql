begin;

create or replace function public.replace_order_items_atomic(
  p_company_id text,
  p_order_id uuid,
  p_items jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_company_id is null or p_order_id is null or jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then
    raise exception 'invalid_order_items_payload';
  end if;

  if not exists (
    select 1 from public.orders
    where id = p_order_id and company_id = p_company_id
  ) then
    raise exception 'order_not_found_for_company';
  end if;

  delete from public.order_items
  where company_id = p_company_id and order_id = p_order_id;

  insert into public.order_items (
    company_id, order_id, external_product_id, sku, title, quantity, unit_price
  )
  select
    p_company_id,
    p_order_id,
    nullif(item->>'external_product_id', ''),
    nullif(item->>'sku', ''),
    item->>'title',
    (item->>'quantity')::integer,
    (item->>'unit_price')::numeric
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) as item;
end;
$$;

revoke all on function public.replace_order_items_atomic(text, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.replace_order_items_atomic(text, uuid, jsonb) to service_role;

commit;
