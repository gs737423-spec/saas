---
type: decision
project: SaaS E-commerce
status: superseded
superseded_by: "docs/02-Decisions/2026-07-27 - Login Vintec Operation Run.md"
date: 2026-07-27
impact: medium
reversible: true
---

> **SUPERADA em 2026-07-27.** O dono reprovou a direção do Operations Engine
> (diagrama técnico/núcleo/painel lateral — leu como dashboard/arquitetura).
> Substituída pela direção "Vintec Operation Run" (card central único + ilustração
> de personagem correndo). O Operations Engine foi **removido** do código. Esta
> decisão fica registrada como histórico do que foi tentado e por que mudou.

# Painel de login "Vintec Operations Engine" (substitui screenshots)

## Contexto
A tela `/login` exibia screenshots reais da plataforma como painel visual
(`login-visual__preview`). Isso expunha telas do produto na área pública e não
comunicava o valor da Vintec. O dono pediu uma experiência proprietária,
abstrata e animada, alinhada ao posicionamento (centralização operacional),
mantendo intactos a identidade visual e o fluxo de autenticação Supabase.

## Problema
Como elevar a percepção do login a "SaaS premium" e comunicar
"dados dispersos → centralização → decisões claras" **sem** screenshots,
**sem** novas bibliotecas, **sem** abrir cadastro público e **sem** alterar a
lógica de auth já auditada?

## Opções consideradas
1. **Manter screenshots, só refinar o card.** Rejeitada: continua expondo o
   produto e não transmite conceito.
2. **Animação genérica de SaaS** (esfera/partículas/constelação). Rejeitada
   pelo brief e pelo ERR-001 (solução visual artificial).
3. **Composição SVG autoral "Operations Engine"** — 4 camadas (fundo, fontes,
   núcleo V, saídas) animadas por CSS/SVG. **Escolhida.**

## Decisão
Adotar o **Vintec Operations Engine**: componente visual desacoplado da
autenticação (`src/site/components/operations-engine/`), montado no painel maior
de um layout 40/60. Arquitetura **meio-termo** (aprovada pelo dono): extrair só
o novo/pesado (engine) + `LoginField`/`LoginCommercialAction`; a lógica de auth
permanece em `src/pages/Login.tsx`. Motor de animação declarativo em CSS/SVG
(timeline única de 15s), JS mínimo para reduced-motion, pausa por visibilidade e
parallax de cursor. Segunda ação = "Solicitar demonstração" via
`whatsappDemoUrl()` (nunca signup).

## Consequências positivas
- Nenhum print/mockup do produto no público (`imgCount=0` verificado).
- Identidade própria (monograma V + anéis), longe de template genérico.
- Zero dependências novas; build e TypeScript limpos.
- Fluxo de auth, recuperação de senha e proteções anti-enumeração preservados.
- Reduced-motion, responsivo e sem overflow validados.

## Riscos e consequências negativas
- `offset-path` (pacotes) exige navegador moderno — degrada ocultando os pacotes,
  sem quebrar o restante.
- Duas instâncias do engine no DOM (full/compact), uma sempre oculta por CSS.
- Ações comercial/suporte dependem de `VITE_WHATSAPP_*`; sem elas, ocultam-se.

## Plano de validação
`tsc` + `npm run build` limpos; Playwright real em 1440/820/390 (0 erros de
console, sem overflow, campos presentes, engine desktop/compacto, reduced-motion
estático). Login com Supabase deve ser exercido com credencial de teste antes de
produção (lógica inalterada).

## Plano de reversão
Mudança aditiva e localizada ao login. Reverter = restaurar o bloco
`login-visual*` em `site.css` e a versão anterior de `Login.tsx` (via git na
branch `feat/login-operations-engine`) e remover as pastas
`operations-engine/` e `login/`. Nenhuma migração de dados envolvida.

## Evidências
Screenshots da sessão (scratchpad): `login-desktop-1440-*.png`,
`login-mobile-390-*.png`, `login-filled.png`, `login-reduced-motion.png`.
Ver `docs/05-Sessions/2026-07-27 - Login Vintec Operations Engine.md`.
