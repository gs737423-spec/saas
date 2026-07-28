---
type: session
date: 2026-07-28
branch: feat/login-operations-engine
status: implementado (aguarda aprovação visual — sem commit/deploy)
---

# Sessão — Login "Vintec Expanding Access"

## Contexto
O dono definiu uma **nova direção** para o `/login`, substituindo a faixa "Vintec
Motion Card" (Fase 1, concluída de manhã) e todas as tentativas anteriores
(duas colunas, ilustração lateral, personagem/corredor, Operations Engine,
diagramas). Conceito aprovado: **card central compacto → interação do usuário →
expansão fluida → revelação do formulário**, numa **única superfície viva**.

## Auditoria (antes de mexer)
- Auth em `Login.tsx` (Supabase) — preservar 100%.
- `login-motion/` (faixa) só era importado por `Login.tsx` → removível.
- `login/LoginField` + `login/LoginCommercialAction` + `lib/whatsapp` + `lib/motion`
  → reaproveitados.
- `ResetPassword.tsx` reusa classes de layout do login antigo (`.login-page`,
  `.login-card`, `.login-form`, `.login-field` com label estático) → **não pode
  quebrar**.

## Mudança
### Removido (código morto / rejeitado)
- `src/site/components/login-motion/` (6 arquivos).
- CSS `.lm-*`, bloco morto `.scene-*` e o layout antigo do login em `site.css`.

### Criado — `src/site/components/login-expanding/`
- `expanding-login.types.ts` — `LoginCardState` (`collapsed|expanding|expanded|closing`)
  e `LoginBridge` (estado+handlers de auth passados ao visual).
- `VintecSignature.tsx` — assinatura SVG própria: duas lâminas convergentes = "V",
  gradientes azul vivo/claro, respira e pulsa ao abrir; pausa com aba oculta;
  desliga em reduced-motion. Sem lógica de auth.
- `CollapsedLoginIntro.tsx` — botão "Entrar" (controle de abertura; `aria-expanded`,
  `aria-controls`).
- `ExpandedLoginContent.tsx` — texto de apoio, formulário real (login **e**
  recuperação de senha), mensagem "Acesso exclusivo para clientes.", ação comercial
  (`LoginCommercialAction`) e links legais. `inert` enquanto fechado.
- `ExpandingLoginCard.tsx` — orquestra estado visual + foco + reduced-motion +
  pausa da assinatura; renderiza o botão de recolher no canto (só aberto e quando
  `canClose`).

### `Login.tsx`
Reescrito mantendo **toda** a lógica sensível (signIn, resetPassword, cooldown
local, soft-limit, anti-enumeração, loading, erro, redirect, cadastro fechado).
Monta um `bridge` e o entrega ao `ExpandingLoginCard`. Nenhuma regra de auth foi
movida para os componentes visuais. Topbar "Voltar ao site" alinhada à largura do
card.

### CSS (`site.css`)
Bloco novo `.lx-*` com tokens: dimensões fechado/aberto (largura/altura/raio),
durações de abertura/fechamento, easings, superfície, borda, glow. Campos `.login-*`
mantidos e reaproveitados (aliases `--login-*` → `--lx-*`).

### ResetPassword preservada
As classes de layout que a página usa foram reescritas **escopadas em `.login-page`**
(`.login-page .login-card`, etc.), sem colidir com o novo `.lx-page`. A página em si
não foi alterada.

## Máquina de estados
`collapsed → expanding →(timer ~580ms)→ expanded`;
`expanded → closing →(~540ms)→ collapsed`.
- Abre por **click / Enter / Space** (nunca só hover).
- **Escape recolhe apenas quando `canClose`** = view login, sem envio, sem erro,
  campos vazios.
- Foco: e-mail ao abrir; botão "Entrar" ao fechar.
- `prefers-reduced-motion`: troca seca (sem fases nem stagger).

## Como o card expande (sem layout instável)
O card é o **único item de um `grid place-items:center`** num palco de altura fixa;
transicionar `width/height/border-radius` recentraliza o card **sem reflow dos
vizinhos**. `overflow:hidden` clipa a superfície; o conteúdo aberto é revelado por
`opacity`/`transform` em stagger (delays CSS). **Sem biblioteca de animação.**

## Validação (executada)
- `npm run build` (tsc + vite): **limpo**. Projeto **não tem** script de lint nem
  de teste (só `dev`/`build`/`preview`).
- Playwright (chromium headless):
  - Estados fechado / abrindo / aberto — desktop 1440×900 e mobile 390×844.
  - **9 breakpoints** (1536, 1440, 1366, 1280, 1024, 768, 430, 390, 360): **sem
    overflow horizontal** em fechado e aberto.
  - **Credencial inválida** → erro real do Supabase ("Não foi possível entrar com as
    credenciais informadas.").
  - Recuperação de senha (view forgot), **mostrar senha** (type→text), **abertura por
    teclado** (Enter → foco no e-mail), **reduced-motion** (expandido instantâneo +
    foco). 0 erros/warnings de console.
  - Capturas no scratchpad da sessão (`shots4/…`).

## Decisões
- Direção "Expanding Access" **substitui** definitivamente faixa/personagem/duas
  colunas/diagramas. Ver decisão `docs/02-Decisions/2026-07-28 - Login Vintec Expanding Access.md`.

## Git
- **Sem commit, sem push, sem deploy** (instrução da tarefa). Aguarda aprovação
  visual do dono nas capturas.

## Próxima ação
- Revisão visual do dono. Ajustes finos possíveis: whitespace inferior no mobile
  (altura fixa do card aberto), curvas/tamanho da assinatura, timing do stagger.
