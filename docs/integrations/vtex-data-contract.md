# Contrato de dados VTEX → MKTOnline

| Domínio VTEX | Destino | Identidade | Campos relevantes | Ausência |
|---|---|---|---|---|
| Category tree | `marketplace_categories` | empresa + conexão + category id | parent, path, level, active | item sem categoria permanece `Sem categoria` |
| SKU context | `marketplace_products` | empresa + conexão + SKU id VTEX | parent product, refId/SKU, título, status, categoria, URL | campo fica `null`, nunca inventado |
| Pricing | `marketplace_products.price` | SKU id | `basePrice` atual | `N/D`; não bloqueia sync |
| Inventory | `marketplace_inventory` | empresa + conexão + SKU id | quantidade agregada atual | `null`/`N/D`, distinto de zero |
| Warehouse balance | `marketplace_inventory_sources` | empresa + conexão + SKU + warehouse | total, reservado, disponível, ilimitado | `N/D` por campo |
| Order list/detail | `orders`, `order_items` | canonical order key | status, valor histórico, moeda, datas, itens, resolução de canal | resolução pendente não invalida receita global |
| Channel registry | `sales_channels` | empresa + canonical key | nome, tipo, status | criado dinamicamente por canal observado |
| Affiliate mapping | `vtex_channel_mappings` | empresa + conexão + identidade externa | affiliate, salesChannel externo, canal canônico, resolução | `unresolved` até revisão confiável |
| Proveniência | `order_source_refs` | conexão + external order id | provider, conta, marketplaceOrderId, affiliateId, canal externo e canônico | preservado sem PII |

## Regras

- VTEX é source provider, não canal de venda. `sales_channel` é texto extensível referenciado pelo registry, não enum fechado.
- Affiliate desconhecido nunca vira Loja Própria: cria `external:vtex:*`, fica `unresolved`, mantém `analytics_included=true` quando o pedido é elegível e recebe `VTEX_CHANNEL_MAPPING_REQUIRED`.
- `analytics_included` responde pela validade global do pedido; `channel_resolution_status` responde apenas se o canal foi identificado.
- Dinheiro de pedido VTEX vem em centavos e é convertido uma vez para unidade monetária.
- Receita histórica usa `order.value` e preço histórico do item, nunca o preço atual do catálogo.
- `raw_payload` VTEX é `null`: o sistema persiste somente o subconjunto operacional e evita PII de cliente/endereço/pagamento.
- Estoque ilimitado não é somado como zero; o agregado vira `N/D` e o warehouse preserva `unlimited_quantity=true`.
- Um sync parcial preserva o último snapshot válido e não avança `last_success_at`.
- Categorias mantêm pai e caminho; SKU mantém o product id pai sem transformar id externo em PK interna.
