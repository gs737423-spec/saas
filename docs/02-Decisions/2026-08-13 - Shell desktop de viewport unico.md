---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-13
impact: medium
reversible: true
---

# Shell desktop de viewport unico

## Decisao

As rotas operacionais `/app`, `/app/marketplaces`, `/app/produtos` e `/app/estoque` passam a usar o viewport desktop disponivel como limite de layout. A regra e aplicada somente a partir do breakpoint que ja ativa a navegacao desktop (`768px`).

O shell usa `100dvh`, flex/grid com `min-height: 0` e dimensoes fluidas por `clamp()`. Cada rota concentra overflow apenas em sua area de trabalho: GMV como fallback de altura extrema, analise de Marketplaces como fallback e viewports de tabelas para Produtos e Estoque.

## Limites

Nao foram alterados a TopNav, rotas, APIs, dados, autenticacao, tema, tipografia, icones ou o comportamento mobile/BottomNav.

## ValidaÃ§Ã£o

- `git diff --check` limpo.
- `npm.cmd run build` passou (`tsc && vite build`). O aviso de chunk acima de 500 kB permaneceu como aviso nao bloqueante do Vite.
