---
type: session
date: 2026-09-03
status: audit-complete-findings-open
---

# Varredura de integrações e desempenho

## Resultado

- Auditoria somente leitura concluída.
- Nenhum dado de cliente, integração, credencial ou produção foi alterado.
- O repositório permaneceu sem alterações de código; somente esta documentação de auditoria foi adicionada.

## Evidências principais

- A recuperação VTEX pós-limite OMS está rodando como `full`, com catálogo avançando e sem erros na run atual.
- Integridade canônica de pedidos passou nos cinco checks básicos: duplicidade, total de pago, data futura e itens.
- Pricing VTEX está autorizado; preços nulos são respostas válidas da origem, não conversão em zero.
- Gargalo confirmado: endpoints financeiros ainda carregam conjuntos grandes com `fetchAllRows` e agregam em JavaScript.
- Gargalo secundário: volume elevado de `sync_logs` sem índice composto para a consulta da tela de integrações.

## Correções aplicadas após a auditoria

- Migration `032` aplicada no Supabase: RPC agregada para Financeiro sem extrato e índices para pedidos/logs.
- Preço calculado VTEX agora aceita política/tabela comercial válida quando a política `1` não estiver presente, sem fabricar zero.
- Dashboard e Marketplaces usam a RPC agregada quando `include_transactions=false`.
- A série diária de receita passou a usar agregação SQL tenant-scoped (`033`).

## Extrato Financeiro paginado (em validação local)

- `Financeiro` deixou de solicitar o extrato integral junto com os KPIs: a visão geral usa `finance?include_transactions=false`, que já é agregada no Postgres.
- O novo endpoint `finance-transactions` lê no máximo 100 pedidos pagos por página, sempre filtrando `company_id`, conexões autorizadas, período e canal selecionado antes de ordenar e paginar.
- Estorno conhecido segue no mesmo lote do pedido correspondente; o histórico não é truncado. A interface informa total, intervalo e páginas e permite voltar ao ponto já consultado pelo cache tenant/user-scoped.
- O filtro por marketplace passou a enviar a chave canônica ao servidor. Canais legados não confiáveis permanecem no único balde `Canal não identificado`, sem reatribuição de receita.
- Sem migration e sem escrita em dados reais.
- Validação local: TypeScript passou; 27/27 testes focados passaram; build passou (somente o aviso preexistente de chunk principal acima de 500 kB). Deploy e smoke autenticado pendentes desta etapa.

## Próxima ação

Revisar o diff, publicar e fazer smoke autenticado do Financeiro paginado em produção.
