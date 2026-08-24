/** Response shape from POST https://api.mercadolibre.com/oauth/token — validated against
 *  https://developers.mercadolivre.com.br/en_us/authentication-and-authorization */
export interface MLTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  scope: string
  user_id: number
  // Ausente quando a conta autorizante não é vendedora — o Mercado Livre só
  // emite refresh_token pra contas com permissão de venda.
  refresh_token?: string
}

export interface MLTokenErrorResponse {
  error: string
  error_description?: string
  message?: string
}

/** Signed OAuth `state` payload — see docs/integrations/mercadolivre-oauth.md.
 *  companyId viaja assinado aqui porque o callback (chamado pelo Mercado
 *  Livre, não pelo nosso app) não tem acesso à sessão/Authorization header
 *  de quem iniciou o fluxo — o state assinado é o único jeito de saber de
 *  qual empresa era a tentativa quando o redirect volta. */
export interface OAuthStatePayload {
  nonce: string
  issuedAt: number
  companyId: string
}

/** GET /users/{user_id}/items/search response (subset used). */
export interface MLItemSearchResponse {
  results: string[]
  paging: { total: number; offset: number; limit: number }
  scroll_id?: string | null
}

/** GET /items/{item_id} response (subset used — full response has far more fields).
 *  price/available_quantity podem vir null/ausente no nível raiz quando o
 *  anúncio tem variações (tamanho/cor) — nesse caso o estoque real vive em
 *  cada entrada de `variations[]`, não no item. Ver mapper.ts. */
export interface MLItemDetail {
  id: string
  title: string
  status: string
  price: number | null
  available_quantity: number | null
  sold_quantity: number
  permalink: string
  category_id: string
  seller_custom_field?: string | null
  attributes?: { id: string; value_name: string | null }[]
  variations?: { available_quantity: number | null; price?: number | null }[]
}

/** GET /categories/{id} response (subset used). */
export interface MLCategoryDetail {
  id: string
  name: string
}

/** GET /orders/search response (subset used) — see
 *  https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas */
export interface MLOrderSearchResponse {
  results: MLOrder[]
  paging: { total: number; offset: number; limit: number }
}

export interface MLOrderItem {
  item: {
    id: string
    title: string
    seller_sku?: string | null
  }
  quantity: number
  unit_price: number
  // Comissão do Mercado Livre pra este item do pedido — vem no próprio
  // payload de /orders/search, não precisa endpoint separado.
  sale_fee?: number
}

export interface MLOrder {
  id: number
  status: string
  date_created: string
  date_closed: string | null
  total_amount: number
  currency_id: string
  buyer: { id: number } | null
  order_items: MLOrderItem[]
  payments?: Array<{
    id: number
    status?: string | null
    transaction_amount?: number | null
    transaction_amount_refunded?: number | null
    date_last_modified?: string | null
  }>
}
