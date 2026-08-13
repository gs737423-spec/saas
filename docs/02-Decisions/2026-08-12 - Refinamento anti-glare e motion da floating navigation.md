---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Floating glass navigation island desktop.md
---

# Refinamento anti-glare e motion da Floating Navigation

## Decisão

Preservar a Floating Navigation Island como a única navegação desktop e
refiná-la, sem mudar rotas, dados, páginas ou a navegação mobile.

- Light mode passa a usar a rampa `#E8EEF3` (app) → `#EEF3F7` (seção) →
  `#F8FAFC` (card) → `#FCFDFE` (destaque), com bordas azul-acinzentadas.
- A ilha desktop tem 64px, rotas em áreas de 42px e ícones de 20px; utilidades
  usam áreas de 40px. Entre 768 e 1279px, a compactação é preservada para não
  alterar o comportamento responsivo.
- Dark mantém navy glass. Light adota frosted blue-gray glass, com transição de
  240ms somente para propriedades visuais.
- O indicador ativo continua único e é deslocado com `transform`, agora em
  260ms com `cubic-bezier(.22,.8,.24,1)`. Em reduced motion, as transições e
  transforms são removidos.

## Consequências

O tema claro deixa de usar branco puro como superfície padrão e ganha
profundidade por diferença tonal antes de borda e sombra. A leitura de rota
ganha continuidade espacial sem biblioteca nova, medição contínua ou mudança
de estado paralelo.

## Limites

`BottomNav`, breakpoint mobile, tipografia, cores de marketplaces e cores
semânticas não foram alterados.

## Validação

- `git diff --check` limpo.
- `npm run build` passou (`tsc && vite build`).
- Prévia local redirecionou a `/login` por falta de sessão autenticada; a
  revisão visual das rotas protegidas nos dois temas continua pendente.
