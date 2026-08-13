---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
supersedes: 2026-08-12 - Light mode monocromatico e floating nav alinhada.md
---

# Correção cromática Graphite Blue e light mode

## Contexto

O refinamento anterior acertou a largura e a composição da Floating Navigation,
mas a barra ainda podia ser percebida como teal/petróleo e o light mode não
tinha separação tonal suficiente entre app, seção, card e linha de dados.

## Decisão

- A estrutura, largura e alturas atuais da navegação foram preservadas.
- A navegação usa apenas graphite blue: no light, `#202B38` para `#18232F`;
  no dark, `#162230` para `#101A25`. Verde fica restrito a estados semânticos.
- O light mode usa `#CDD6DF` (app), `#DCE3E9` (seção), `#E9EEF2` (card),
  `#F1F4F6` (linha) e `#F6F8F9` (elevado), com bordas `#CBD4DC`, `#B9C5CF`
  e `#A7B5C1`.
- A primária é cobalt: `#356FE8`, `#285FCC` e `#4A7FEA`.
- O indicador ativo continua único e movido por `transform` em 260ms com
  `cubic-bezier(.22,.8,.24,1)`; reduced motion continua sem animação.
- O cartão de faturamento deixa de ter borda, faixa ou glow que o faça parecer
  selecionado; a cor fica apenas no ícone semântico.

## Limites

Não houve alteração de layout, grids, tipografia, conteúdo, rotas, dados,
gráficos, tabelas, mobile ou `BottomNav`.

## Validação

- `git diff --check` limpo.
- `npm run build` executado após a alteração.
- A inspeção visual autenticada segue dependente da validação em Vercel.
