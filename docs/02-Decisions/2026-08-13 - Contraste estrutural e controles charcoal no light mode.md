---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-13
impact: medium
reversible: true
supersedes: 2026-08-13 - Light mode neutral editorial enterprise.md
---

# Contraste estrutural e controles charcoal no light mode

## Decisão

O light mode mantém a direção Neutral Editorial Enterprise, mas aumenta a distância luminosa entre canvas, seção, card e superfície elevada. A rampa passa a ser `#D1D4D0`, `#DDE0DC`, `#EEF0ED`, `#F7F8F6`, com `#CACEC9` para toolbar e cabeçalho de tabela.

Controles selecionados reutilizam o charcoal central da TopNav (`#272927`), com hover `#323532` e conteúdo claro. Controles inativos permanecem em neutral estrutural. O cobalt continua reservado para foco, marca e informação específica.

Esse padrão inclui filtros e ordenação de Estoque, ordenação e dropdowns de Produtos e o seletor de comparação temporal do gráfico de Marketplaces. Dropdown fechado sem filtro usa neutral estrutural; aberto ou com filtro aplicado usa charcoal.

A busca global light redefine seus tokens tipográficos dentro do próprio painel porque ele está aninhado na TopNav, que deliberadamente usa texto claro. O painel usa texto primário `#171917`, secundário/placeholder `#505650` e estados hover neutros.

## Limites

Dark mode, estrutura da TopNav, alturas, rotas, comportamento de filtros, scroll interno e shell single-viewport não foram alterados.

## Validação

- `npm.cmd run typecheck`: passou.
- `npm.cmd run test:run`: 6 arquivos e 49 testes passaram.
- `npm.cmd run build`: passou.
- A inspeção autenticada das rotas `/app` não foi possível no navegador local sem credencial de teste; a validação visual final permanece pendente no navegador do usuário.
