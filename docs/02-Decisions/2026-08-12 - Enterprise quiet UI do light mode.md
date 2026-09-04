---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Hard reset mineral graphite do light mode.md
---

# Enterprise Quiet UI do light mode

## Contexto

O reset mineral melhorou os tokens, mas preservou sombras, radius altos,
gradientes e cards aninhados. Isso ainda afastava as telas da linguagem de
software operacional pretendida.

## Decisão

- Light usa Enterprise Neutral: `#E9EDF2` canvas, `#F3F5F7` section,
  `#FAFBFC` card, `#FFFFFF` raised/control e `#E3E8ED` muted/header.
- Bordas são a principal separação visual: `#DCE2E7`, `#D0D7DE`, `#BCC6CF`.
- Radius é consolidado em 6/8/10/12px e cards/sections comuns não têm shadow.
- Tabelas usam header muted, body transparente, divisores e hover plano.
- Navbar mantém a geometria e o indicador, mas usa graphite quase sólido,
  blur 12px e a única shadow floating relevante.
- Cobalt fica restrito a interação; cores de marketplace e semânticas ficam
  limitadas aos respectivos dados e estados.

## Limites

Sem alteração de grids, tipografia, dados, cálculos, APIs, rotas, mobile,
BottomNav ou estrutura do dark mode.

## Validação

- Auditoria de tokens, radius, shadow, gradientes, rows e disabled states.
- `git diff --check` e `npm run build` após a implementação.
