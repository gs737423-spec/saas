# Marketplace Integrations — Architecture

Status (atualizado 2026-08-12): **Mercado Livre e Shopee com OAuth + sync completo real** (produtos, estoque, pedidos, auto-refresh de token). Sync recorrente automático via Vercel Cron (`api/cron/sync-all.ts`, diário) além do botão manual. Amazon, Magalu, Loja Própria continuam só como providers no schema/types — sem OAuth/sync implementado, mostram "não implementado" na UI (nunca sucesso falso).

## Stack

- Frontend: Vite + React (unchanged, no migration to Next.js).
- Backend: Vercel Serverless Functions under `api/**`. Vite does not serve these — Vercel builds each `api/*.ts` as an independent function, separate from the `tsc && vite build` pipeline that only type-checks `src/`.
- Database: Supabase Postgres. Access from serverless functions only, via the **service role key** (bypasses RLS). The anon/public key is never used for these tables — there is no client-side Supabase usage for integration data.
- Scheduled/recurring sync: **implementado via Vercel Cron** (`api/cron/sync-all.ts`, `vercel.json` → `crons`, diário às 06:00 UTC), não Trigger.dev — mais simples pro volume atual, sem infra extra. Itera toda `marketplace_connections` com `status='connected'`, chama o sync de cada provider sequencialmente, isola falha por conexão. Protegido por `CRON_SECRET` (env var — só o Cron da Vercel consegue disparar). **Limitação conhecida**: sequencial dentro de 300s por disparo — se o número de conexões conectadas crescer a ponto de estourar isso, migrar pra fila (Trigger.dev/Vercel Queues) quando o volume real pedir, não antes.

## Why Vercel Serverless Functions (not Next.js, not Supabase Edge Functions)

- Vercel auto-detects `api/*.ts` and deploys each as a function; it takes precedence over the SPA catch-all rewrite in `vercel.json` — no config change needed for that file.
- No SSR/image-optimization requirement exists that would justify a Next.js migration.
- Supabase Edge Functions would split hosting across two providers for no benefit right now. Supabase is used purely as the database + secret-safe row store.

## Provider enum

```ts
type Provider = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'loja_propria'
```

`mercadolivre` (`src/server/integrations/mercadolivre/`) e `shopee` (`src/server/integrations/shopee/`) têm conector real. Amazon/Magalu/Loja Própria existem só como entradas nesse union e em `marketplace_connections.provider` — tentar conectar deve mostrar "não implementado ainda", nunca sucesso falso.

## Data flow (current scope: products + inventory)

```
[Conectar Mercado Livre] (button)
  → GET /api/integrations/mercadolivre/authorize
    → redirect to https://auth.mercadolivre.com.br/authorization
  → user approves on Mercado Livre
  → GET /api/integrations/mercadolivre/callback?code&state
    → validate signed state
    → POST https://api.mercadolibre.com/oauth/token (server-side only)
    → encrypt access_token/refresh_token, upsert marketplace_connections
    → log sync_logs (oauth_connected)
    → redirect to /importacoes?connected=mercadolivre

[Sincronizar] (manual trigger, next phase)
  → POST /api/integrations/mercadolivre/sync
    → GET /users/{user_id}/items/search (paginated item ids)
    → GET /items/{item_id} per id (title, price, available_quantity, sold_quantity)
    → normalize → upsert marketplace_products + marketplace_inventory
    → log sync_logs (sync_started / sync_success / sync_error)

[UI]
  → GET /api/integrations/status → sanitized connection status (no tokens, ever)
  → GET /api/dashboard/inventory → Estoque page reads marketplace_inventory when connected, otherwise falls back to the existing mock data, clearly labeled "Demonstração"
```

## Security rules (non-negotiable)

- `client_secret`, `access_token`, `refresh_token` never reach the frontend bundle or the browser. No `VITE_` prefix on any secret.
- Tokens are encrypted at rest (AES-256-GCM, `src/server/integrations/crypto.ts`) using `INTEGRATIONS_ENCRYPTION_KEY`, a server-only env var.
- `marketplace_connections`, `sync_logs`, `marketplace_products`, `marketplace_inventory` have RLS enabled with **no policies for `anon`/`authenticated`** — only the service role (used exclusively inside `api/**`) can read/write them.
- Missing env vars never produce a fake "connected" state — `/api/integrations/status` returns `status: "config_missing"` and the UI must show "Configuração pendente".
- Every OAuth step and sync run writes a `sync_logs` row (success and failure).

## Tables (this phase)

See `supabase/migrations/create_marketplace_integrations.sql` for the authoritative schema. Implemented now:

- `marketplace_connections`
- `sync_logs`
- `marketplace_products`
- `marketplace_inventory`

## Tables (atualizado)

`orders` e `order_items` (migration `007_orders.sql`) também implementadas e em uso — pedidos reais de ML/Shopee, base do faturamento/ticket médio/tendência de produto. `marketplace_daily_metrics`/`product_daily_metrics` nunca chegaram a ser criadas como tabela própria — os agregados por dia (D-1/D-7/D-30/D-365) são calculados on-the-fly em `api/dashboard/finance.ts` a partir de `orders`, sem tabela de cache separada (suficiente pro volume atual).

## Ainda não implementado

- Amazon / Magalu / Loja Própria connectors — sem OAuth/sync, só enum no schema/types.
- `/api/dashboard/overview`, `/api/dashboard/marketplaces` como endpoints dedicados — hoje `finance.ts`/`products.ts`/`summary.ts` cobrem esse espaço.
