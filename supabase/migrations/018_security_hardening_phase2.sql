-- Security hardening phase 2. CREATED LOCALLY; do not apply without review.
begin;

-- SECURITY DEFINER helpers used by RLS must resolve built-ins before public
-- objects and expose only the minimum roles required by their callers.
alter function public.user_company_ids() set search_path = pg_catalog, public;
revoke all on function public.user_company_ids() from public, anon;
grant execute on function public.user_company_ids() to authenticated, service_role;

alter function public.is_platform_admin() set search_path = pg_catalog, public;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated, service_role;

alter function public.check_rate_limit(text, integer, integer) set search_path = pg_catalog, public;

create table if not exists public.security_audit_logs (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(),
  request_id text not null check (char_length(request_id) between 8 and 128), actor_user_id uuid,
  company_id uuid, action text not null check (char_length(action) between 1 and 100),
  target_type text, target_id text,
  metadata jsonb not null default '{}'::jsonb check (pg_column_size(metadata) <= 8192)
);
alter table public.security_audit_logs enable row level security;
create index if not exists security_audit_logs_company_created_idx on public.security_audit_logs (company_id, created_at desc);
create index if not exists security_audit_logs_actor_created_idx on public.security_audit_logs (actor_user_id, created_at desc);
revoke all on table public.security_audit_logs from anon, authenticated;
grant insert on table public.security_audit_logs to service_role;

-- The rate-limit RPC is a privileged mutation. Public execution would let an
-- untrusted caller consume another actor's counters and cause targeted DoS.
revoke all on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;

do $$ begin
  if exists (select 1 from public.company_members where role is null or role not in ('owner','admin','manager','member','viewer')) then
    raise exception 'Unsupported company_members.role values exist; manual remediation required';
  end if;
end $$;
alter table public.company_members drop constraint if exists company_members_role_check;
alter table public.company_members add constraint company_members_role_check check (role in ('owner','admin','manager','member','viewer')) not valid;
alter table public.company_members validate constraint company_members_role_check;

create or replace function public.delete_company_if_empty(p_company_id uuid, p_actor_user_id uuid, p_request_id text)
returns jsonb language plpgsql security definer set search_path = pg_catalog, public as $$
declare v_counts jsonb; v_company public.companies%rowtype;
begin
  if p_request_id is null or char_length(p_request_id) not between 8 and 128 then raise exception 'invalid request id'; end if;
  if not exists (select 1 from public.platform_admins where user_id = p_actor_user_id) then raise exception 'platform admin required'; end if;
  select * into v_company from public.companies where id = p_company_id for update;
  if not found then return jsonb_build_object('status','not_found'); end if;
  select jsonb_build_object(
    'connections',(select count(*) from public.marketplace_connections where company_id=p_company_id::text),
    'products',(select count(*) from public.marketplace_products where company_id=p_company_id::text),
    'inventory',(select count(*) from public.marketplace_inventory where company_id=p_company_id::text),
    'syncLogs',(select count(*) from public.sync_logs where company_id=p_company_id::text),
    'orders',(select count(*) from public.orders where company_id=p_company_id::text),
    'orderItems',(select count(*) from public.order_items where company_id=p_company_id::text),
    'supportTickets',(select count(*) from public.support_tickets where company_id=p_company_id),
    'supportMessages',(select count(*) from public.support_messages where company_id=p_company_id),
    'storedLogo',case when v_company.logo_url is null then 0 else 1 end
  ) into v_counts;
  insert into public.security_audit_logs(request_id,actor_user_id,company_id,action,target_type,target_id)
    values(p_request_id,p_actor_user_id,p_company_id,'company.delete_attempt','company',p_company_id::text);
  if exists (select 1 from jsonb_each_text(v_counts) item where item.value::bigint > 0) then
    insert into public.security_audit_logs(request_id,actor_user_id,company_id,action,target_type,target_id,metadata)
      values(p_request_id,p_actor_user_id,p_company_id,'company.delete_blocked','company',p_company_id::text,v_counts);
    return jsonb_build_object('status','blocked','dependencies',v_counts);
  end if;
  delete from public.companies where id=p_company_id;
  insert into public.security_audit_logs(request_id,actor_user_id,company_id,action,target_type,target_id)
    values(p_request_id,p_actor_user_id,p_company_id,'company.delete','company',p_company_id::text);
  return jsonb_build_object('status','deleted');
end; $$;
revoke all on function public.delete_company_if_empty(uuid,uuid,text) from public, anon, authenticated;
grant execute on function public.delete_company_if_empty(uuid,uuid,text) to service_role;

commit;
