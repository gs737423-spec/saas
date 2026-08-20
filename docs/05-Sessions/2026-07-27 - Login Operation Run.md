---
type: session
project: SaaS E-commerce
date: 2026-07-27
status: completed
---

# Sessão — Login "Vintec Operation Run" (redesign, substitui o Operations Engine)

## Objetivo
Reprovada a direção anterior (Operations Engine — diagrama técnico/painel lateral),
implementar a nova direção pedida: **card central único** com **ilustração animada
de um personagem correndo** que coleta a operação e entrega à Vintec. Auth intacta,
cadastro fechado.

## Contexto lido
CLAUDE.md, motion-system.md, SESSION-HANDOFF.md, docs de login (decisão do
Operations Engine, agora superada), auditoria de auth (AuthContext/whatsapp/motion).

## Alterações
- **Removido:** `src/site/components/operations-engine/` (8 arquivos) + todo o CSS
  `.ope-*` e o layout `login-shell/login-engine/login-auth` em `site.css`. Código
  morto eliminado.
- **Novo:** `src/site/components/operation-run/` — `OperationRunIllustration`
  (orquestrador: reduced-motion + pausa por aba), `RunningOperator`, `OperationTrack`,
  `OperationObject`, `DataPackage`, `VintecStation`, `OperationFeedback`, `runConfig.ts`.
- **`Login.tsx`:** reescrito para card central (`login-stage` → `login-card` →
  `login-form-col` + `login-illustration`). Lógica de auth (state, cooldown, capslock,
  submit, forgot, guards) **inalterada**. Marca duplicada removida do header (o card
  tem o logo). Reutiliza `LoginField`/`LoginCommercialAction`.
- **`site.css`:** fundo da página com brilho radial atrás do card; card central
  (44/56, coluna-reverse no mobile), logo/headline com mais presença, footnote menos
  apagada; novo stylesheet `.run-*/.op-*` + keyframes.

## Como a corrida foi construída
- Personagem SVG lateral em grupos separados (cabeça+tronco, braço×2, perna×2,
  pacote, sombra). Membros como traços round-cap; ombros mais largos que a cintura;
  cabeça menor com cabelo no topo (evita o "lâmpada"); tronco com leve inclinação
  para frente.
- Marcha = loop rápido CSS `--gait: 0.52s`: pernas alternadas (`rotate` no quadril,
  `transform-box: view-box` + `transform-origin` na articulação), braços alternados
  opostos, bob vertical 2×/passada, sombra pulsando. Cenário (pista) rola ao contrário.
- Narrativa `--run-cycle: 10s` por % de keyframe: início desorganizado → corrida →
  coleta (objetos convergem à fila) → entrega (pacote viaja à estação V, glow +
  linha por `stroke-dashoffset`, 3 sinais compactos) → reinício sem corte.
- Só `transform`/`opacity`/`stroke-dashoffset`. Pausa por `visibilitychange`.
  Reduced-motion (`.run--static` + media query): cena estática organizada (operador
  junto à estação, pacote entregue, objetos alinhados, sinais e estação acesa).

## Arquivos afetados
Novos: pasta `operation-run/` (8). Alterados: `src/pages/Login.tsx`, `src/site/site.css`.
Removidos: pasta `operations-engine/` (8). Docs: esta sessão + decisão nova + decisão
antiga marcada `superseded` + Current-State + SESSION-HANDOFF.

## Testes executados
- `tsc --noEmit` limpo; `npm run build` limpo. (Não há script de lint/testes no
  `package.json` — build cobre o typecheck.)
- Playwright (chromium real) 1440/390 + reduced-motion: 0 erros de console; card
  1040×572; operador com 2 pernas/2 braços; 3 objetos; estação; sinais na entrega;
  `imgCount=0`; sem overflow; cena estática correta sob reduced-motion. Screenshots
  no scratchpad (`run-desktop-1/2/3`, `run-mobile`, `run-reduced`).

## Pendências
- Login válido ponta a ponta com Supabase e ações comerciais (`VITE_WHATSAPP_*`
  ausentes no dev → ocultam) a validar em ambiente configurado. Lógica inalterada.

## Riscos
- `transform-box: view-box` exige navegador moderno (degrada só o pivô).

## Próxima ação
Revisão visual do dono na nova tela. Se aprovado: commit na branch
`feat/login-operations-engine` (sem push/deploy sem autorização).

---

## Adendo — pivô para "Operation Scene" estática (mesma data)
O personagem correndo (SVG hand-code) foi **reprovado** ("boneco/stickman").
Decisão do dono: aprovar primeiro a **composição estática** e usar **vetor
dedicado** para o personagem depois.

- **Removido:** pasta `src/site/components/operation-run/` (8 arquivos) + CSS
  `.run-*/.op-*` (toda a animação). Código morto eliminado.
- **Novo:** `src/site/components/operation-scene/` — `OperationScene`,
  `HeroPlaceholder`, `VintecStation`, `sceneConfig`. **Composição estática**
  (sem animação): fundo com profundidade + contraste (lado da ilustração mais
  vivo que o formulário, acentos âmbar), cluster desorganizado à esquerda, área
  do personagem **reservada ~240×320** com **silhueta discreta** (placeholder,
  não é a arte final), estação Vintec geométrica (terminal + núcleo + 3 módulos
  + confirmação) à direita, legenda integrada no topo.
- **`Login.tsx`:** troca `OperationRunIllustration` por `OperationScene`. Card
  980–1060×570–630 (medido 1040×600, radius 28), form 43% / ilustração 57%,
  form ~350px, "Voltar ao site" e footer alinhados ao container (não no canto).
  Lógica de auth inalterada.
- **`site.css`:** ilustração com gradiente vivo + sobreposição (sem linha
  vertical forte); stylesheet `.scene-*` estático (sem keyframes).
- **Sem animação nesta fase** (só transições/hover/focus do form). Personagem =
  placeholder até o vetor dedicado.

**Validação:** `tsc` + `build` limpos; Playwright 1440/1280/768/390: 0 erros,
`imgCount=0`, card 1040×600, sem overflow em nenhuma largura. Screenshots
`scene-1440/1280/768/390.png`. **Parado para aprovação do layout estático.**
