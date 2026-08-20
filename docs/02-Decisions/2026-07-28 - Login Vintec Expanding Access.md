---
type: decision
date: 2026-07-28
status: aprovada (implementada; deploy autorizado pelo dono)
supersedes:
  - "2026-07-27 - Login Vintec Operation Run"
  - "2026-07-27 - Painel de login Vintec Operations Engine"
  - "Vintec Motion Card (Fase 1, 2026-07-28 manhã)"
---

# Decisão — Login "Vintec Expanding Access"

## Contexto
A tela `/login` passou por várias direções reprovadas: screenshots da plataforma,
"Operations Engine" (diagrama técnico), "Operation Run/Scene" (personagem/composição
hand-code) e, por fim, a faixa estática "Vintec Motion Card". O dono definiu uma
direção nova e definitiva.

## Decisão
Adotar **"Vintec Expanding Access"**: um **único card central** que começa
**compacto** (assinatura Vintec + headline + botão "Entrar") e **expande na própria
superfície** para revelar o formulário — sem trocar de página, sem modal, sem tela
dividida, sem ilustração lateral, sem personagem, sem diagrama, sem screenshots.

### Princípios
- Uma única superfície viva (o card aberto é o mesmo objeto do card fechado).
- Card desconectado do fundo; espaço negativo generoso; glow contido (sóbrio, não
  futurista).
- Assinatura gráfica própria da Vintec (duas lâminas convergentes sugerindo "V") —
  não é esfera/mascote/globo genérico.
- Cadastro público **fechado**; 2ª ação = "Solicitar demonstração" (destino comercial
  real). Sem login social/signup.

### Arquitetura
- Visual isolado em `src/site/components/login-expanding/` (`ExpandingLoginCard`,
  `VintecSignature`, `CollapsedLoginIntro`, `ExpandedLoginContent`,
  `expanding-login.types`).
- **Auth permanece em `Login.tsx`** (Supabase, recuperação, cooldown, soft-limit,
  anti-enumeração, loading, erro, redirect) e chega ao visual por um `LoginBridge`.
  Nenhuma regra sensível vive nos componentes visuais.
- Máquina de estados `collapsed → expanding → expanded → closing`.
- Expansão por `width/height/border-radius` de um item único de grid centrado
  (sem reflow de vizinhos) + revelação por `opacity/transform` em stagger. Sem libs.
- Acessibilidade: `aria-expanded`/`aria-controls`, foco no e-mail ao abrir e no botão
  ao fechar, `inert` no conteúdo fechado, `prefers-reduced-motion` (troca seca).

## Consequências
- **Removidos**: `login-motion/` e CSS `.lm-*`/`.scene-*` (código morto das direções
  anteriores). `ResetPassword.tsx` preservada com CSS de layout reescrito escopado em
  `.login-page`.
- Substitui as decisões/tentativas anteriores de login (ver `supersedes`).
- Próximos ajustes finos ficam no nível de CSS/tokens, sem tocar em auth.

## Alternativas descartadas
- Faixa/personagem/duas colunas/diagrama — reprovadas por parecerem técnicas,
  infantis ou artificiais (ver ERR-001).
