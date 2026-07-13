# Mercado Livre — Sync (this phase: products + inventory only)

Orders/billing are **explicitly deferred** — the orders endpoint shape needs validation against a real token before it's trusted in a normalizer. Building it blind risks silently wrong revenue numbers, which is worse than not having them yet.

## Endpoints used (validated)

- `GET https://api.mercadolibre.com/users/{user_id}/items/search` — paginated list of the seller's item IDs. Query params: `offset`, `limit` (max 50 per page per ML docs convention).
- `GET https://api.mercadolibre.com/items/{item_id}` — item detail. Fields used: `id`, `title`, `status`, `price`, `available_quantity`, `sold_quantity`, `permalink`, plus `seller_custom_field` / `attributes` (SELLER_SKU) when present for SKU.

Both require `Authorization: Bearer $ACCESS_TOKEN`.

## Rate limits

Per Mercado Livre's published limits: **1500 requests/minute per seller**; exceeding it returns an empty body with HTTP 429. `client.ts` implements a minimal backoff: on 429, wait and retry once with exponential delay before surfacing an error to the sync summary (does not silently drop data — a persistent 429 is logged as `sync_error`/`sync_partial`).

## Sync steps (`POST /api/integrations/mercadolivre/sync`)

1. Load the `mercadolivre` row from `marketplace_connections`. No connected row → 400, no fake data.
2. Decrypt `access_token`. (Token expiry check / auto-refresh: not wired yet in this phase — `TODO` in `sync.ts`; if Mercado Livre returns 401, the sync is logged as `sync_error` with a clear message rather than guessing.)
3. Log `sync_logs` (`event_type: sync_started`).
4. Fetch all item IDs via `items/search`, paginating with `offset`/`limit` until the response's `paging.total` is exhausted.
5. For each item ID, fetch detail via `items/{id}`.
6. Normalize each item (`src/server/integrations/normalizers/normalizeProduct.ts`, `normalizeInventory.ts`) into the internal shape — the UI never sees Mercado Livre's raw field names.
7. Upsert into `marketplace_products` (keyed by `connection_id + external_product_id`) and `marketplace_inventory` (keyed by `connection_id + external_product_id`), both retain `raw_payload` (jsonb) for future debugging/backfill, but dashboards only ever read the normalized columns.
8. Update `marketplace_connections.last_sync_at`.
9. Log `sync_logs` (`event_type: sync_success` or `sync_partial`/`sync_error` if any item failed), with a summary payload: `{ productsImported, inventoryUpdated, errors, durationMs }`.
10. Return that same summary as the HTTP response body.

## Explicitly out of scope this phase

- `marketplace_orders`, `marketplace_order_items` — table design exists in the full architecture doc, not created by this migration. Endpoint to validate next: `GET /orders/search?seller={user_id}` (needs a real token to confirm the exact path/shape before trusting it — some third-party docs show a `/marketplace/orders/search` prefix that doesn't match the classic Mercado Livre REST convention; **do not assume either without testing**).
- `marketplace_daily_metrics`, `product_daily_metrics` — depend on orders data.
- Automatic token refresh mid-sync.
- Trigger.dev scheduling — this phase is a manual button only.
