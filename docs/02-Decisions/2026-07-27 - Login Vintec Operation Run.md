---
type: decision
project: SaaS E-commerce
status: superseded
date: 2026-07-27
impact: medium
reversible: true
supersedes: "docs/02-Decisions/2026-07-27 - Painel de login Vintec Operations Engine.md"
---

> **SUPERADA em 2026-07-27.** O personagem correndo em SVG desenhado à mão foi
> reprovado (lido como "boneco/stickman"). Conclusão: o personagem editorial exige
> um **vetor dedicado** (não hand-code). Nova direção: **composição estática
> "Vintec Operation Scene"** aprovada primeiro (card, escala, cores, estação,
> hierarquia) com o personagem como **placeholder de silhueta** em área reservada
> (~240×320); a ilustração vetorial profissional e a animação vêm depois. O card
> central único e as regras de auth desta decisão permanecem válidos.

# Login "Vintec Operation Run" — card central único + personagem correndo

## Contexto
A direção anterior do login (Operations Engine — diagrama técnico com núcleo em
"V", 4 fontes, conexões radiais e grande painel lateral) foi **reprovada** pelo
dono: lia como dashboard/arquitetura de sistemas, com muito espaço vazio. Pediu
uma direção mais simples, amigável e memorável: **uma tela centralizada em um
único card com uma ilustração animada** — referência conceitual de um pequeno
personagem correndo, sem parecer infantil/gamificado/template gratuito.

## Problema
Comunicar "dados espalhados → coleta → percurso → entrega na Vintec → dados
organizados" com uma ilustração leve dentro de um card central, sem screenshots,
sem esfera/diagrama, mantendo 100% da lógica de autenticação e o cadastro fechado.

## Opções consideradas
1. Ajustar o Operations Engine. Rejeitada — o conceito inteiro foi reprovado.
2. Ilustração estática. Rejeitada — brief pede narrativa animada com personagem.
3. **"Vintec Operation Run"** — card central 44/56, operador SVG correndo que
   coleta pedido/estoque/financeiro e entrega à estação Vintec. **Escolhida.**

## Decisão
Card central único (max 1040px, ~572px alt, centralizado), coluna de formulário
(44%) + ilustração (56%) separadas só por iluminação/linha discreta. Ilustração
`OperationRunIllustration` (SVG/CSS puro) desacoplada da auth. Personagem em
grupos separados (cabeça, tronco, 2 braços, 2 pernas, pacote, sombra); marcha =
loop rápido CSS (~0,52s) com pernas/braços alternados, bob vertical e inclinação
do tronco; cenário rola ao contrário. Timeline narrativa de 10s: início
desorganizado → corrida → coleta (objetos alinham) → entrega (pacote → estação V,
acende, 3 sinais compactos) → reinício sem corte. Arquitetura **meio-termo**
mantida: lógica de auth intacta em `Login.tsx`.

## Consequências positivas
- Direção aprovada visualmente: personagem profissional (não infantil), card
  premium, sem dashboard/diagrama/esfera/screenshots (`imgCount=0`).
- Auth, recuperação de senha, cooldown e anti-enumeração preservados.
- Só `transform`/`opacity`/`stroke-dashoffset`; zero libs; reduced-motion + pausa
  por aba; build/tsc limpos; sem overflow desktop/mobile.

## Riscos e consequências negativas
- `transform-box: view-box` (pivôs da marcha) exige navegador moderno — ok para
  o público-alvo; degrada só a precisão do pivô, não quebra.
- Duas colunas do card no mesmo DOM; no mobile empilham (ilustração no topo).

## Plano de validação
`tsc` + `npm run build` limpos. Playwright real 1440/390 + reduced-motion:
0 erros de console, card 1040×572, operador (2 pernas/2 braços), 3 objetos,
estação, sinais na entrega, sem prints, sem overflow, cena estática organizada
sob reduced-motion. Login/recuperação com Supabase: lógica inalterada (exercício
ponta a ponta depende de credencial real).

## Plano de reversão
Mudança localizada ao login. Reverter = restaurar `Login.tsx` anterior e o bloco
de CSS, remover `src/site/components/operation-run/`. Via git na branch
`feat/login-operations-engine`.

## Evidências
Screenshots da sessão (scratchpad): `run-desktop-1/2/3.png`, `run-mobile.png`,
`run-reduced.png`. Ver sessão `docs/05-Sessions/2026-07-27 - Login Operation Run.md`.
