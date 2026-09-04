---
type: audit
scope: integrations-and-dashboard-performance
status: findings-open
date: 2026-09-03
mode: read-only
---

# Auditoria de integrações e desempenho — 2026-09-03

## Escopo e limites

- Leitura estática do código e consultas agregadas no Supabase, sempre filtradas pelo tenant em análise.
- Nenhum pedido, produto, credencial, conexão ou configuração foi alterado.
- Nenhuma migração, deploy, commit ou push foi executado nesta auditoria.

## Fatos confirmados

1. A conexão ativa do tenant é VTEX. Amazon, Mercado Livre, Shopee e demais nomes exibidos são canais de venda recebidos pela VTEX; não há conexão OAuth direta adicional neste tenant.
2. Todas as migrations locais `001` a `031` estão alinhadas com o banco remoto.
3. Integridade de pedidos: zero chaves canônicas duplicadas, zero pedidos pagos sem total, zero pedidos futuros e zero pedidos sem itens.
4. A correção para a janela OMS densa já está em produção: os incrementais antigos falharam na página 31; o cron iniciou uma recuperação `full` sem erros e o catálogo segue avançando por checkpoint. No momento da observação, 11.743 SKUs haviam sido processados no estágio `catalog`.
5. A conexão ainda está `syncing`; freshness de catálogo, estoque e pedidos só pode ser promovida quando a recuperação terminar. Portanto os números exibidos ainda podem estar defasados durante esse ciclo.
6. As permissões VTEX de catálogo, pedidos, estoque e pricing estão confirmadas como verdadeiras. Dos 17.818 produtos ativos, 6.261 possuem preço padrão retornado e 11.557 tiveram `priceAvailable=false` em resposta válida da origem. Ausência de preço não deve ser convertida em zero nem apresentada como falta de permissão.
7. Dos 17.818 registros de estoque ativos, 23 têm quantidade desconhecida e 16.383 retornam zero. A origem respondeu inventário; a auditoria não encontrou evidência de zero fabricado, mas a distribuição precisa de validação de negócio/warehouse antes de ser tratada como saudável.
8. Há 16 mappings VTEX resolvidos e 1 não resolvido. Existem canais históricos não resolvidos; o código os agrupa como canal externo não identificado, evitando que sejam atribuídos automaticamente ao marketplace errado.

## Problemas confirmados

### P0 — recuperação VTEX ainda em curso

- Existem 604 runs de pedidos falhos, quase todos com a limitação OMS de página 31 antes do deploy corretivo.
- A run full em curso substitui esse caminho por uma travessia com `creationDate` imutável. Enquanto não chegar a `complete`, não se pode afirmar que os dados recentes estejam atualizados.

### P1 — API financeira não escala com o volume atual

- O tenant possui 20.497 pedidos pagos nos últimos 30 dias e mais de 85 mil itens de pedido no histórico.
- `api/dashboard/finance.ts`, `api/dashboard/summary.ts` e `api/dashboard/finance-daily.ts` usam `fetchAllRows` e agregam resultados em JavaScript.
- A cada troca de período/filtro, isso transfere e processa muitos pedidos apesar do cache curto no navegador. É um mecanismo compatível com a lentidão reportada.
- Correção indicada: mover agregações financeiras, comparativos e séries diárias para RPCs SQL tenant-scoped, com índices compostos aderentes aos filtros. Preservar contratos de resposta e cache atual.

### P1 — logs de sincronização excessivos e índice incompleto para a tela de integrações

- O tenant acumulou 165.022 eventos `sync_stage` e 545 `sync_error` em sete dias.
- A API de logs filtra por `company_id` e ordena por `created_at`, mas existe apenas índice simples em `company_id`; falta índice composto para esse padrão de leitura.
- Correção indicada: reduzir logs informativos repetitivos a eventos de transição/progresso relevante e adicionar índice aditivo `(company_id, created_at desc)`. Não apagar logs existentes sem política de retenção aprovada.

### P2 — leituras legadas ainda fazem varredura completa

- Produtos e Estoque usam RPC paginada no caminho principal, porém os fallbacks ainda usam `fetchAllRows` sobre catálogo, estoque e itens de pedido.
- Os fallbacks devem continuar por compatibilidade, mas precisam de limite de segurança/telemetria para não se tornarem o caminho normal quando uma RPC falha.

## Lacunas reais

- Não foi possível validar o número externo na VTEX sem uma conta/consulta oficial de comparação por período; esta auditoria confirmou integridade interna e freshness, não conciliação contábil externa.
- A recuperação full ainda não terminou; é necessário observar `complete`, `orders_last_sync_at` avançado e o primeiro incremental saudável antes de encerrar o incidente VTEX.
- Shopee e Mercado Livre diretos possuem conectores no código, mas não estão conectados neste tenant; não há dados reais locais para um smoke end-to-end desses provedores.

## Próxima sequência segura

1. Acompanhar a run VTEX até `complete` e validar freshness/último pedido.
2. Implementar em lote separado RPCs financeiras + índices tenant-scoped, com testes de equivalência contra os totais atuais.
3. Implementar em lote separado a contenção de `sync_logs` e o índice composto.
4. Fazer conciliação externa VTEX por intervalo fechado depois que a recuperação terminar.
