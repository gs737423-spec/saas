---
type: session
project: SaaS E-commerce
date: 2026-08-13
status: completed
---

# Correcao de MFA no painel administrativo

## Resultado

A verificacao de fatores MFA administrativos passou da rota PostgREST de `auth` para a API administrativa oficial do Supabase. Respostas `503` que nao sejam configuracao ausente deixam de ser rotuladas incorretamente como variavel faltando.

## Validacao

- `npm.cmd run build` passou.
- `git diff --check` passou.

## Proxima acao

- Publicar e validar o login administrativo no deployment da Vercel.
