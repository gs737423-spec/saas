---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Enterprise quiet UI do light mode.md
---

# Light mode soft slate e topbar material

## Decisão

O light mode passa a usar a hierarquia `#E3E8EE` (app) → `#EEF2F6`
(section) → `#F7F9FB` (card), preservando `#FFFFFF` apenas para controles e
superfícies realmente elevadas. KPIs, rows de GMV e filtros usam a superfície
de card; painéis e gráficos usam a superfície de section; tabelas mantêm body
transparente, header muted e hover sutil.

A Floating Navigation desktop preserva todas as dimensões, alinhamento,
separadores, active tile e motion. Só sua materialidade muda para uma rampa
graphite/blue-steel mais rica, com highlights internos e sombra de elevação
controlada. O dark recebe a mesma linguagem em menor luminância.

## Limites

Não foram alterados JSX, rotas, dados, layout macro, breakpoints mobile,
`BottomNav`, tamanho/posição da topbar ou o mecanismo do active indicator.

## Validação

- `git diff --check` limpo.
- `npm run build` passou (`tsc && vite build`); apenas o aviso pré-existente de
  chunk acima de 500 kB foi emitido.
