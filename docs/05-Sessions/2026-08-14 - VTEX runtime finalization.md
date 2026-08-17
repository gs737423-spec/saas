# Sessão — VTEX runtime finalization

Data: 2026-08-14

## Resultado

- preservada a frequência de sync por conexão em 24 horas, separada do wake-up do cron a cada 15 minutos;
- cron passou a carregar somente conexões VTEX com credenciais, vencidas, fora do breaker e sem lock válido;
- observabilidade do cron passou a usar somente contadores agregados e sanitizados;
- manual sync ignora `next_sync_at`, mas respeita autorização, run ativa, lock e breaker;
- breaker persistente passou a bloquear cold starts por 60 minutos após cinco falhas consecutivas de run;
- construção/decrypt do cliente VTEX entrou no bloco protegido e o lock passou a ser liberado em `finally`;
- canais descobertos passaram a vir de `vtex_channel_mappings` + `sales_channels`, sem lista total fixa;
- mapping unresolved pode apontar para canal existente ou criar canal analítico válido via API tenant-scoped;
- reclassificação histórica ficou explícita por full sync, preservando deduplicação/proveniência;
- criada consulta read-only `supabase/manual/018_019_history_check.sql` para verificar migration history;
- runbook recebeu política de agenda, breaker, envs e regra operacional da master key.

## Decisões

- AUTO SYNC: 24h por conexão; cron apenas verifica/retoma a cada 15min.
- MANUAL SYNC: bypass somente de agenda.
- Circuit breaker durável: threshold 5, cooldown 60min; breaker em memória continua como proteção local de 60s.
- Mapping posterior não promete efeito retroativo imediato; requer full sync explícita.
- Nenhuma alteração de banco ou migration foi necessária.

## Validações

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test:run`: PASS — 14 arquivos, 118 testes.
- `npm.cmd run test:security`: PASS — 7 arquivos, 65 testes.
- `npm.cmd run security:service-role-scan`: PASS.
- `npm.cmd run security:check`: PASS, incluindo build com 1.929 módulos.
- `npm.cmd run build`: PASS dentro de `security:check`; duas repetições isoladas posteriores ficaram presas antes de emitir o banner do npm por saturação transitória do executor, sem erro de compilação.
- suíte VTEX focada: PASS — 42 testes.
- `git diff --check`: duas tentativas expiraram antes de o Git iniciar, depois da saturação do executor; não foi declarado PASS. Uma varredura equivalente de whitespace/conflitos nos 29 arquivos tracked modificados não encontrou problemas.

## Pendências reais

- configurar e confirmar envs em Vercel Production/Preview sem expor valores;
- repetir `git diff --check` em executor saudável antes do commit;
- verificar history remoto com SQL read-only e, somente se necessário, planejar `migration repair` separado;
- executar teste RLS real com dois tenants/sessões — testes locais não substituem essa prova;
- após deploy autorizado, smoke test com conta VTEX autorizada e first full sync;
- master key não possui rotação dual-key/versionada.

## Git e produção

- no stage;
- no commit;
- no push;
- no deploy;
- nenhuma operação remota de banco;
- migrations 018/019 não foram editadas nesta sessão.
