# Fonte canônica de pedidos

## Prioridade

1. Conector direto do marketplace, quando existe e está autorizado.
2. VTEX para pedidos nativos de Loja Própria.
3. VTEX como source de qualquer marketplace/canal externo, mesmo antes do mapeamento.
4. Canal externo não resolvido é preservado no registry tenant-scoped e continua elegível para métricas globais quando o pedido é válido.

## Chave

- Marketplace resolvido: `{canal}:{marketplaceOrderId}`.
- Loja Própria VTEX ou canal ainda não resolvido: `vtex:{orderId}`.
- Conectores diretos: a mesma chave `{provider}:{externalOrderId}`.

O índice único `(company_id, canonical_order_key)` impede dupla contagem. `order_source_refs` preserva todas as origens observadas. Quando VTEX e conector direto veem o mesmo pedido, o registro direto continua canônico e a observação VTEX é apenas proveniência. A operação é idempotente e os itens só são substituídos pela fonte canônica.

## Canal

`affiliateId` não é adivinhado. Mapeamentos são por empresa e conexão. Pedido sem `affiliateId`, sem `salesChannel` externo e sem `marketplaceOrderId` pode ser Loja Própria. Qualquer sinal externo desconhecido cria uma identidade dinâmica `external:vtex:*`, recebe `channel_resolution_status=unresolved` e nunca vira Loja Própria.

`sales_channels` é a dimensão extensível. `vtex_channel_mappings` liga a identidade externa observada ao canal canônico dentro do mesmo `company_id` e `connection_id`. Não há enum/check fechado de canais; integridade é mantida pela FK tenant-scoped entre pedidos, proveniência, mappings e registry.

`provider` identifica quem entregou o dado ao MKTOnline; `sales_channel` identifica onde a venda ocorreu. Por isso `provider=vtex` nunca implica, sozinho, `sales_channel=loja_propria`.

| Source provider | Sinal de origem | Sales channel | Analytics |
|---|---|---|---|
| `mercadolivre` | integração direta | `mercadolivre` | sim |
| `shopee` | integração direta | `shopee` | sim |
| `amazon` | integração direta | `amazon` | sim |
| `magalu` | integração direta futura | `magalu` | sim |
| `loja_propria` | integração direta | `loja_propria` | sim |
| `vtex` | affiliate mapeado para ML | `mercadolivre` | sim |
| `vtex` | affiliate mapeado para Shopee | `shopee` | sim |
| `vtex` | affiliate mapeado para Amazon | `amazon` | sim |
| `vtex` | affiliate mapeado para Magalu | `magalu` | sim |
| `vtex` | sem affiliate e sem marketplace order ID | `loja_propria` | sim |
| `vtex` | sinal de marketplace não resolvido | `external:vtex:*` | sim nos totais; canal fica pendente |

Breakdowns usam o nome individual registrado enquanto houver poucos canais. Gráficos limitam a apresentação a Top 3 + Outros quando necessário, sem apagar as identidades individuais do backend.

Magalu é provider e canal de primeira classe. Um pedido Magalu recebido pela VTEX usa `magalu:{marketplaceOrderId}`; o futuro conector direto deve usar a mesma chave, permitindo deduplicação sem alterar o modelo.
