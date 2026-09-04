---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-13
impact: medium
reversible: true
---

# Semântica visual de cobertura e giro

## Decisão aprovada pelo usuário

Na área de Estoque, verde significa condição operacional boa. Vermelho significa risco ou capital parado. Cobertura e Giro compartilham essa regra visual.

| Indicador | Estado visível | Cor semântica |
|---|---|---|
| Cobertura | Saudável | verde |
| Cobertura | Crítico | vermelho |
| Cobertura | Excesso | vermelho |
| Giro | Normal | verde |
| Giro | Alto | vermelho |
| Giro | Baixo | vermelho |
| Giro | Parado / Parado crítico | vermelho |

O antigo estado visual `Atenção` da tabela passa a ser apresentado como `Excesso`, em vermelho. O antigo `Bom` do Giro passa a ser apresentado como `Alto`, em vermelho.

## Limites preservados

Nenhum threshold foi alterado. A mudança centraliza somente a tradução de status para rótulo e tom semântico. Filtros, ordenação, cálculo de cobertura e dados permanecem iguais.

## Prevenção

Os mapeamentos são testados em `tests/inventoryStatus.test.ts`, incluindo as faixas exibidas nas screenshots e estados sem venda.
