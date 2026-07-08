# Marketplace API Integration Roadmap

Status: **planning only** — no backend or API logic implemented yet. This document describes the intended architecture for direct marketplace connections (Mercado Livre, Shopee, Amazon, Loja Própria), which today are represented in the UI as disabled/"em breve" states with mock data only.

## Goals

- Let a client connect a marketplace account once and have orders, products, stock and revenue sync automatically.
- Keep spreadsheet import as a permanent fallback — not every client will want to grant API access, and some data sources (offline sales, ERPs) will never have a marketplace API.
- Support multiple marketplaces without coupling the dashboard to any single marketplace's data shape.

## OAuth / authorization flow (concept)

Each marketplace uses its own OAuth2 flow (Mercado Livre and Shopee are authorization-code grant; Amazon SP-API uses LWA + role-based access). Conceptually:

1. Client clicks "Conectar conta" in the dashboard.
2. Backend generates an authorization URL for that marketplace (client id, redirect URI, requested scopes: orders, products, inventory, financials) and redirects the client's browser there.
3. Client authorizes on the marketplace's own site.
4. Marketplace redirects back to a backend callback URL with an authorization code.
5. Backend exchanges the code for access + refresh tokens **server-side**.
6. Backend stores tokens in encrypted storage, associated with the client's account and that marketplace connection.
7. Backend schedules the first sync job.

The frontend never sees the authorization code exchange or the tokens — it only sees connection status (`pronto`, `conectado`, `requer_autorizacao`, `erro`) and triggers the initial redirect.

## Connector layer (concept)

One connector module per marketplace, implementing a shared interface:

```
interface MarketplaceConnector {
  getAuthUrl(clientId: string): string
  handleCallback(code: string): Promise<TokenSet>
  refreshToken(tokens: TokenSet): Promise<TokenSet>
  fetchOrders(since: Date): Promise<RawOrder[]>
  fetchProducts(): Promise<RawProduct[]>
  fetchInventory(): Promise<RawInventoryItem[]>
}
```

Each connector (`MercadoLivreConnector`, `ShopeeConnector`, `AmazonConnector`, `LojaPropriaConnector`) owns the marketplace-specific request shapes, pagination, and rate limits. Nothing outside the connector should know the marketplace's raw API format.

## Normalized data model

Connectors translate raw marketplace responses into the dashboard's shared internal shape before anything touches the database or the UI — the same `Product`, `Order`, `StockItem` shapes already used by the mock data in `src/data/mockData.ts`. This is what makes cross-marketplace aggregation (revenue by channel, combined product catalog, etc.) possible without per-marketplace conditional logic in the dashboard layer.

## Secure token storage

- Access and refresh tokens are secrets. They are stored encrypted at rest in the backend database, never in localStorage, never in the frontend bundle, never in a cookie readable by JS.
- **Never store secrets in frontend code or frontend environment variables** (anything prefixed `VITE_` or shipped in the client bundle is public).
- Marketplace API credentials (client id/secret per marketplace) live in backend environment variables only (e.g. `ML_CLIENT_SECRET`, `SHOPEE_PARTNER_KEY`), injected at deploy time, never committed to the repo.
- Token refresh happens server-side on a schedule; the frontend only ever sees "connected / needs reauthorization / error".

## Implementation order

1. **Mercado Livre** — largest share of current revenue in the mock data, most mature OAuth2 + REST API.
2. **Shopee** — second priority, partner API requires a similar auth-code flow.
3. **Amazon** — SP-API has more setup overhead (role authorization, region-specific endpoints).
4. **Loja Própria** — depends on which e-commerce platform the client uses; likely a webhook-based or platform-specific plugin rather than a single fixed connector.

Spreadsheet import remains fully functional and unaffected at every stage of this rollout — it is not deprecated by API connections, it is the fallback for any client or marketplace not yet connected.
