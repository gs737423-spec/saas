# Mercado Livre — OAuth Flow

Validated against official docs (July 2026):
- [Authentication and Authorization](https://developers.mercadolivre.com.br/en_us/authentication-and-authorization)
- [Obtenção do Access Token](https://developers.mercadolivre.com.br/pt_br/obtencao-do-access-token)

## 1. Register the app

Create an app at https://developers.mercadolivre.com.br/apps. You get `client_id` (APP ID) and `client_secret`. Register the exact redirect URI you will use — Mercado Livre requires an **exact match**, no variable query string:

```
https://<your-vercel-domain>/api/integrations/mercadolivre/callback
```

Mercado Livre requires HTTPS for the redirect URI in production. `localhost` over HTTP is unlikely to be accepted — test the callback against a real Vercel deployment, not `vite dev`.

## 2. Authorization step — `GET /api/integrations/mercadolivre/authorize`

1. Validates required env vars (`ML_CLIENT_ID`, `ML_CLIENT_SECRET`, `ML_REDIRECT_URI`, `OAUTH_STATE_SECRET`, `APP_BASE_URL`). If any is missing, redirects to `${APP_BASE_URL}/importacoes?ml_error=config_missing` instead of proceeding — never fake a connection.
2. Generates a **signed, self-contained `state`**: `base64url(payload).base64url(HMAC-SHA256(payload, OAUTH_STATE_SECRET))`, where `payload = { nonce, issuedAt }`. This avoids needing a server-side state store (serverless has no persistent memory between the two requests) while still preventing CSRF/replay — `callback.ts` verifies the signature and that `issuedAt` is within a 10-minute window.
3. Writes a `sync_logs` row (`event_type: oauth_started`, `connection_id: null` — no connection exists yet).
4. Redirects (302) to:
   ```
   https://auth.mercadolivre.com.br/authorization?response_type=code&client_id=$ML_CLIENT_ID&redirect_uri=$ML_REDIRECT_URI&state=$STATE
   ```

## 3. User authorizes on Mercado Livre

User logs in / approves scopes on Mercado Livre's own site. If they deny, Mercado Livre redirects back with an `error` query param instead of `code`.

## 4. Callback — `GET /api/integrations/mercadolivre/callback`

1. If `error` is present in the query string → log `sync_logs` (`event_type: oauth_error`), redirect to `/importacoes?connected=mercadolivre&status=error`.
2. Verify `state` signature + expiry. Invalid/expired → log `sync_logs` (`event_type: validation_error`), redirect with `status=error`.
3. Exchange `code` for tokens:
   ```
   POST https://api.mercadolibre.com/oauth/token
   Content-Type: application/x-www-form-urlencoded
   grant_type=authorization_code
   client_id=$ML_CLIENT_ID
   client_secret=$ML_CLIENT_SECRET
   code=$CODE
   redirect_uri=$ML_REDIRECT_URI
   ```
   Response (per official docs):
   ```json
   {
     "access_token": "...",
     "token_type": "bearer",
     "expires_in": 21600,
     "scope": "offline_access read write",
     "user_id": 123456789,
     "refresh_token": "..."
   }
   ```
   `expires_in` is seconds (6 hours). `user_id` becomes `external_account_id` / `seller_id`.
4. Encrypt `access_token` and `refresh_token` (AES-256-GCM, `INTEGRATIONS_ENCRYPTION_KEY`) — see `src/server/integrations/crypto.ts`.
5. Upsert `marketplace_connections` (`provider = 'mercadolivre'`, keyed by `provider` for this single-seller MVP): `status='connected'`, `external_account_id`, `seller_id`, `access_token_encrypted`, `refresh_token_encrypted`, `token_expires_at = now() + 21600s`, `scopes`, `last_error = null`.
6. Log `sync_logs` (`event_type: oauth_connected`, `status: success`).
7. Redirect to `${APP_BASE_URL}/importacoes?connected=mercadolivre`.

No sync is triggered automatically by the callback in this phase — the user runs it manually from the Conexões page (`POST /api/integrations/mercadolivre/sync`, next phase).

## 5. Refresh token

```
POST https://api.mercadolibre.com/oauth/token
grant_type=refresh_token
client_id=$ML_CLIENT_ID
client_secret=$ML_CLIENT_SECRET
refresh_token=$REFRESH_TOKEN
```
Returns a new `access_token`/`refresh_token` pair. `api/integrations/mercadolivre/refresh-token.ts` ships as a callable stub in this phase — wiring automatic refresh into the sync path is next phase (`TODO` left in code).

## What never happens

- `client_secret` is read only inside `authorize.ts`/`callback.ts`/`refresh-token.ts`, server-side.
- `access_token`/`refresh_token` are never sent to the browser, never logged in plaintext (sync_logs `payload` only contains sanitized summaries, not tokens), never stored in `localStorage`.
- `/api/integrations/status` returns connection health without ever including token fields.
