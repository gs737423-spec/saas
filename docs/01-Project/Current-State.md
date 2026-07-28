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
- [ ] Visão Geral — UI existe, dados mockados
- [ ] Produtos — UI existe, dados mockados
- [ ] Produto 360 — não auditado nesta rodada
- [x] Login — real (Supabase Auth), testado com credencial inválida (400) e recuperação de senha (200) via chamada de rede real. Login **válido** ponta a ponta não testado (sem senha real disponível). Painel visual redesenhado em 2026-07-27/28 — **Fase 1 estática concluída** (2026-07-28): layout **"Vintec Motion Card"** = **card vertical único centralizado** (`max-width 460px`), com uma **faixa visual compacta no topo** (`login-motion/LoginMotionHeader`, SVG autoral: fragmentado → slot do corredor → organizado) e o **formulário abaixo**. Sem layout em duas colunas. O corredor é um **slot reservado** (marcador "sprite (pendente)") aguardando a **sprite profissional da Fase 2** — **sem animação** nesta fase. Tentativas anteriores reprovadas: "Operations Engine" (diagrama técnico) e "Operation Run/Scene" (personagem/composição hand-code). **Fluxo de auth inalterado** (signIn/resetPassword/cooldown/anti-enumeração). Responsivo desktop 1440×900 e mobile 390×844 (Playwright: 0 erros, sem overflow, sem screenshots de plataforma). Ver `docs/05-Sessions/2026-07-28 - Login Fase 1 estatica.md`.
- [ ] Multiempresa — não existe ainda (Fase 2, planejada em `docs/02-Decisions/`); `company_id` é string fixa `'default-company'`
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
