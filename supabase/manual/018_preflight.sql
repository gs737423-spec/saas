-- Migration 018 pre-flight. READ ONLY: run before applying 018.
-- Any non-zero issue_count, missing required object, or pre-existing 018 object
-- is a STOP condition until the result is understood.

select required.object_name,
       to_regclass(required.object_name) is not null as present
from (values
  ('public.companies'),
  ('public.company_members'),
  ('public.platform_admins'),
  ('public.marketplace_connections'),
  ('public.marketplace_products'),
  ('public.marketplace_inventory'),
  ('public.sync_logs'),
  ('public.orders'),
  ('public.order_items'),
  ('public.support_tickets'),
  ('public.support_messages')
) as required(object_name)
order by required.object_name;

select required.function_signature,
       to_regprocedure(required.function_signature) is not null as present
from (values
  ('public.user_company_ids()'),
  ('public.is_platform_admin()'),
  ('public.check_rate_limit(text,integer,integer)')
) as required(function_signature)
order by required.function_signature;

select 'unsupported_or_null_company_member_roles' as check_name, count(*) as issue_count
from public.company_members
where role is null or role not in ('owner','admin','manager','member','viewer')
union all
select 'company_members_without_company', count(*)
from public.company_members cm left join public.companies c on c.id = cm.company_id
where c.id is null
union all
select 'company_members_without_auth_user', count(*)
from public.company_members cm left join auth.users u on u.id = cm.user_id
where u.id is null
union all
select 'duplicate_company_memberships', count(*)
from (
  select user_id, company_id from public.company_members
  group by user_id, company_id having count(*) > 1
) duplicates;

select c.relname as preexisting_018_relation,
       c.relkind,
       n.nspname as schema_name
from pg_catalog.pg_class c
join pg_catalog.pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'security_audit_logs',
    'security_audit_logs_company_created_idx',
    'security_audit_logs_actor_created_idx'
  )
order by c.relname;

select p.proname as preexisting_018_function,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as function_config
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'delete_company_if_empty';

select con.conname as preexisting_role_constraint,
       con.convalidated,
       pg_catalog.pg_get_constraintdef(con.oid) as definition
from pg_catalog.pg_constraint con
where con.conrelid = 'public.company_members'::regclass
  and con.conname = 'company_members_role_check';

select p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as current_function_config,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and (
    (p.proname = 'user_company_ids' and pg_catalog.pg_get_function_identity_arguments(p.oid) = '')
    or (p.proname = 'is_platform_admin' and pg_catalog.pg_get_function_identity_arguments(p.oid) = '')
    or (p.proname = 'check_rate_limit' and pg_catalog.pg_get_function_identity_arguments(p.oid) = 'text, integer, integer')
  )
order by p.proname;
