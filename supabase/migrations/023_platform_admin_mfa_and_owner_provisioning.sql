-- Atomic first-owner provisioning. Applied and verified in production on 2026-08-20.
begin;

create or replace function public.provision_company_with_owner(
  p_company jsonb,
  p_owner_user_id uuid,
  p_actor_user_id uuid,
  p_request_id text
) returns public.companies
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_company public.companies%rowtype;
begin
  if not exists (select 1 from public.platform_admins where user_id = p_actor_user_id) then
    raise exception 'platform admin required';
  end if;
  if not exists (select 1 from auth.users where id = p_owner_user_id) then
    raise exception 'owner user required';
  end if;
  if exists (select 1 from public.platform_admins where user_id = p_owner_user_id) then
    raise exception 'platform admin cannot be tenant owner';
  end if;
  if p_request_id is null or char_length(p_request_id) not between 8 and 128 then
    raise exception 'invalid request id';
  end if;

  insert into public.companies (name, contact_email, contact_phone, notes, cnpj, whatsapp, website, receita_data)
  values (
    nullif(btrim(p_company->>'name'), ''), nullif(btrim(p_company->>'contact_email'), ''),
    nullif(btrim(p_company->>'contact_phone'), ''), nullif(btrim(p_company->>'notes'), ''),
    nullif(btrim(p_company->>'cnpj'), ''), nullif(btrim(p_company->>'whatsapp'), ''),
    nullif(btrim(p_company->>'website'), ''), p_company->'receita_data'
  ) returning * into v_company;

  insert into public.company_members (user_id, company_id, role)
  values (p_owner_user_id, v_company.id, 'owner');

  insert into public.security_audit_logs (request_id, actor_user_id, company_id, action, target_type, target_id, metadata)
  values (p_request_id, p_actor_user_id, v_company.id, 'company.provision', 'company', v_company.id::text,
    jsonb_build_object('ownerUserId', p_owner_user_id));
  return v_company;
end;
$$;

revoke all on function public.provision_company_with_owner(jsonb, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.provision_company_with_owner(jsonb, uuid, uuid, text) to service_role;

commit;
