# Pós-migration 018/019 e readiness VTEX

Data: 2026-08-14

## O que foi feito

- Registrado, com base no relato do usuário, que os pre-flights, aplicações e verifies das migrations 018/019 passaram no Supabase SQL Editor.
- Auditado localmente o histórico de migrations, env vars, Vercel, cron, endpoints VTEX, fluxo de conexão, segredos, registry universal e compatibilidade entre schema e código.
- Nenhum banco, projeto Supabase, Vercel ou API VTEX foi acessado.

## O que mudou

- `supabase/manual/018_verify.sql` passou a documentar que `service_role_can_select` é observacional; os gates críticos são RLS, bloqueio de anon/authenticated e INSERT backend da service role.
- Estado atual e runbooks foram atualizados para não sugerirem reaplicação das migrations já executadas manualmente.
- As migrations 018/019 não foram alteradas.

## Decisões e rejeições

- Tratar o schema remoto como contendo 018/019, conforme evidência fornecida pelo usuário.
- Não executar `migration repair`, `migration list`, `db push`, deploy, conexão VTEX real ou alteração de schema nesta sessão.
- Não criar migration 020 sem blocker concreto.
- Não considerar o runtime pronto para produção enquanto código, env vars, cron e smoke test não forem comprovados.

## Achados relevantes

- Runtime VTEX está somente no working tree da `main`; `HEAD` e `origin/main` continuam no mesmo commit anterior ao runtime VTEX.
- `CRON_SECRET`, `INTEGRATIONS_ENCRYPTION_KEY` e env vars Supabase/Vite não foram inspecionadas local ou remotamente.
- Cron VTEX está configurado a cada 15 minutos, mas ordena sem filtrar `next_sync_at`, enquanto o sync grava `next_sync_at` para 24 horas depois.
- `circuit_open_until` persistido não é consultado antes de iniciar uma nova tentativa; o circuit breaker efetivo do cliente é em memória do processo serverless.
- A UI não apresenta a matriz de permissões e não lista as identidades VTEX unresolved registradas no banco; o editor atual cobre apenas canais conhecidos.
- A chave mestra de criptografia não possui rotação versionada/dual-key; mudar o valor torna ciphertext anterior indecifrável até nova credencial ser informada.
- Os nomes de tabelas e colunas esperados pela migration 019 coincidem com o código atual.

## Validações

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run test:run`: 109/109 PASS em 13 arquivos.
- `npm.cmd run test:security`: 61/61 PASS em 7 arquivos.
- `npm.cmd run security:service-role-scan`: PASS.
- `npm.cmd run build`: PASS, 1.929 módulos.
- `npm.cmd run security:check`: PASS.
- `git diff --check`: PASS, com avisos não bloqueantes de LF para CRLF.

## Erro observado

- A primeira tentativa via `npm` falhou porque PowerShell bloqueou `npm.ps1`; a execução correta usou `npm.cmd`.
- O Vitest inicialmente recebeu `spawn EPERM` no sandbox; os gates foram repetidos fora do sandbox, apenas localmente, e passaram.

## Próxima ação

1. Instalar/pinar a Supabase CLI e, com autorização separada, conferir `supabase migration list --linked`.
2. Se somente 018/019 estiverem ausentes no histórico remoto, executar `migration repair` em tarefa separada e validar novamente a lista.
3. Corrigir os blockers operacionais do cron/circuit breaker e os gaps do wizard sem alterar schema.
4. Configurar env vars server-side, publicar o código e executar smoke test com empresa e credenciais VTEX de teste autorizadas.

## Aprendizado proposto

- Após aplicação manual de migration, atualizar imediatamente o estado local e bloquear `db push` até reconciliar o histórico.
- Tratar privilégios herdados da `service_role` como observação de plataforma, sem confundir RLS com grants SQL explícitos.

As propostas acima não foram promovidas à memória oficial e dependem de aprovação do usuário.
