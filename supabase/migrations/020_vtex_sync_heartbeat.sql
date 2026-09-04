-- Heartbeat pra `integration_sync_runs` — sem isso, uma run travada em
-- `running` (function morta pela Vercel no meio de um `await`, sem cair em
-- nenhum catch/finally) ficava presa pra sempre, sem erro registrado e sem
-- forma de detectar de fora, exigindo UPDATE manual no banco.
--
-- Aditiva, idempotente, sem dado destrutivo. Backfill trata runs antigas
-- (sem heartbeat ainda) como "última atividade = última atualização
-- conhecida", pra reclaimStaleVtexRun() já funcionar em cima do histórico
-- existente sem tratar tudo como travado no mesmo instante.

begin;

alter table public.integration_sync_runs add column if not exists last_heartbeat_at timestamptz;

update public.integration_sync_runs
set last_heartbeat_at = coalesce(updated_at, started_at, created_at)
where last_heartbeat_at is null;

-- Índice só de performance pra reclaimStaleVtexRun() — a exclusividade da
-- transição running -> queued/failed continua garantida pelo próprio
-- UPDATE condicional em sync.ts (eq('status','running')), não por este
-- índice.
create index if not exists integration_sync_runs_running_heartbeat_idx
  on public.integration_sync_runs (company_id, connection_id, last_heartbeat_at)
  where status = 'running';

commit;
