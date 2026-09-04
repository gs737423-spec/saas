---
type: session
project: SaaS E-commerce
date: 2026-09-04
status: implemented-awaiting-production-smoke
---

# Auditoria de integridade — totais e estoque desconhecidos

## Problemas confirmados

- Pedido VTEX com `value` ausente podia ser normalizado como venda de R$ 0 e reduzir faturamento e ticket.
- Balanço de estoque VTEX parcial transformava quantidade não informada em zero.
- A leitura paginada de Produtos, o subtotal de Categorias e Relatórios repetiam a mesma perda semântica: `stock: null` virava `0`, inclusive em alerta de baixo estoque.
- Dois testes estáticos ainda descreviam contratos já substituídos por RPC/paginação, embora a implementação em produção já usasse os contratos novos.

## Correções

- `normalizeVtexOrder` só inclui analytics quando o total é finito e não negativo; zero explícito continua válido.
- `normalizeVtexSku` conserva quantidade parcial ou ilimitada como desconhecida em produto, inventário e depósitos.
- `DashboardProduct.stock` passou a aceitar `null` e a interface mostra `N/D`, sem usar tom de ruptura nem somar um saldo inexistente.
- Categoria com qualquer produto sem saldo confirmado exibe subtotal `N/D`.
- Migration `035_preserve_unknown_stock_in_product_reports.sql` redefine apenas a função `dashboard_report_products`: itens sem saldo confirmado não entram na lista/contador de estoque baixo.

## Validação

- `npm run typecheck`: passou.
- `npm run test:run`: 54 arquivos, 361 testes passaram.
- `npm run security:service-role-scan`: passou.
- `npm run build`: passou.
- `npx supabase db lint --linked`: sem erros.
- `npx supabase migration list --linked`: local/remoto alinhados de 001 a 035.
- Migration 035 aplicada no Supabase vinculado em 2026-09-04; não houve escrita em pedidos, produtos ou dados de cliente.

## Lacunas reais

- O contrato do payload Shopee ainda precisa de validação com resposta autenticada e fixture anonimizada; não foram inventados campos nem valores.
- Taxas/comissões de pedidos VTEX continuam indisponíveis sem uma fonte oficial de liquidação do canal; o Financeiro mantém líquido indisponível em vez de estimar.
- Dados históricos já persistidos antes desta correção exigem auditoria read-only específica antes de qualquer correção retroativa.

## Próxima ação

Executar smoke autenticado em Produtos, Estoque e Relatórios após o deploy para confirmar que saldos ausentes aparecem como `N/D` e que o contador de estoque baixo não inclui esses itens.
