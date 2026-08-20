# Runbook VTEX

## Antes de habilitar

1. Tratar `018` e `019` como já aplicadas manualmente; não executá-las novamente.
2. Executar somente a consulta `supabase/manual/018_019_history_check.sql` no SQL Editor e conferir `supabase migration list --linked` antes de qualquer futuro `db push`.
3. O histórico remoto 001–023 foi reconciliado em 2026-08-20 somente após auditoria física read-only 23/23. Em divergência futura, repetir a prova dos objetos da versão afetada antes de qualquer `migration repair`; nunca reaplicar SQL já presente por impulso.
4. Rodar o teste real de RLS com duas sessões/empresas e o smoke test VTEX autorizado.
5. Configurar `INTEGRATIONS_ENCRYPTION_KEY` e `CRON_SECRET` apenas no servidor.
6. Criar application key VTEX de menor privilégio com Catalog, Orders e Logistics; Pricing/Feed somente se usados.
7. Mapear `affiliateId` conhecidos por tenant.
8. Executar teste de conexão e full sync com uma conta sandbox/autorizada.
9. Conferir amostras de SKU, estoque por warehouse, pedidos, cancelados, D-1/D-7/D-30/D-365 e duplicidade com conectores diretos.

## Operação

- `connected`: pronto ou último sync completo.
- `syncing`: run ativa; o cron retoma checkpoint.
- `requires_attention`: dados anteriores preservados; revisar `last_error`, permissões ou affiliate desconhecido.
- `error`: falha estrutural/transiente; o cron poderá retentar quando agenda e breaker permitirem.

O cron acorda a cada 5 minutos (fonte de verdade: `vercel.json`), mas cada conexão tem agenda própria. Uma run `queued` ativa tem prioridade de retomada e não espera a conexão voltar a ficar `due`. Sem run ativa, AUTO SYNC só carrega conexões com credenciais presentes, `next_sync_at` nulo/vencido, `circuit_open_until` nulo/vencido e lock nulo/obsoleto. Uma conclusão `success` ou `partial` agenda a próxima execução para 24 horas depois e zera o contador de falhas de run; erros de item continuam registrados no run parcial.

MANUAL SYNC ignora `next_sync_at` porque foi solicitado por usuário autorizado, porém não ignora run ativa, lock ou breaker. Depois de cinco falhas consecutivas de run, o breaker durável abre por 60 minutos. O breaker em memória de 60 segundos permanece apenas como proteção local imediata; o banco é a fonte entre cold starts.

O cron retorna e registra somente agregados sanitizados: conexões verificadas/vencidas, skips por agenda/circuito/lock e syncs iniciadas/concluídas/parciais/falhas. IDs de empresa, credenciais e payloads não entram na resposta.

## Variáveis de ambiente

| Variável | Visibilidade | Production | Preview |
|---|---|---:|---:|
| `VITE_SUPABASE_URL` | pública/client bundle | obrigatória | obrigatória |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | pública/client bundle | obrigatória | obrigatória |
| `SUPABASE_URL` | servidor; não secreta | obrigatória | obrigatória |
| `SUPABASE_SERVICE_ROLE_KEY` | servidor/secreta | obrigatória | obrigatória |
| `INTEGRATIONS_ENCRYPTION_KEY` | servidor/secreta | obrigatória | obrigatória |
| `CRON_SECRET` | servidor/secreta | obrigatória | obrigatória para testar o endpoint Preview |

Gerar uma nova chave de 32 bytes sem imprimir nenhuma chave existente:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Use o comando uma vez para `INTEGRATIONS_ENCRYPTION_KEY` e outra vez para `CRON_SECRET`. **GERAR UMA VEZ E NÃO TROCAR DEPOIS DE CLIENTES CONECTADOS.** Ainda não existe rotação dual-key/versionada; trocar a master key torna as credenciais já criptografadas indecifráveis. Não prefixar nenhum segredo com `VITE_`.

429 respeita `Retry-After`; 502/503/504 e rede usam backoff exponencial com jitter. 401/403 não são escondidos como indisponibilidade.

## Rotação e incidente

Novas credenciais VTEX são testadas antes de substituir as anteriores. Nunca cole segredos em ticket, log ou documento. Em suspeita de vazamento, revogue a application key na VTEX, gere outra com menor privilégio, use a rotação no MKTOnline e revise `security_audit_logs`. Rotação da application key VTEX não é o mesmo que trocar `INTEGRATIONS_ENCRYPTION_KEY`.

## Monitoramento mínimo

- Monitorar `GET /api/health` externamente; qualquer `503` significa configuração ou banco indisponível.
- Alertar quando não houver execução do cron VTEX por 10 minutos.
- Alertar para runs `running` sem heartbeat, `failed`, `partial`, circuit breaker aberto e crescimento contínuo de `queued`.
- Acompanhar por conexão `last_success_at`, não apenas `last_sync_at`.
- Um HTTP 200 do cron não basta: conferir os contadores de conexões selecionadas, retomadas, concluídas, parciais e falhas.

## Rollback

Desative a conexão e o cron VTEX; não apague dados históricos. Como a migration é expansiva, o código anterior ignora as novas tabelas/colunas. A contração do schema deve ser uma migration futura, separada e somente após prova de ausência de uso.
