# Correção de integrações — lote 3

## Resultado

- Checkpoints persistentes de catálogo e pedidos consumidos por Mercado Livre e Shopee.
- Catálogos grandes retomam em lotes sem persistir cursores externos efêmeros.
- Histórico de pedidos retrocede em janelas congeladas; truncamento reduz a janela progressivamente até uma hora sem avançar o período, e detalhe ausente ou falha de persistência também impedem avanço.
- Produtos e estoques ausentes são apenas inativados, nunca excluídos, e somente após ciclo integral sem falhas.
- Freshness de catálogo, estoque e pedidos passou a ter timestamps independentes no status e nas leituras correspondentes.
- VTEX grava os três timestamps de domínio somente quando a run termina sem erros.

## Segurança preservada

- Toda reconciliação usa `company_id` e `connection_id`.
- Nenhum dado real foi alterado durante esta implementação.
- Autenticação, tokens, RLS e regras de negócio não foram reescritos.
- Nenhuma migration foi executada neste lote.

## Validação

- TypeScript: passou.
- Testes: 279/279 passaram.
- Scan de fronteira da service role: passou.
- Build: passou; aviso não bloqueante do chunk principal em aproximadamente 707 kB.
- Lint: não executado porque não existe script de lint no `package.json`.

## Migration aplicada

- A migration `026_integration_continuity_and_product_identity.sql` foi aplicada no `vintec-production` e registrada em `supabase_migrations.schema_migrations`.
- Verificação: histórico 1/1, colunas 11/11, índices 2/2 e zero `NULL` inválido nos checkpoints/flags obrigatórios.
- A auditoria pós-migration encontrou a conexão VTEX em erro `VTEX_ORDER_WINDOW_DENSE_TIMESTAMP_UNSUPPORTED`, sem primeira sincronização concluída.
- Há carga parcial de 17.727 produtos, 17.727 estoques e 22.951 pedidos. Desses produtos, 11.477 não possuem preço e a conexão registra `pricing:false`; todos os pedidos têm taxa desconhecida. Os marcadores `last_seen_at` permanecem nulos até o runtime novo ser implantado e completar um ciclo.
- Próxima ação: corrigir a continuidade de pedidos VTEX nesse caso denso, fazer deploy controlado e executar smoke real.

Status: **Migration aplicada; runtime local validado; integração real ainda bloqueada pela paginação OMS densa.**
