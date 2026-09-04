---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: low
reversible: true
---

# Navbar material graphite/blue-steel

## Decisão

Manter integralmente a geometria aprovada da Floating Navigation desktop e
refinar somente a sua presença material.

- A largura continua `min(var(--app-content-max-width), calc(100vw -
  (var(--space-page-x) * 2)))`, a mesma regra do container principal; não há
  `fit-content` nem nova navbar compacta.
- Light usa graphite/blue-steel `#1B2530` → `#253441` → `#202C38`; dark usa a
  mesma linguagem com menor luminância `#141D26` → `#1A2632` → `#17212B`.
- A toolbar recebe borda, luz interna, sombra controlada, linha inferior e dois
  separadores de 1px × 24px entre marca, navegação e utilidades.
- O indicador compartilhado permanece móvel por `transform` em 260ms com
  `cubic-bezier(.22,.8,.24,1)`; o clique reduz a escala a `0.95` em 90ms.

## Consequências

A barra ganha profundidade e diferenciação do canvas sem alterar rotas,
conteúdo, breakpoints, navegação mobile ou os demais componentes do dashboard.

## Validação

- `git diff --check` limpo.
- `npm run build` passou (`tsc && vite build`); apenas o aviso pré-existente de
  chunk acima de 500 kB foi emitido.
