# Definições de métricas

Todas as consultas filtram `company_id` e `analytics_included=true`.

Pedidos VTEX sem canal resolvido continuam em overview, financeiro, produtos e categorias quando forem válidos, pagos, não duplicados e elegíveis. No breakdown, usam a identidade registrada/fallback de canal externo e podem ser agrupados visualmente em `Outros canais`. `provider` não é usado como fallback de canal para VTEX e unresolved nunca vira Loja Própria.

| Métrica | Fórmula/fonte | Disponibilidade |
|---|---|---|
| Receita/GMV | soma de `orders.total_amount` com status `paid` | real por período e canal |
| Pedidos | contagem de pedidos `paid` | real |
| Ticket médio | receita / pedidos pagos | `N/D` se divisor zero |
| Devoluções | pedidos `cancelled`, contagem e valor preservado | proxy atual; refund parcial `N/D` |
| Crescimento | `(atual - anterior) / anterior` para janela equivalente | `N/D` sem base anterior |
| Receita por produto | soma de `order_items.quantity × unit_price` dos pedidos pagos | preço histórico do item |
| Curva ABC | share acumulado de receita: A até 80%, B até 95%, C restante | `N/D` sem venda |
| Estoque atual | saldo disponível por SKU | `N/D` se API ausente/ilimitada |
| Cobertura | estoque / (vendas 30d / 30) | `N/D` sem estoque finito ou sem venda |
| Giro | vendas 30d / estoque atual | `N/D` com estoque zero/ausente |
| Valor em estoque | estoque finito × preço atual | `N/D` sem algum operando |
| Margem | receita - custo - taxas | `N/D`; custo/repasse VTEX não confiável nesta fase |

Fee VTEX permanece zero apenas no armazenamento legado e não deve ser apresentado como uma taxa real confirmada. O produto deve mostrar `N/D` para métricas financeiras sem fonte suficiente.
