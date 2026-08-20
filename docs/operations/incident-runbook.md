# Runbook de incidentes da plataforma

## Severidade

- **P0:** exposição cross-tenant, vazamento de segredo, perda/corrupção ativa de dados. Interromper operações afetadas e escalar imediatamente.
- **P1:** login indisponível, banco indisponível, integrações sem atualizar todos os clientes ou dados materialmente incorretos.
- **P2:** degradação parcial, uma integração/tenant afetado, atraso acima do SLO sem perda de dados.
- **P3:** defeito visual ou operacional com alternativa segura.

## Triagem segura

1. Registrar horário, rota, tenant afetado e request id sem copiar credenciais ou payload pessoal.
2. Consultar `/api/health`, deployment ativo, Vercel Functions e `sync_logs`/`security_audit_logs` em modo somente leitura.
3. Identificar último `last_success_at`, run ativa, heartbeat, checkpoint e circuit breaker.
4. Preservar o último snapshot válido. Não limpar tabelas nem reiniciar integrações por impulso.
5. Em suspeita de isolamento, bloquear o fluxo afetado e testar com duas empresas controladas antes de reabrir.

## Recuperação

- Preferir rollback do deployment para commit conhecido quando não houver incompatibilidade de schema.
- Migrations aditivas permanecem; contração exige migration posterior e prova de ausência de uso.
- Credenciais externas só são rotacionadas no provedor e pela funcionalidade apropriada; nunca editar ciphertext manualmente.
- Sincronizações retomáveis devem continuar por checkpoint. Não apagar pedidos, produtos ou estoque para “começar de novo”.

## Encerramento

Confirmar health, login, tenant isolation, sync, dashboards e freshness real. Registrar causa raiz, impacto, dados afetados, correção, teste de regressão e ação preventiva.
