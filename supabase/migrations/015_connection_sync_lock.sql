-- Trava atômica contra sync duplicado simultâneo (2 abas, duplo clique,
-- reload no meio do sync) — sem isso, dois syncs da mesma empresa rodam em
-- paralelo e conflitam nos upserts de marketplace_products/orders.
alter table marketplace_connections add column if not exists sync_started_at timestamptz;
