---
type: current-state
project: SaaS E-commerce
status: needs-audit
updated: 2026-08-13
---

# Estado atual

> Este documento deve conter apenas fatos confirmados no código, nos testes ou na infraestrutura.

## Stack confirmada
- [x] Framework: React 19 + Vite 8 + React Router 7
- [x] Linguagem: TypeScript
- [x] Banco: Supabase Postgres — sempre server-side (`service_role`, `api/**`). Tabelas de negócio reais e em uso: `companies`, `company_members`, `platform_admins`, `marketplace_connections`, `marketplace_products`, `marketplace_inventory`, `orders`, `order_items`, `sync_logs`, `support_tickets`, `support_messages`, `leads`, `rate_limits`. RLS habilitado em todas, com policy por `company_id`/`is_platform_admin()` (auditado em 2026-08-12).
- [x] Autenticação: Supabase Auth (`signInWithPassword`/`onAuthStateChange`), migrado em 2026-07-23 — ver decisão `docs/02-Decisions/2026-07-23 - Migracao do login para Supabase Auth real.md`. Sessão em `sessionStorage` (não sobrevive a fechar a aba/navegador).
- [x] Hospedagem: Vercel (projeto "saas", deploy via push em `main`)
- [ ] Testes: nenhum script de teste automatizado encontrado (só `dev`/`build`/`preview` no `package.json`)
- [x] Integrações: Mercado Livre e Shopee (OAuth + sync completo: produtos, estoque, pedidos, auto-refresh de token), server-side via `api/integrations/{provider}/*`. Sync agendado diário via Vercel Cron (`api/cron/sync-all.ts`) desde 2026-08-12, além do botão manual. Amazon/Magalu/Loja Própria só enum, sem OAuth real. Env vars de produção não confirmadas como configuradas (ver "Próximas validações")
- [x] Concorrência de sync: Mercado Livre e Shopee usam a mesma trava atômica por conexão (`sync_started_at`). Sem a migration `015_connection_sync_lock.sql`, os endpoints respondem `503 migration_pending` e não gravam sem essa proteção.

## Funcionalidades confirmadas
- [x] Densidade adaptativa do workspace desktop — em 2026-08-13, as quatro rotas do shell usam tokens fluidos de gap, padding, KPI, controles e tabela. Em alturas menores, o chrome diminui moderadamente; em alturas maiores, a area adicional e destinada a mais dados e ao grafico. Produtos e Estoque preservam scroll interno e header sticky, sem body scroll desktop. Dark e mobile nao foram estruturalmente alterados. Ver decisao `docs/02-Decisions/2026-08-13 - Densidade adaptativa do workspace.md`.
- [x] Light mode Neutral Editorial Enterprise — em 2026-08-13, os tokens de superficie foram migrados de soft slate/blue-gray para uma escala neutral `#DADCD9` (canvas), `#E6E8E5` (section), `#F2F3F1` (card), `#FAFAF8` (raised), com cabecalho de tabela `#D7DAD6`. A TopNav light preserva estrutura e motion, mas usa charcoal neutral `#202120` → `#272927` → `#2D2F2D`; dark mode e arquitetura de viewport nao foram alterados. Ver decisao `docs/02-Decisions/2026-08-13 - Light mode neutral editorial enterprise.md`.
- [x] Shell desktop das rotas `/app`, `/app/marketplaces`, `/app/produtos` e `/app/estoque` — em `md+`, o conteudo operacional ocupa o viewport disponivel abaixo da TopNav. Dashboard comprime o painel GMV com overflow interno apenas em altura extrema; Marketplaces permite rolagem vertical dentro da propria pagina quando a altura nao comporta o grafico completo, preservando plot e resumo sem corte; Produtos e Estoque mantem filtros/cabecalhos fixos e rolam somente o viewport das tabelas (incluindo overflow horizontal do Estoque). Mobile preserva fluxo e BottomNav. Corrigido em 2026-08-13; validado por `tsc && vite build`.
- [x] Tema da plataforma e navegação desktop — 2026-08-12: light mode usa Soft Slate `#E3E8EE` (canvas) → `#EEF2F6` (section) → `#F7F9FB` (card) → `#FFFFFF` (raised/control), com header de tabela `#E8EDF2`, bordas `#CDD5DE`/`#BEC8D2` e linhas transparentes. A Floating Navigation Island mantém 64px e content width aprovados e usa material graphite/blue-steel: `#1A2430` → `#223241` → `#263747` no light e `#111A23` → `#16212C` → `#1A2733` no dark, com dois separadores internos. O indicador único continua em `transform` (260ms); mobile e `BottomNav` permanecem estruturalmente inalterados. Ver decisão `docs/02-Decisions/2026-08-12 - Light mode soft slate e topbar material.md`.
- [x] Visão Geral (Dashboard) — os 5 KPIs (`KPICards`) leem `orders`/`order_items` reais via `/api/dashboard/summary` quando a empresa tem marketplace conectado e sincronizado; sem conexão/sync, cai em `source:'demo'` com banner explícito avisando que é mock. Requer migration `010_order_fee_amount.sql` aplicada no Supabase — ainda não confirmado como aplicada em produção. `RealMarketplaceBreakdown.tsx` (substituiu o antigo `MarketplaceComparison` mock) já lê D-1/D-7/D-30/D-365 real de `api/dashboard/finance.ts`, calculado on-the-fly a partir de `orders` — **não é mais mock** (correção de 2026-08-12, doc anterior estava desatualizado).
- [ ] Produtos — UI existe, dados mockados
- [ ] Produto 360 — não auditado nesta rodada
- [x] MFA administrativo: opt-in para `platform_admins`; quando há fator TOTP verificado, `requireAdmin` exige claim JWT `aal2` em todas as APIs administrativas. O login mantém o desafio visível enquanto a sessão está em AAL1.
- [x] Login — real (Supabase Auth); credencial inválida e recuperação de senha testadas por chamada de rede real (login **válido** ponta a ponta não testado, sem senha real). Painel visual reformulado em 2026-07-28 para **"Vintec Expanding Access"**: **um único card central** que inicia **compacto** (assinatura Vintec + headline + botão "Entrar") e **expande na mesma superfície** para revelar o formulário — sem trocar de página, sem modal, sem tela dividida, sem ilustração/personagem. Máquina de estados `collapsed → expanding → expanded → closing` (abre por click/Enter/Space; Escape recolhe só quando não há campos preenchidos/erro/envio; foco vai ao e-mail ao abrir e volta ao botão ao fechar; respeita `prefers-reduced-motion`). Componentes em `src/site/components/login-expanding/`; a **lógica de auth permanece em `Login.tsx`** (signIn/resetPassword/cooldown/soft-limit/anti-enumeração/loading/erro/redirect) e chega ao card por um `bridge`. Cadastro segue **fechado**; ação comercial real via `whatsappDemoUrl()`. **Removidas** as tentativas anteriores (`login-motion/` + CSS `.lm-*`/`.scene-*`). Validado: `npm run build` limpo; Playwright em 9 breakpoints (1536→360) sem overflow; credencial inválida → erro real do Supabase; recuperação, mostrar-senha, teclado e reduced-motion OK. Ver `docs/05-Sessions/2026-07-28 - Login Expanding Access.md`.
- [x] Multiempresa — **implementada e auditada em 2026-08-12** (estava marcada como pendente por engano — a auditoria anterior não tinha lido `supabase/migrations/003-005/007` nem `src/server/auth/requireCompany.ts`). `companies` + `company_members` reais, com RLS (`003_companies_and_members.sql`). `requireCompany.ts` resolve `company_id` via `company_members`, nunca aceita da URL pra cliente comum; `platform_admins`/`requireAdmin` pra equipe interna, exige `?company_id=` explícito. 25/25 endpoints de `api/**` auditados usam `requireCompany`/`requireAdmin` + filtro `.eq('company_id', ...)`. `company_id = 'default-company'` (migration `002`) é só DEFAULT legado de coluna, não usado em nenhuma query de aplicação. Fluxo completo de criar empresa (`api/admin/companies.ts`) e convidar membro (`api/admin/invite.ts`, `api/team.ts`) funcionando. **Pendente**: teste real (não só auditoria estática) com 2+ empresas simultâneas — fica para a fase de testes.
- [x] Suporte (tickets) — 2026-08-06: cliente abre chamado em `/app/suporte` (lista + thread de mensagens), admin responde/muda status em `/app/admin/suporte`. Tabelas `support_tickets`/`support_messages` — migration renumerada em 2026-08-12 pra `016_support_tickets.sql`/`017_support_tickets_length_limits.sql` (colidia de número com `013_leads.sql`/`014_company_logo.sql`); ainda **não confirmada como aplicada em produção** — rodar manualmente. Endpoints `api/support/tickets.ts` (tenant, `requireCompany`) e `api/admin/support-tickets.ts` (admin, `requireAdmin`), isolamento por `company_id` no código + RLS real (`company_id::text in user_company_ids()`). Sem notificação por e-mail. Não testado ponta a ponta em navegador (sem credencial de teste disponível) — só `tsc --noEmit` e `vite build` confirmados limpos.
- [ ] Demais módulos — não auditados nesta rodada

## Dados atuais
- Origem: mockada (`src/services/api.ts`, todo método usa `delay()` + array fixo)
- Mocks: sim, é a fonte de dado principal do dashboard hoje
- Banco: Supabase Postgres existe e está configurado, mas só alimenta a integração Mercado Livre server-side
- APIs: `api/integrations/mercadolivre/*` (Vercel serverless), `api/leads.ts`, `api/dashboard/inventory.ts`, `api/integrations/logs.ts`
- Estado de sincronização: não confirmado se as env vars de produção (`SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY`/`ML_*`) estão de fato configuradas na Vercel — usuário relatou não encontrar `SUPABASE_URL` lá numa checagem anterior

## Problemas conhecidos
| Problema | Evidência | Impacto | Status |
|---|---|---|---|
| Isolamento multiempresa nunca testado com dados reais (só auditoria estática de código) | — | Médio | Aberto — fica pra fase de testes |
| MFA de admin ainda não validado com conta real TOTP | Enforcement estático no login + `requireAdmin` (2026-08-13) | Médio | Aberto — requer teste ponta a ponta |
| Hashes SHA-256 do login antigo no histórico do git | Commits anteriores a 2026-07-23 | Baixo/médio | Aberto — ninguém externo teve acesso ao repo até 2026-08-12; rewrite adiado por decisão do usuário até haver colaborador externo/repo público |
| `.env.example` pode ainda listar `VITE_DEMO_EMAIL`/`VITE_DEMO_PASSWORD_HASH` (não usadas mais) | Não confirmado | Baixo | Não verificado |
| `listUsers` só buscava página 1 (1000 usuários) ao resolver convite de e-mail já cadastrado | `api/admin/invite.ts`, `api/team.ts` | Médio — quebraria convite passando de 1000 usuários na plataforma | **Corrigido em 2026-08-12** (commit `e7d868d`, `findUserIdByEmail` pagina até achar) |

## Próximas validações
- [ ] Auditar estrutura de pastas.
- [ ] Mapear rotas.
- [ ] Mapear serviços e fontes de dados.
- [ ] Verificar isolamento por tenant (Fase 2 do Supabase Auth).
- [x] Verificar código duplicado ou possivelmente obsoleto — feito em 2026-07-23: removidos `DifferentialRow.tsx`, `outcomes.ts`, `EcosystemMarquee.tsx`, `PlatformCardSection.tsx` e CSS órfão associado (`.services-panel`, `.diff-row*`).
- [x] Verificar isolamento por tenant — auditoria estática feita em 2026-08-12 (ver "Multiempresa" acima); nenhum vazamento cross-tenant encontrado em 25 endpoints revisados.
- [ ] Testar isolamento por tenant com dados reais (2+ empresas simultâneas) — fica pra fase de testes.
- [ ] Confirmar login válido de ponta a ponta com as contas reais criadas no Supabase.
- [ ] Confirmar se "Confirm email" está habilitado no Supabase Auth.
- [ ] Confirmar env vars de produção das integrações (ML_*, SHOPEE_*) na Vercel.
- [ ] Confirmar migrations `010_order_fee_amount.sql` e `016/017_support_tickets*.sql` aplicadas em produção.
- [x] Migration `015_connection_sync_lock.sql` aplicada e confirmada no Supabase em 2026-08-13 (`sync_started_at timestamptz`).
- [ ] Configurar `CRON_SECRET` na Vercel (novo, 2026-08-12) — sem essa env var, `api/cron/sync-all.ts` responde 503 e o sync agendado não roda (endpoint recusa disparo sem o secret, por design — nunca falha aberto).
