---
type: session
project: SaaS E-commerce
date: 2026-08-12
status: ready-for-visual-review
---

# Floating glass navigation island desktop

## Objetivo

Corrigir o redesign anterior da navegação desktop, substituindo a TopNav navy
full-width por uma única ilha glass flutuante com logo, oito rotas icon-only e
utilidades compactas.

## Estado encontrado

- `TopNav.tsx` ainda renderizava um `<header>` com `inset-x-0`.
- `.topnav-surface` pintava navy em toda a largura.
- `.topnav-dock` adicionava uma segunda superfície glass dentro desse header.
- O offset global já era centralizado em `--app-header-height` e podia ser
  preservado.
- `BottomNav` e o breakpoint mobile estavam separados corretamente.

## Mudanças

- O próprio header desktop virou a ilha fixa, centralizada e content-sized.
- A superfície interna da dock foi removida; só o active tile cria uma camada
  adicional.
- Logo, navegação e utilidades ficaram dentro da mesma peça, com dois
  separadores discretos.
- O indicador ativo usa `data-active-index` derivado da rota, com distâncias
  responsivas e transição por `transform`.
- Demonstração/View As ficam icon-only no desktop e preservam a apresentação
  mobile existente.
- Utilidades receberam nomes acessíveis e popovers com fundo sólido adequado à
  sobreposição sobre o conteúdo.
- Nenhuma rota, página, API, dado, autenticação ou `BottomNav` foi alterada.

## Validações executadas

- `npm.cmd run build`: passou (`tsc && vite build`).
- Prévia local em 1280px: ilha de aproximadamente 765px, centralizada, a 14px
  do topo e sem faixa full-width.
- Prévia local em 800px: ilha de aproximadamente 685px, dock visível e todas as
  rotas preservadas.
- Prévia local em 390px: dock desktop oculta e header mobile full-width.
- Dark e light: ilha navy manteve contraste sobre os dois fundos.
- Tooltip em hover: opacity final `1`.
- Focus por teclado: tooltip visível e ring de 2px.
- Scroll: header permaneceu `fixed` e em `top: 14px`.
- Offset: 12px entre o final da ilha e o primeiro card na prévia estreita.

## Limitação de validação

O navegador local disponível não possuía sessão autenticada e foi redirecionado
para `/login`. Assim, as oito rotas foram preservadas e auditadas no código,
mas o clique end-to-end dentro das páginas protegidas depende de revisão visual
em uma sessão autenticada.

## Feedback e aprendizado proposto

Classificação: erro recorrente / antipadrão de repetir uma solução rejeitada com
mudança cosmética. Regra proposta: quando a direção muda a categoria do
componente (por exemplo, barra estrutural para ilha flutuante), validar o
wrapper pai, sua largura e o fundo ao redor antes de trabalhar a superfície
filha. Teste preventivo: medir o retângulo do container principal e confirmar
aplicação visível acima e dos dois lados.

O aprendizado não foi promovido à memória oficial; permanece como proposta
registrada nesta sessão.

## Próximo passo

Revisão visual do usuário em sessão autenticada, especialmente com os estados
Demonstração e View As ativos. Nenhum commit foi realizado.
