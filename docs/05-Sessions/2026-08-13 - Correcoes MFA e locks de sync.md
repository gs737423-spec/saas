---
type: session
project: SaaS E-commerce
date: 2026-08-13
status: completed-code-pending-production-validation
---

# Correções de MFA e locks de sincronização

## Resultado

- MFA opt-in de administradores passou a ser aplicado por `requireAdmin` no servidor via claim JWT `aal2`, quando há fator TOTP verificado.
- Login não redireciona uma sessão AAL1 antes de exibir o desafio TOTP.
- Lock atômico por `marketplace_connections.id` foi extraído para `src/server/integrations/syncLock.ts` e usado por Mercado Livre e Shopee.
- Ausência de `sync_started_at` agora produz `503 migration_pending`, evitando sync concorrente sem proteção.

## Validações e pendências

- `npx tsc --noEmit` concluído com sucesso.
- Pendente: build completo, revisão final do diff e teste real de MFA/TOTP e migration em ambiente controlado.
- A migration `015_connection_sync_lock.sql` foi aplicada e confirmada pelo usuário no Supabase após a implementação; nenhum outro dado, segredo ou configuração de produção foi alterado nesta sessão.
