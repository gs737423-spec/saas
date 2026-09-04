# Sessão — Integração nativa VTEX fase 1

Data: 2026-08-14

## Resultado

Implementação local read-only criada para conexão por application key, validação de permissões, credenciais criptografadas, full/incremental sync resumível, catálogo, categorias, preço, estoque por warehouse, pedidos, classificação de canal, deduplicação com conectores diretos, analytics e interface de Conexões.

Migration `019_vtex_native_integration.sql` foi criada e NÃO aplicada. Nenhum deploy, push, commit, staging ou dado real foi alterado.

## Decisões

- Application keys em vez de OAuth/user token inventado.
- Feed v3 preparado no cliente, porém não ativado sem garantia operacional e teste real.
- Incremental temporário pela Orders API com `lastChange` e overlap.
- Fonte direta vence VTEX para pedidos de marketplace; Loja Própria VTEX é canônica.
- Canal desconhecido é preservado e excluído dos analytics.
- Quantidade ausente/ilimitada aparece como `N/D`.

## Erros encontrados e corrigidos

- O sandbox bloqueou Vitest/Vite com `spawn EPERM`; os mesmos gates passaram fora do sandbox autorizado.
- Um filtro `analytics_included` havia sido aplicado à tabela de conexões; foi movido para pedidos.
- Um race de inserção canônica poderia substituir itens diretos por VTEX; a prioridade da fonte foi preservada também após conflito concorrente.
- Sync parcial avançava `last_success_at`; agora somente sucesso completo avança.
- Estoque VTEX ausente/ilimitado era confundido com zero; agora é nulo/`N/D`.
- Janela acima de 30 páginas poderia parecer completa; agora reduz adaptativamente e termina partial se até a janela horária exceder o limite.

## Validações

- `npm run typecheck`: passou.
- `npm run test:run`: 99/99 testes passaram.
- `npm run security:service-role-scan`: passou.
- `npm run build`: passou.
- `npm audit --omit=dev --audit-level=high`: 0 vulnerabilidades.
- `git diff --check`: passou.
- Smoke test VTEX real: PENDENTE, sem credenciais autorizadas.
- Migration/RLS em staging: PENDENTE, não autorizado nesta sessão.

## Aprendizado proposto

Integrações que agregam fontes devem persistir identidade canônica e proveniência separadamente; disponibilidade desconhecida deve ser modelada como nula, nunca como zero. Proposta não promovida à memória oficial.

## Próxima ação

Revisar a migration 019, aplicar somente em staging, configurar credencial VTEX de menor privilégio e executar o checklist real de conexão, backfill, deduplicação, RLS e métricas antes de qualquer liberação.

## Status

NOT READY FOR PRODUCTION.
