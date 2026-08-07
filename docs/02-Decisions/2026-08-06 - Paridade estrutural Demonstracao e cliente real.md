# Paridade estrutural entre Modo Demonstração e cliente real

## Decisão

O Modo Demonstração é a fonte de verdade do visual da plataforma. Todo
cliente real vê exatamente a mesma estrutura, componentes, cards, gráficos,
filtros e mecânicas que o Demonstração — nunca mais, nunca menos. Só a
fonte do dado muda (real vs ilustrativo), nunca o layout.

**Regra derivada:** a estrutura da tela nunca varia em função de quantos
marketplaces o cliente conectou. Cliente com 1 canal conectado vê a mesma
tela de quem tem 4 (ou mais, se a plataforma passar a suportar novos
canais além de Mercado Livre/Shopee/Amazon/Loja Própria) — card ou linha
sem dado fica zerado, nunca é omitido, nunca reduz a tela.

## Por quê

Estrutura que aparece/desaparece conforme integração passa impressão de
produto quebrado, não de produto com pouco dado ainda. Zero é uma
informação aceitável; tela instável não é.

## Como aplicar

- Todo componente novo de dashboard é implementado uma vez, contra os dois
  caminhos de dado (real e demo) que já convergem no mesmo shape de tipo —
  ver `source: 'real' | 'demo'` em `src/server/integrations/types.ts` e
  `src/server/dashboardProducts.ts`.
- Nunca condicionar JSX renderizado em `marketplaces.length` ou lista de
  conexões — só o valor exibido varia (zerado sem dado), nunca a presença
  do elemento.
- Lista de marketplaces suportados (`PROVIDER_LABEL` em
  `api/dashboard/*.ts` e `MARKETPLACES`/`Marketplace` em
  `src/data/mockData.ts`) é o único lugar que precisa crescer ao adicionar
  um canal novo — todo componente que itera sobre ela automaticamente
  ganha o canal novo sem mudança de estrutura.

## Status

Aprovada pelo usuário em 2026-08-06. Auditoria de aderência (pipeline de
dado real: summary/finance/finance-daily/products/inventory) em andamento
na mesma sessão.
