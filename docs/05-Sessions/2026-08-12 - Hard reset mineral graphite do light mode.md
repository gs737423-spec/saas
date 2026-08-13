---
type: session
project: SaaS E-commerce
date: 2026-08-12
status: ready-for-visual-review
---

# Hard reset mineral/graphite do light mode

## Estado encontrado

O tema claro usava uma escala blue-gray concentrada em tons próximos. Cards,
linhas e tabelas não tinham profundidade suficiente e a navbar mantinha
leitura azulada em vez de graphite neutro.

## Mudanças

- Substituída a escala clara por mineral/graphite/cobalt, sem manter tokens
  estruturais blue-gray concorrentes.
- Estratificados cards, superfícies internas, inputs, filtros e tabelas.
- Tabelas de Produtos, Estoque e Financeiro receberam header mineral e linhas
  claramente separadas.
- Cards de Conexões receberam surface de card e borda mineral explícita.
- Preservados navbar width/posição, indicador deslizante, dark, mobile e
  BottomNav.

## Validações

- `git diff --check` executado.
- `npm run build` executado.
- A revisão visual autenticada das rotas protegidas depende da Vercel.

## Próxima ação

Validar a percepção de níveis nas seis rotas em light e a neutralidade da
navbar antes de decidir por commit.
