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

## Próxima ação

Otimizar o extrato detalhado e a série diária em lote separado, preservando paginação/contratos antes de alterar a UI.
