---
type: current-state
project: SaaS E-commerce
status: needs-audit
updated: 2026-07-23
---

# Estado atual

> Este documento deve conter apenas fatos confirmados no código, nos testes ou na infraestrutura.

## Stack confirmada
- [x] Framework: React 19 + Vite 8 + React Router 7
- [x] Linguagem: TypeScript
- [x] Banco: Supabase Postgres — usado hoje só server-side (`service_role`), para sync do Mercado Livre. Nenhuma tabela de negócio (produtos, pedidos, estoque) confirmada como real; dashboard consome dados mockados via `src/services/api.ts`.
- [x] Autenticação: Supabase Auth (`signInWithPassword`/`onAuthStateChange`), migrado em 2026-07-23 — ver decisão `docs/02-Decisions/2026-07-23 - Migracao do login para Supabase Auth real.md`. Sessão em `sessionStorage` (não sobrevive a fechar a aba/navegador).
- [x] Hospedagem: Vercel (projeto "saas", deploy via push em `main`)
- [ ] Testes: nenhum script de teste automatizado encontrado (só `dev`/`build`/`preview` no `package.json`)
- [x] Integrações: Mercado Livre (OAuth + sync), server-side via `api/integrations/mercadolivre/*` — env vars de produção não confirmadas como configuradas (ver decisão de auditoria anterior)

## Funcionalidades confirmadas
- [x] Visão Geral (Dashboard) — 2026-08-04: os 5 KPIs (`KPICards`) agora leem `orders`/`order_items` reais via `/api/dashboard/summary` quando a empresa tem Mercado Livre conectado e sincronizado; sem conexão/sync, cai em `source:'demo'` com banner explícito avisando que é mock. Requer migration `010_order_fee_amount.sql` aplicada no Supabase (comissão do pedido, campo `fee_amount`) — **rodar manualmente**, ainda não confirmado como aplicada em produção. `MarketplaceComparison` (tabela por canal D-1/D-7/D-30/D-365) continua 100% mock — precisaria de histórico agregado por bucket de data que não existe hoje.
- [ ] Produtos — UI existe, dados mockados
- [ ] Produto 360 — não auditado nesta rodada
- [x] Login — real (Supabase Auth); credencial inválida e recuperação de senha testadas por chamada de rede real (login **válido** ponta a ponta não testado, sem senha real). Painel visual reformulado em 2026-07-28 para **"Vintec Expanding Access"**: **um único card central** que inicia **compacto** (assinatura Vintec + headline + botão "Entrar") e **expande na mesma superfície** para revelar o formulário — sem trocar de página, sem modal, sem tela dividida, sem ilustração/personagem. Máquina de estados `collapsed → expanding → expanded → closing` (abre por click/Enter/Space; Escape recolhe só quando não há campos preenchidos/erro/envio; foco vai ao e-mail ao abrir e volta ao botão ao fechar; respeita `prefers-reduced-motion`). Componentes em `src/site/components/login-expanding/`; a **lógica de auth permanece em `Login.tsx`** (signIn/resetPassword/cooldown/soft-limit/anti-enumeração/loading/erro/redirect) e chega ao card por um `bridge`. Cadastro segue **fechado**; ação comercial real via `whatsappDemoUrl()`. **Removidas** as tentativas anteriores (`login-motion/` + CSS `.lm-*`/`.scene-*`). Validado: `npm run build` limpo; Playwright em 9 breakpoints (1536→360) sem overflow; credencial inválida → erro real do Supabase; recuperação, mostrar-senha, teclado e reduced-motion OK. Ver `docs/05-Sessions/2026-07-28 - Login Expanding Access.md`.
- [ ] Multiempresa — não existe ainda (Fase 2, planejada em `docs/02-Decisions/`); `company_id` é string fixa `'default-company'`
- [x] Suporte (tickets) — 2026-08-06: cliente abre chamado em `/app/suporte` (lista + thread de mensagens), admin responde/muda status em `/app/admin/suporte`. Tabelas `support_tickets`/`support_messages` (migration `013_support_tickets.sql`, ainda **não confirmada como aplicada em produção** — rodar manualmente). Endpoints `api/support/tickets.ts` (tenant, `requireCompany`) e `api/admin/support-tickets.ts` (admin, `requireAdmin`), isolamento por `company_id` replicado no código (RLS como defesa extra). Sem notificação por e-mail. Não testado ponta a ponta em navegador (sem credencial de teste disponível nesta sessão) — só `tsc --noEmit` e `vite build` confirmados limpos.
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
| Sem isolamento multiempresa real | `company_id` fixo `'default-company'` em `supabase/migrations/002_*.sql` | Alto — bloqueador para 2º cliente | Aberto (Fase 2 planejada) |
| Sem MFA para contas privilegiadas | Não implementado | Médio | Aberto |
| Hashes SHA-256 do login antigo no histórico do git | Commits anteriores a 2026-07-23 | Baixo/médio | Aberto, decisão de rewrite de histórico pendente |
| `.env.example` pode ainda listar `VITE_DEMO_EMAIL`/`VITE_DEMO_PASSWORD_HASH` (não usadas mais) | Não confirmado (arquivo bloqueado por permissão de leitura nesta sessão) | Baixo | Não verificado |

## Próximas validações
- [ ] Auditar estrutura de pastas.
- [ ] Mapear rotas.
- [ ] Mapear serviços e fontes de dados.
- [ ] Verificar isolamento por tenant (Fase 2 do Supabase Auth).
- [x] Verificar código duplicado ou possivelmente obsoleto — feito em 2026-07-23: removidos `DifferentialRow.tsx`, `outcomes.ts`, `EcosystemMarquee.tsx`, `PlatformCardSection.tsx` e CSS órfão associado (`.services-panel`, `.diff-row*`).
- [ ] Confirmar login válido de ponta a ponta com as contas reais criadas no Supabase.
- [ ] Confirmar se "Confirm email" está habilitado no Supabase Auth.
- [ ] Confirmar env vars de produção da integração Mercado Livre na Vercel.
