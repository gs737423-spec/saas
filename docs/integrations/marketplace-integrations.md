# Marketplace Integrations — Architecture

Status: **Mercado Livre in progress (real OAuth + minimal sync).** Shopee, Amazon, Magalu, Loja Própria are prepared as providers in the schema/types only — no OAuth or sync implemented for them yet.

## Stack

- Frontend: Vite + React (unchanged, no migration to Next.js).
- Backend: Vercel Serverless Functions under `api/**`. Vite does not serve these — Vercel builds each `api/*.ts` as an independent function, separate from the `tsc && vite build` pipeline that only type-checks `src/`.
- Database: Supabase Postgres. Access from serverless functions only, via the **service role key** (bypasses RLS). The anon/public key is never used for these tables — there is no client-side Supabase usage for integration data.
- Scheduled/recurring sync: deferred to Trigger.dev, added after the manual sync flow is proven (see "Not yet implemented" below).

## Why Vercel Serverless Functions (not Next.js, not Supabase Edge Functions)

- Vercel auto-detects `api/*.ts` and deploys each as a function; it takes precedence over the SPA catch-all rewrite in `vercel.json` — no config change needed for that file.
- No SSR/image-optimization requirement exists that would justify a Next.js migration.
- Supabase Edge Functions would split hosting across two providers for no benefit right now. Supabase is used purely as the database + secret-safe row store.

## Provider enum

```ts
type Provider = 'mercadolivre' | 'shopee' | 'amazon' | 'magalu' | 'loja_propria'
```

Only `mercadolivre` has a real connector (`src/server/integrations/mercadolivre/`). The others exist only as entries in this union and in `marketplace_connections.provider` — attempting to connect them should surface "not implemented yet", never a fake success.

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

## Not yet implemented (documented, deferred — see individual docs for detail)

- `marketplace_orders`, `marketplace_order_items`, `marketplace_daily_metrics`, `product_daily_metrics` — deferred until the orders endpoint is validated against a real token (see `mercadolivre-sync.md`).
- `/api/dashboard/overview`, `/api/dashboard/marketplaces`, `/api/dashboard/products` — deferred; only `/api/dashboard/inventory` ships in this phase.
- Shopee / Amazon / Magalu / Loja Própria connectors.
- Trigger.dev recurring sync (manual `POST /sync` only, for now).
- Token auto-refresh inside the sync call (`refresh-token.ts` ships as a stub with a TODO — wiring it into `sync.ts` is next phase).
