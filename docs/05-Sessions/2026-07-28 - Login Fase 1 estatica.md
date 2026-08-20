---
type: session
date: 2026-07-28
branch: feat/login-operations-engine
status: concluída (aguarda aprovação visual)
---

# Sessão — Login Vintec Motion Card, Fase 1 estática

## Contexto
A sessão anterior (2026-07-27) reescreveu `/login` para o **Vintec Motion Card**
(card vertical único: faixa visual no topo + formulário abaixo) mas o **limite de
contexto estourou no meio da migração de CSS**. `Login.tsx` e os componentes novos
foram salvos; `src/site/site.css` ficou parcialmente migrado e a tela ficou
**quebrada** no working tree.

## Estado encontrado (auditoria antes de mexer)
- Completo/coerente: `src/pages/Login.tsx` (markup vertical), `src/site/components/login/`
  (`LoginField`, `LoginCommercialAction`), `src/site/components/login-motion/`
  (`LoginMotionHeader` + `OperationTrack`/`FragmentedItems`/`OrganizedItems`/`RunnerSprite`
  + `motionConfig.ts`). Auth Supabase intacta.
- Lacuna: em `site.css` — (1) CSS `.lm-*` da faixa **ausente** (SVG sem estilo, fills
  pretos); (2) `.login-body` sem regra; (3) `.login-card` ainda com CSS de **2 colunas**
  (`@media(880px){flex-direction:row}` + `.login-form-col`/`.login-illustration`),
  órfão; (4) bloco morto `.scene-*` (31 regras) sem nenhum consumidor.

## Mudança executada (só `src/site/site.css`)
1. `.login-card`: `flex-direction:column`, `max-width:460px`; removido o `@media` de 2
   colunas e o de 1200px.
2. Adicionado `.login-body` (padding + conteúdo centralizado no card estreito).
3. Adicionado todo o CSS **estático** `.lm-*` (faixa: fundo, pista, fragmentado,
   organizado, slot do corredor). Sem `@keyframes`. Reaproveita a paleta local
   (`--login-blue`, `--login-blue-light`, `--login-amber`).
4. Removidos os órfãos: `.login-form-col`, `.login-illustration` (+`::before`),
   `.scene`/`.scene__svg` e todo o bloco `.scene-*`. Auditado: `grep` não achou nenhum
   `.tsx` os referenciando.
5. `@media(max-width:480px)`: oculta o 3º fragmento (`data-frag="2"`) no mobile.
   `@media(max-width:767px)`: `.login-form-col` → `.login-body`.

Nenhum `.tsx` alterado. Nenhuma mudança em auth, rotas, contratos.

## Validação (executada)
- `npm run build` (= `tsc && vite build`): **limpo**. Projeto **não tem** script de
  lint nem de teste (só `dev`/`build`/`preview`).
- Playwright real (chromium headless), `/login`:
  - desktop 1440×900 e mobile 390×844.
  - DOM: `hasCard`, `hasBand`, `bandHasSvg`, `hasBody` = true; `flexDirection:column`;
    `maxWidth:460px`; `twoColumn:false`; `platformImg:false`; `docOverflowX:false`;
    runner tag = "sprite (pendente)". **0 erros de console** nos dois viewports.
  - Capturas salvas no scratchpad da sessão (`shots/login-desktop-1440x900.png`,
    `shots/login-mobile-390x844.png`), inspecionadas visualmente: card vertical
    centralizado, faixa estilizada (sem fills pretos), sem overflow.

## Decisões
- Layout de **duas colunas descartado**; card **vertical único** é a Fase 1 aprovada
  para validação.
- Corredor permanece **slot reservado** ("sprite (pendente)"); **sem animação** até a
  sprite profissional (Fase 2).

## Git
- **Commit local** na branch `feat/login-operations-engine`. **Sem push. Sem deploy**
  (decisão do dono nesta sessão — publicar login reformulado exige aprovação visual
  prévia; regras do projeto vedam deploy sem autorização explícita por entrega).

## Próxima ação
- Aprovação visual do dono nas capturas → então push / PR / deploy.
- Fase 2: sprite profissional + animação encaixando no `RUNNER_SLOT`.
