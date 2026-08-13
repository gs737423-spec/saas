---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-13
impact: medium
reversible: true
---

# Densidade adaptativa do workspace

## Decisao

As rotas operacionais desktop passam a distribuir a altura por prioridade: dados e graficos, controles, KPIs e por fim chrome. Os tokens fluidos usam `clamp()` e `dvh` para ajustar gap, padding, altura minima de KPI, controles e padding de tabela sem `scale()` nem reducao global de tipografia.

## Limites

O shell single-viewport continua ativo. Produtos e Estoque mantem scroll apenas no viewport interno e headers sticky. Layout mobile, TopNav horizontal, dark mode, dados e rotas nao foram alterados.

## Validacao

- `git diff --check` limpo.
- `npm.cmd run build` passou (`tsc && vite build`).
