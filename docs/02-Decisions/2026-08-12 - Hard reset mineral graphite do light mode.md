---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Correcao cromatica Graphite Blue e light mode.md
---

# Hard reset mineral/graphite do light mode

## Contexto

O light mode blue-gray foi rejeitado por manter superfícies frias e próximas,
com pouca separação entre a página, painéis, cards, tabelas e Conexões.

## Decisão

- O tema claro usa uma única escala mineral: `#DFDDD8` (app), `#E9E6E1`
  (section), `#F2EFEB` (card), `#F7F5F2` (row) e `#FBFAF8` (elevated).
- Bordas usam `#D3CEC7`, `#C7C2BB` e `#B6B0A7`; texto usa graphite neutro.
- Cobalt (`#244FC2`, `#315FDC`, `#4775E5`) é reservado para interação,
  seleção, foco e ação, sem preencher a estrutura do tema.
- Tabelas de Produtos, Estoque e Financeiro têm header mineral `#D9D4CD`,
  linhas de card e hover `#F8F6F3`.
- A navegação desktop preserva geometria e motion, mas no light usa graphite
  neutro `#33373B` → `#272B2F`; dark usa deep ink `#20262D` → `#151A20`.
- O KPI de faturamento continua na mesma superfície e sem estado visual de
  seleção; cores ficam limitadas aos ícones semânticos.

## Limites

Sem mudanças de layout, dados, APIs, rotas, tipografia, mobile ou BottomNav.

## Validação

- Auditoria de tokens antigos e dos tons teal estruturais.
- `git diff --check` e `npm run build` após a implementação.
