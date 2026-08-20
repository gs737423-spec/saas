---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-13
impact: high
reversible: true
---

# MFA opt-in com enforcement server-side para administradores

## Decisão

MFA TOTP permanece opcional para `platform_admins`. Depois que um administrador possui ao menos um fator verificado, toda API protegida por `requireAdmin` exige JWT com `aal = aal2`; a interface sozinha não é considerada controle de acesso.

## Implementação

- `requireAdmin` consulta fatores verificados do usuário autenticado no endpoint server-side `auth/factors` e bloqueia com `403 mfa_required` se a sessão não for AAL2.
- A claim `aal` é lida somente depois de `requireUser` validar o JWT com Supabase Auth.
- `Login.tsx` mantém a rota no desafio enquanto a sessão AAL1 está em `view === 'mfa'`.
- Falha ao consultar fatores responde `503`, sem liberar acesso administrativo.

## Consequências e reversão

Administradores sem TOTP não mudam de fluxo; quem optou precisa concluir o código para qualquer API administrativa, inclusive chamadas diretas. Reverter os blocos em `requireAdmin.ts` e `Login.tsx`; não há alteração de banco, credencial ou dado de tenant.
