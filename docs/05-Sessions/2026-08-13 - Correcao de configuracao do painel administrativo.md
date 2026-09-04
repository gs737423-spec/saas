---
type: session
project: SaaS E-commerce
date: 2026-08-13
status: completed
---

# Correcao de configuracao do painel administrativo

## Resultado

As APIs do Supabase agora aceitam `VITE_SUPABASE_URL` como fallback para a URL publica. A service role continua obrigatoria e somente server-side. O painel administrativo informa os nomes de variaveis ausentes sem expor valores.

## Validacao

- `npm.cmd run build` passou.
- `git diff --check` passou.

## Proxima acao

- Publicar e testar login de uma conta em `platform_admins` em producao.
