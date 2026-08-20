-- Migration 018 verification. READ ONLY: run immediately after applying 018.
-- `service_role_can_select` is observational, not a least-privilege failure:
-- Supabase projects may keep SELECT through the platform's privileged role
-- grants. The critical checks here are RLS enabled, anon/authenticated without
-- DML, and service_role able to INSERT backend audit events.

select to_regclass('public.security_audit_logs') is not null as audit_table_present,
       (select relrowsecurity from pg_catalog.pg_class where oid = 'public.security_audit_logs'::regclass) as rls_enabled,
       has_table_privilege('anon', 'public.security_audit_logs', 'SELECT,INSERT,UPDATE,DELETE') as anon_has_dml,
       has_table_privilege('authenticated', 'public.security_audit_logs', 'SELECT,INSERT,UPDATE,DELETE') as authenticated_has_dml,
       has_table_privilege('service_role', 'public.security_audit_logs', 'INSERT') as service_role_can_insert,
       has_table_privilege('service_role', 'public.security_audit_logs', 'SELECT') as service_role_can_select;

select a.attname as column_name,
       pg_catalog.format_type(a.atttypid, a.atttypmod) as data_type,
       a.attnotnull as not_null,
       pg_catalog.pg_get_expr(d.adbin, d.adrelid) as default_expression
from pg_catalog.pg_attribute a
left join pg_catalog.pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
where a.attrelid = 'public.security_audit_logs'::regclass
  and a.attnum > 0 and not a.attisdropped
order by a.attnum;

select con.conname,
       con.contype,
       con.convalidated,
       pg_catalog.pg_get_constraintdef(con.oid) as definition
from pg_catalog.pg_constraint con
where con.conrelid in ('public.security_audit_logs'::regclass, 'public.company_members'::regclass)
order by con.conrelid::regclass::text, con.conname;

select indexname, indexdef
from pg_catalog.pg_indexes
where schemaname = 'public'
  and indexname in ('security_audit_logs_company_created_idx','security_audit_logs_actor_created_idx')
order by indexname;

select p.proname,
       pg_catalog.pg_get_function_identity_arguments(p.oid) as arguments,
       p.prosecdef as security_definer,
       p.proconfig as function_config,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('service_role', p.oid, 'EXECUTE') as service_role_execute
from pg_catalog.pg_proc p
join pg_catalog.pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('user_company_ids','is_platform_admin','check_rate_limit','delete_company_if_empty')
order by p.proname, arguments;

select position('FOR UPDATE' in upper(pg_catalog.pg_get_functiondef('public.delete_company_if_empty(uuid,uuid,text)'::regprocedure))) > 0 as locks_company,
       position('PLATFORM_ADMINS' in upper(pg_catalog.pg_get_functiondef('public.delete_company_if_empty(uuid,uuid,text)'::regprocedure))) > 0 as checks_platform_admin,
       position('SECURITY_AUDIT_LOGS' in upper(pg_catalog.pg_get_functiondef('public.delete_company_if_empty(uuid,uuid,text)'::regprocedure))) > 0 as writes_audit_log;

select 'unsupported_or_null_company_member_roles' as check_name, count(*) as issue_count
from public.company_members
where role is null or role not in ('owner','admin','manager','member','viewer');
