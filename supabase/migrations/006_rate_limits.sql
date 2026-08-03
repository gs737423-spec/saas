-- Rate limit real (não é só um comentário de intenção) pras nossas rotas —
-- login em si (Supabase Auth /auth/v1/token) não passa pelo nosso código,
-- esse limite é configurado direto no painel Supabase (Authentication →
-- Rate Limits), não dá pra fazer aqui. Isto aqui cobre as rotas que O
-- NOSSO código expõe: convite de admin, criar empresa, conectar/sincronizar
-- marketplace — endpoints que, se alguém conseguir um token válido, ainda
-- não deveriam poder chamar em loop.

create table if not exists rate_limits (
  key text primary key,
  count integer not null default 1,
  window_start timestamptz not null default now()
);

-- Upsert atômico: uma única instrução, sem race condition entre "ler contagem"
-- e "escrever contagem" (duas requisições simultâneas não conseguem burlar
-- o limite lendo o mesmo valor antigo).
create or replace function check_rate_limit(p_key text, p_max int, p_window_seconds int)
returns boolean as $$
declare
  v_count int;
begin
  insert into rate_limits (key, count, window_start)
  values (p_key, 1, now())
  on conflict (key) do update set
    count = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval then 1
      else rate_limits.count + 1
    end,
    window_start = case
      when rate_limits.window_start < now() - (p_window_seconds || ' seconds')::interval then now()
      else rate_limits.window_start
    end
  returning count into v_count;

  return v_count <= p_max;
end;
$$ language plpgsql security definer set search_path = public;

-- RLS: ninguém além do service_role toca aqui (nem select) — é estado
-- interno de controle, não dado de negócio.
alter table rate_limits enable row level security;
