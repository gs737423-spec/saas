/** Response shape from POST https://api.mercadolibre.com/oauth/token — validated against
 *  https://developers.mercadolivre.com.br/en_us/authentication-and-authorization */
export interface MLTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  refresh_token: string
}

export interface MLTokenErrorResponse {
  error: string
  error_description?: string
  message?: string
}

/** Signed OAuth `state` payload — see docs/integrations/mercadolivre-oauth.md */
export interface OAuthStatePayload {
  nonce: string
  issuedAt: number
}

/** GET /users/{user_id}/items/search response (subset used). */
export interface MLItemSearchResponse {
  results: string[]
  paging: { total: number; offset: number; limit: number }
}

/** GET /items/{item_id} response (subset used — full response has far more fields). */
export interface MLItemDetail {
  id: string
  title: string
  status: string
  price: number
  available_quantity: number
  sold_quantity: number
  permalink: string
  seller_custom_field?: string | null
  attributes?: { id: string; value_name: string | null }[]
}
