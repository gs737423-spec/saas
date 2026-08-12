---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Paleta navy e capsula de navegacao desktop.md
---

# Floating glass navigation island no desktop

## Contexto

A navegação desktop havia sido convertida em uma dock de ícones, mas continuava
dentro do header navy full-width anterior. O resultado preservava a categoria
visual de TopNav tradicional e não atendia à direção de uma ferramenta
flutuante independente sobre o conteúdo.

## Decisão

- O próprio `TopNav` passa a ser a única ilha visual no desktop; não existe um
  segundo header ou wrapper full-width atrás dele.
- A ilha usa largura intrínseca, `max-width: calc(100vw - 32px)`, centralização
  horizontal e afastamento de 14px do topo.
- Logo, navegação e utilidades compartilham a mesma superfície glass navy,
  separados apenas por divisores internos discretos.
- A navegação do cliente permanece icon-only. A dock interna não possui borda,
  fundo ou blur próprios.
- Um único indicador de rota é deslocado horizontalmente pelo índice derivado
  de `location.pathname`; nenhum estado de seleção paralelo é criado.
- O token de offset existente continua válido: no desktop, a soma de 14px com a
  altura da ilha equivale a `--app-header-height`.
- A barra superior e a `BottomNav` mobile permanecem com o comportamento
  anterior abaixo de 768px.

## Relação com a decisão anterior

Esta decisão substitui somente a escolha estrutural da cápsula dentro de uma
TopNav full-width. A paleta navy, os temas, Geist, Lucide e o sistema de motion
definidos anteriormente continuam válidos.

## Riscos

- Estados adicionais de Demonstração e View As aumentam a largura das
  utilidades; por isso gaps e controles são compactados entre 768 e 899px sem
  ocultar rotas.
- A validação end-to-end das rotas protegidas depende de uma sessão autenticada.

## Validação

- Build oficial: `npm.cmd run build`.
- `git diff --check`.
- Prévia local isolada usando a marcação e o CSS reais em 1280px, 800px e 390px.
- Inspeção de hover, tooltip, focus-visible, deslocamento do indicador, light,
  dark, offset de conteúdo e posição durante scroll.

## Reversão

Reverter os diffs desta sessão em `TopNav.tsx`, `index.css` e nos três
componentes de utilidade que receberam atributos de acessibilidade/popover.
Não há alteração de rota, dado, API ou persistência.
