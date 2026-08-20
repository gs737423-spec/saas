---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-07-23
impact: alto
reversible: parcial
---

# Migração do login para Supabase Auth real

## Contexto

O login em `/login` era 100% client-side: um objeto `USERS` hardcoded em
`src/contexts/AuthContext.tsx` guardava hashes SHA-256 de senha, comparados
no navegador contra o hash digitado. A "sessão" era só um JSON em
`sessionStorage`, sem verificação de servidor — forjável via DevTools sem
nunca passar por um backend. `@supabase/supabase-js` já estava instalado,
mas usado só server-side (`service_role`, sync do Mercado Livre), nunca para
autenticação de usuário.

## Problema

Qualquer pessoa com acesso ao bundle JS conseguia ler os hashes de senha ou
simplesmente forjar `sessionStorage` pra entrar sem credencial nenhuma. Não
havia proteção real contra força bruta, nem qualquer verificação de sessão
no servidor.

## Opções consideradas

- Manter e "reforçar" o login client-side (rate limit visual, mais
  complexidade de senha) — rejeitado: não resolve o problema de fundo, o
  segredo continua no bundle.
- Migrar para Supabase Auth real (`signInWithPassword`, sessão via SDK) —
  escolhida: já havia dependência instalada, projeto Supabase já em uso
  server-side, menor esforço de infraestrutura nova.
- Backend próprio de autenticação — descartado por escopo/tempo nesta fase.

## Decisão

Migrado para Supabase Auth:

- `src/lib/supabaseClient.ts` (novo): cliente do navegador com `VITE_SUPABASE_URL`
  + `VITE_SUPABASE_PUBLISHABLE_KEY`, sessão em `sessionStorage` (não
  `localStorage`) — fechar a aba/navegador exige login de novo, por pedido
  explícito do usuário.
- `AuthContext.tsx` reescrito: `signIn`/`signOut`/`resetPassword`, sessão via
  `onAuthStateChange`, mensagens de erro sempre genéricas (sem enumeração de
  usuário), trata 429 (rate limit real do Supabase Auth).
- `ProtectedRoute.tsx` (novo): guarda real de `/app/*`, com estado `loading`
  explícito pra evitar flash de dashboard ou de login.
- `ResetPassword.tsx` (novo): fluxo real de redefinição em `/redefinir-senha`.
- Removido: `USERS` hardcoded, hashes SHA-256, função `sha256`, comparação de
  senha no navegador, sessão manual, `VITE_DEMO_EMAIL`/`VITE_DEMO_PASSWORD_HASH`.
- Contas reais criadas manualmente no Supabase Dashboard pelo usuário:
  `g.souza.woork@gmail.com`, `rogsalazar@gmail.com` (esta troca o e-mail
  antigo de demonstração `rogger.salazar@climario.com.br`, que nunca foi uma
  conta real — só uma chave no objeto `USERS`).

Visual da página `/login` preservado integralmente durante a migração.

## Consequências positivas

- Autenticação verificada pelo servidor (Supabase), não mais pelo navegador.
- Nenhum segredo de senha no bundle JS.
- Rate limiting real (do próprio Supabase Auth) em vez de só fricção de UX.
- Recuperação de senha funcional de verdade.

## Riscos e consequências negativas

- Isolamento multiempresa (`company_members`, RLS, papéis) ainda não existe
  — é a Fase 2, deliberadamente fora desta migração. `company_id` nas
  tabelas de integração continua uma string fixa (`'default-company'`).
- MFA para contas privilegiadas não implementado ainda.
- Hashes SHA-256 do sistema antigo continuam recuperáveis no histórico do
  git (commits anteriores a esta migração) — não foi feito rewrite de
  histórico.
- Login válido de ponta a ponta não foi testado por mim (não tenho as
  senhas reais); só testei credencial inválida (400 real do Supabase) e
  recuperação de senha (200 real).
- Não confirmado se "Confirm email" está habilitado no projeto Supabase —
  se estiver e as contas não confirmaram o e-mail, login falha (mascarado
  pela mensagem genérica).

## Plano de validação

- [x] Build (`tsc && vite build`) sem erro.
- [x] Grep confirma ausência de `USERS`/hashes/`sha256`/`VITE_DEMO_*` no código.
- [x] Chamada real `POST /auth/v1/token?grant_type=password` confirmada via
      rede (400 pra credencial inválida).
- [x] Chamada real `POST /auth/v1/recover` confirmada via rede (200).
- [x] `/app` sem sessão redireciona pra `/login`.
- [x] Deploy em produção verificado sem crash.
- [ ] Login válido com senha real — pendente, exige o usuário testar.
- [ ] Confirmação de e-mail das contas criadas — pendente, verificar no
      Supabase Dashboard.

## Plano de reversão

Reverter para o commit anterior à migração (`51b76d3`) restaura o login de
demonstração. Não recomendado — reintroduz o problema de segurança que
motivou esta decisão. Se necessário reverter parcialmente, a branch
`feat/supabase-auth-foundation` isola todas as mudanças desta migração.

## Evidências

- Investigação original: agente de auditoria confirmou `USERS`/SHA-256/
  `sessionStorage` manual em `src/contexts/AuthContext.tsx` (versão anterior).
- Rede: `dnaykdoehbwmbsufcrxk.supabase.co/auth/v1/token` (400) e
  `/auth/v1/recover` (200), capturados via DevTools durante testes manuais.
- Commits: `12b18b5` (migração), `5b63f85` (carrossel + sessionStorage).
