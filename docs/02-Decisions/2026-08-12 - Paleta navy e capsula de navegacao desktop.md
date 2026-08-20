---
type: decision
project: SaaS E-commerce
status: implemented
date: 2026-08-12
impact: medium
reversible: true
---

# Paleta navy e cápsula de navegação desktop

## Contexto

A plataforma autenticada já possuía light/dark mode, tokens globais, Geist,
Lucide e um sistema de motion. A identidade dark ainda dependia de uma base
slate/indigo, e os links desktop da TopNav não formavam um agrupamento visual
próprio.

## Problema

Consolidar light e dark como variações do mesmo produto e dar mais hierarquia à
navegação sem redesenhar páginas, rotas, controles ou navegação mobile.

## Opções consideradas

- Criar um novo design/motion system: rejeitado por duplicar a arquitetura.
- Criar um indicador deslizante medido por JavaScript: rejeitado pelo risco de
  fragilidade responsiva.
- Atualizar os tokens existentes e usar backplate CSS no item ativo: escolhido.

## Decisão

- Light: `#EDF2F6` / `#F6F8FB` / `#F1F5F8` / `#FFFFFF`, primary `#2F6FED`.
- Dark: `#09131F` / `#0E1B2A` / `#132235` / `#16283C` / `#1B3047`, primary
  `#5B8DEF`.
- A TopNav continua na mesma região e ganha uma cápsula de 14px apenas ao
  redor dos links. Marca e controles permanecem independentes.
- O estado ativo usa backplate arredondado por item, sem underline, pulso ou
  medição de DOM.
- `BottomNav` permanece inalterada.

## Consequências positivas

- Hierarquia de superfícies explícita nos dois temas.
- Identidade dark navy, sem indigo estrutural.
- Navegação mais legível e agrupada, com microinteração discreta.
- Implementação localizada, sem dependência nova.

## Riscos e consequências negativas

- A validação visual completa das rotas autenticadas depende de uma sessão
  de teste; o navegador de validação disponível redirecionou para `/login`.
- Cores antigas preservadas em visualizações e estados semânticos devem ser
  revistas separadamente, não por substituição cega.

## Plano de validação

- `npm.cmd run build` (`tsc && vite build`).
- `git diff --check`.
- Busca controlada de indigo/roxo e inspeção do diff.
- Contraste calculado para texto/ícones da navbar.
- Revisão humana futura das rotas autenticadas nos dois temas.

## Plano de reversão

Reverter os diffs desta sessão em `src/index.css`, `TopNav.tsx` e nos seis
pontos estruturais de cor ajustados. Não há migração, dado ou contrato de API.

## Evidências

- Build concluído em 2026-08-12.
- Nenhuma rota, provider, API, backend ou componente mobile alterado.
