---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Refinamento anti-glare e motion da floating navigation.md
---

# Light mode monocromático e Floating Navigation alinhada

## Contexto

O refinamento anterior reduziu branco puro, mas a diferença de luminância entre
app, seções e cards ainda era pequena. A interpretação clara da ilha no tema
light também retirava sua função de âncora visual.

## Decisão

- Light usa escala estrutural blue-gray: `#DDE5EB` (app), `#E7EDF2` (seção),
  `#F3F6F8` (card) e `#F7F9FA` (elevado), com borders `#CCD7DF`, `#BDC9D3`
  e `#AAB9C5`.
- A ilha desktop usa o mesmo content width previsto para a aplicação:
  `min(1600px, viewport - 2 × gutter)`. Continua flutuante, nunca full viewport.
- O interior da ilha é grid de três zonas: marca à esquerda, rotas no centro
  real e utilidades à direita.
- No tema light a ilha é dark blue-gray glass; no dark ela permanece navy glass.
- O indicador compartilhado continua deslocado por `transform` em 260ms com
  `cubic-bezier(.22,.8,.24,1)`; reduced motion o torna instantâneo.

## Limites

Não houve mudança em mobile, `BottomNav`, rotas, dados, gráficos, tabelas,
cores de marketplace ou cores semânticas.

## Validação

- `git diff --check` limpo.
- `npm run build` passou (`tsc && vite build`).
- A prévia local sem sessão autenticada redireciona para `/login`; a revisão
  visual das rotas protegidas em light/dark permanece pendente.

