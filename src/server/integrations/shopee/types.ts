/** Resposta de /api/v2/auth/token/get e /api/v2/auth/access_token/get. */
export interface ShopeeTokenResponse {
  access_token: string
  refresh_token: string
  expire_in: number
  shop_id?: number
  merchant_id?: number
  error?: string
  message?: string
}

/** Payload assinado do `state` — igual ao Mercado Livre, sem estado
 *  compartilhado entre authorize e callback (funções serverless não
 *  compartilham memória). */
export interface ShopeeOAuthStatePayload {
  nonce: string
  issuedAt: number
  companyId: string
}

// TODO: confirmar nomes exatos dos campos abaixo contra a doc oficial da
// Shopee Open Platform (exige login de parceiro) assim que a MKTOnline tiver
// acesso — estrutura baseada no padrão v2 documentado publicamente, mas não
// testada contra uma resposta real ainda.

export interface ShopeeItem {
  item_id: number
  item_name: string
  item_status: string
  item_sku?: string
  category_id?: number
}

export interface ShopeeItemListResponse {
  response: {
    item: { item_id: number; item_status: string }[]
    total_count: number
    has_next_page: boolean
    next_offset?: number
  }
}

export interface ShopeeItemBaseInfoResponse {
  response: {
    item_list: ShopeeItem[]
  }
}

export interface ShopeeOrderItem {
  item_id: number
  item_name: string
  item_sku?: string
  model_quantity_purchased: number
  model_discounted_price: number
}

export interface ShopeeOrder {
  order_sn: string
  order_status: string
  create_time: number
  update_time: number
  total_amount: number
  currency: string
  buyer_user_id?: number
  item_list: ShopeeOrderItem[]
}

export interface ShopeeOrderListResponse {
  response: {
    order_list: { order_sn: string }[]
    more: boolean
    next_cursor?: string
  }
}

export interface ShopeeOrderDetailResponse {
  response: {
    order_list: ShopeeOrder[]
  }
}
