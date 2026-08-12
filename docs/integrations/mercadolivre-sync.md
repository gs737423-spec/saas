# Mercado Livre — Sync (produtos + estoque + pedidos)

Status (atualizado 2026-08-12): **pedidos/faturamento implementados**, não são mais adiados. `client.ts` valida `orders/search` contra a API real, `sync.ts` faz upsert em `orders`/`order_items`. Auto-refresh de token também implementado (`ensureValidAccessToken`), não é mais TODO.

## Endpoints usados (validados)

- `GET https://api.mercadolibre.com/users/{user_id}/items/search` — paginated list of the seller's item IDs. Query params: `offset`, `limit` (max 50 per page per ML docs convention).
- `GET https://api.mercadolibre.com/items/{item_id}` — item detail. Fields used: `id`, `title`, `status`, `price`, `available_quantity`, `sold_quantity`, `permalink`, plus `seller_custom_field` / `attributes` (SELLER_SKU) when present for SKU.
- `GET https://api.mercadolibre.com/orders/search?seller={user_id}` — paginado, ordenado por `date_desc`, janela de 1 ano (`ORDERS_HISTORY_DAYS`), teto de segurança `MAX_ORDERS_FIRST_SYNC` (10000). Resposta já traz o pedido completo (itens, valores, comprador, status) — sem chamada de detalhe por pedido.

Todos exigem `Authorization: Bearer $ACCESS_TOKEN`.

## Rate limits

Per Mercado Livre's published limits: **1500 requests/minute per seller**; exceeding it returns an empty body with HTTP 429. `client.ts` implements a minimal backoff: on 429, wait and retry once with exponential delay before surfacing an error to the sync summary (does not silently drop data — a persistent 429 is logged as `sync_error`/`sync_partial`).

## Sync steps (`POST /api/integrations/mercadolivre/sync`, ou disparado pelo cron em `api/cron/sync-all.ts`)

1. Load the `mercadolivre` row from `marketplace_connections`. No connected row → `ConnectionMissingError`, no fake data.
2. Claim do lock atômico (`sync_started_at`) — evita 2 syncs simultâneos da mesma empresa (2 abas, duplo clique, cron + manual ao mesmo tempo). Lock mais velho que 10min é tratado como abandonado.
3. `ensureValidAccessToken` — decripta o token; se expirado, usa o refresh token pra pegar um novo antes de seguir (não é mais TODO).
4. Log `sync_logs` (`event_type: sync_started`).
5. Fetch all item IDs via `items/search`, paginando até `MAX_ITEMS_FIRST_SYNC` (2000).
6. Pra cada item, busca detalhe via `items/{id}` (concorrência limitada a 8 em voo).
7. Normaliza cada item em `marketplace_products`/`marketplace_inventory` (upsert por `company_id + connection_id + external_product_id`), mantendo `raw_payload` pra auditoria.
8. Busca pedidos via `orders/search` (janela de 1 ano), normaliza e faz upsert em `orders` + `order_items` (substitui itens a cada sync, nunca duplica).
9. Update `marketplace_connections.last_sync_at`, libera o lock (`sync_started_at = null`).
10. Log `sync_logs` (`sync_success`/`sync_partial`/`sync_error`), com resumo `{ productsImported, inventoryUpdated, ordersImported, errors, durationMs }`.
11. Retorna esse mesmo resumo como corpo da resposta (quando chamado via HTTP; o cron agrega o resumo de todas as empresas numa lista).

## Sync automático

Além do botão manual, `api/cron/sync-all.ts` roda via Vercel Cron (`vercel.json`, diário) — itera toda conexão `status='connected'` e chama este mesmo `runMercadoLivreSync`. Protegido por `CRON_SECRET`. Ver `marketplace-integrations.md` pra detalhe e limitação conhecida de escala.
