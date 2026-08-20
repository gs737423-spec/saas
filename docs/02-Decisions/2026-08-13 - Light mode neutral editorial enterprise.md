---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-13
impact: medium
reversible: true
supersedes: 2026-08-12 - Light mode soft slate e topbar material.md
---

# Light mode neutral editorial enterprise

## Decisao

O light mode adota uma rampa neutral editorial: `#DADCD9` (app), `#E6E8E5` (section), `#F2F3F1` (card), `#FAFAF8` (raised) e `#D7DAD6` (cabecalho de tabela). O cobalt fica restrito a interacao e dados continuam usando as cores de marketplace.

A TopNav light preserva largura, altura, posicao, separadores e indicador compartilhado. Sua materialidade passa para charcoal neutral com o gradiente `#202120` → `#272927` → `#2D2F2D`, highlight interno discreto e sem glow azul.

## Limites

Dark mode, JSX, rotas, dados, responsividade, BottomNav e o shell de viewport nao foram alterados.

## Validacao

- `git diff --check` limpo.
- `npm.cmd run build` passou (`tsc && vite build`).
