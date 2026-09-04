---
type: session
project: SaaS E-commerce
date: 2026-07-27
status: completed
---

# Sessão — Login "Vintec Operations Engine"

## Objetivo
Substituir completamente o painel visual da tela `/login` (que usava screenshots
reais da plataforma) por uma experiência visual proprietária, abstrata e animada
— o **Vintec Operations Engine** — que comunica o posicionamento da marca:
**dados dispersos → centralização Vintec → decisões claras**. Sem tocar o fluxo
de autenticação Supabase. Escopo restrito ao login.

## Contexto lido
- `CLAUDE.md`, `SESSION-HANDOFF.md`, `motion-system.md`.
- Auditoria de `src/pages/Login.tsx`, `src/contexts/AuthContext.tsx`,
  `src/lib/whatsapp.ts`, `src/lib/motion.ts`, bloco `login-*` de `src/site/site.css`.
- Confirmado: cadastro público **fechado** (equipe cria usuários); recuperação
  de senha via `resetPasswordForEmail` → `/redefinir-senha`; erros genéricos
  anti-enumeração; stack Vite + React 19 + Tailwind v4, **sem Framer Motion**.

## Conceito visual adotado
"Vintec Operations Engine" — composição SVG em 4 camadas dentro de um painel
único integrado (não dois cards):
1. **Fundo** — navy profundo, grade técnica sutil (mascarada com fade), halo
   radial que respira. Sem partículas/estrelas.
2. **Fontes de dados** — 4 origens (Pedidos, Produtos, Estoque, Financeiro),
   distinção por ícone/forma, não por cor nova.
3. **Núcleo Vintec** — identidade própria: monograma **V**, dois anéis
   segmentados girando em sentidos opostos, 4 entradas convergentes que acendem
   na chegada dos pacotes, pontos de processamento internos. Máquina de
   organização, não planeta/cérebro.
4. **Saídas organizadas** — 3 sinais (Receita consolidada, Estoque sincronizado,
   Prioridade detectada) que se alinham em coluna + a frase "Operação conectada.
   Decisão clara."

## Decisões de animação
- **Motor 100% declarativo (CSS/SVG)**: uma timeline única de `--ope-cycle: 15s`
  coordena todas as camadas por **porcentagem de keyframe** (sem `animation-delay`
  entre elementos), garantindo sincronia e loop sem corte. Fases: ativação
  (0–10%) → entrada de dados (10–37%) → processamento (37–50%) → organização
  (50–72%) → respiração/saída (72–100%).
- Pacotes viajam com `offset-path: path()` (mesmo `d` da conexão) dentro de um
  `@supports (offset-path)` — navegador sem suporte apenas oculta os pacotes.
- Conexões desenhadas com `stroke-dashoffset` (+ `pathLength=1`). Anéis giram
  com `transform-box: fill-box`. Só `transform`/`opacity`/`offset-distance`/
  `stroke-dashoffset` (regras do motion-system).
- **JS mínimo** (`OperationsEngine.tsx`): (1) `useReducedMotion` de
  `src/lib/motion.ts`; (2) pausa por `visibilitychange` (uma troca de estado →
  `data-paused` → `animation-play-state: paused`); (3) parallax de cursor no
  desktop (rAF, escreve `--ope-px/--ope-py`, máx ~8px). Nenhum re-render por frame.
- Entrada do formulário em stagger curto via `staggerDelays(6, 70)` +
  `.login-enter` (só opacity/transform), sem atrasar o uso dos campos.

## Comportamento responsivo
- **Desktop ≥1024px**: 40/60, engine completo, parallax on.
- **900–1023px**: 42/58 lado a lado.
- **<900px (tablet estreito/mobile)**: coluna única. Ordem: marca (header) →
  núcleo compacto (versão `variant="compact"`, viewBox aproximada, só núcleo +
  2 fontes + 2 fluxos) → headline → formulário → ação comercial. Sem parallax.
  *Adaptação:* o brief previa 45/55 lado a lado no tablet; abaixo de 900px o
  form ficaria estreito demais, então optou-se por empilhar (compacto) — mais
  legível. A marca do card é ocultada no mobile (o header já a exibe).

## Regras de acessibilidade
- `prefers-reduced-motion`: composição **estática final** (fontes + conexões
  desenhadas + núcleo aceso + 3 sinais + frase), sem trajetórias/pacotes —
  mensagem preservada. Coberto por `.ope--static` (JS) **e** media query CSS.
- Engine é decorativo → `aria-hidden`. Formulário mantém labels reais
  (rótulo flutuante), foco visível, `autocomplete`, `aria-live` nos erros,
  toggle de senha acessível, autofill estilizado.

## Arquivos afetados
**Novos** — `src/site/components/operations-engine/`: `engineConfig.ts`,
`OperationsEngine.tsx`, `EngineBackground.tsx`, `EngineConnections.tsx`,
`DataSource.tsx`, `DataPacket.tsx`, `VintecCore.tsx`, `DecisionSignal.tsx`.
**Novos** — `src/site/components/login/`: `LoginField.tsx`, `LoginCommercialAction.tsx`.
**Alterados**: `src/pages/Login.tsx` (layout 40/60, remove screenshots
`PREVIEW_IMAGES`/`login-visual`, mantém 100% da lógica de auth), `src/site/site.css`
(shell 40/60, floating label, microinterações, stylesheet `.ope-*` + keyframes).

## Testes executados
- `tsc --noEmit`: limpo. `npm run build` (tsc + vite): limpo (Login 5.13 kB gzip).
- Playwright (chromium real) em 1440 / 820 / 390: **0 erros de console**,
  `imgCount=0` (nenhum print/mockup), `overflowX=false` em todas as larguras,
  campos e-mail/senha/submit presentes, engine visível no desktop e compacto no
  mobile. Rótulo flutuante sobe no foco/preenchido com glow discreto; view
  "Recuperar acesso" ok. Captura em `prefers-reduced-motion`: estado estático
  organizado correto. Screenshots no scratchpad da sessão.

## Pendências
- `whatsappDemoUrl()`/`whatsappAccessHelpUrl()` retornam `null` sem
  `VITE_WHATSAPP_*` no ambiente — no dev os blocos comercial/suporte se ocultam
  (comportamento correto). Configurar as env vars para exibi-los em produção.
- Login real com Supabase não foi exercido ponta a ponta (precisa de credencial
  de teste/instância); a lógica de `signIn`/`resetPassword` permaneceu intacta.

## Riscos
- `offset-path` exige navegador moderno (degrada ocultando pacotes) — documentado.
- Duas instâncias do engine no DOM (full + compact), uma sempre oculta por CSS —
  custo desprezível (poucos elementos, animações pausáveis).

## Próxima ação
Revisão visual do dono. Se aprovado: commit na branch
`feat/login-operations-engine` (sem push/deploy até autorização). Configurar
`VITE_WHATSAPP_*` para validar as ações comerciais.

---

## Adendo — Refinamento de UX/UI da home (mesma sessão)
Retomado o brief original de refinamento (itens além do login). Só refinamento,
sem alterar paleta/tipografia/estrutura de componentes.

**Alterações**
- **Hero** (`src/site/sections/Hero.tsx`): headline do slide 1 →
  "Decisões à altura do negócio que você está construindo."; os dois CTAs viraram
  um conjunto empilhado de **largura idêntica** (300px desktop / 100% mobile,
  mesma altura/padding/radius/tipografia) — largura estrita lado a lado quebraria
  os textos longos em PT-BR, então optou-se por empilhar; seta do primário
  desloca 3px no hover. Entrada do hero em **stagger** (eyebrow→título→sub→
  botões→microcopy), curta (~0,3s), via `.hero-fade > *` com delays.
- **MarketplaceRail** (`src/site/components/MarketplaceRail.tsx`): label
  "Integrações diretas" → "Especialistas nas principais plataformas do mercado"
  (autoridade, não venda de integração).
- **Menu** (`src/site/sections/SiteHeader.tsx` + `site.css`): underline animado +
  `translateY(-1px)` + cor, duração 280ms; **item ativo** por seção via
  `IntersectionObserver` (`is-active`/`aria-current`). Scroll suave já existia
  (`html.site-active { scroll-behavior: smooth }`, com guard reduced-motion).
- **Botão "Entrar"** (`.vt-header-btn-secondary`): borda sky mais elegante, glow
  discreto no hover (box-shadow só na transição), ícone desloca, feedback de
  clique (`:active` scale). Sem exagero.
- **Motion de cards / padronização**: primitivo único **reveal on scroll**
  (`.reveal` + `[data-reveal]`) com um observer em `SitePage.tsx` (fade +
  translateY + stagger por irmãos), aplicado aos painéis de `ServicesSection`.
  Extensível a outras seções com uma classe. Todos os tempos/easings usam os
  tokens `--s-dur-*` / `--s-ease-*`.
- **Performance/a11y**: só `transform`/`opacity`; `IntersectionObserver` (sem
  listener de scroll por frame); todas as microinterações com guard
  `prefers-reduced-motion`. Sem novas libs.

**Validação (Playwright real, 1440/390)**: 0 erros de console; headline e label
trocados; CTAs medidos **300×54 idênticos**; nav ativo = "Soluções" ao rolar até
a seção; reveal dispara (2 painéis); `overflowX=false` desktop e mobile; build +
tsc limpos. Screenshots: `home-hero.png`, `home-hero-mobile.png`,
`home-services.png`, `home-entrar-hover.png`.

**Adaptação**: "mesma largura" dos CTAs entregue empilhando-os (larguras iguais)
em vez de lado a lado — labels longos impediam igualdade lado a lado sem quebra.

**Nota**: os itens 7–8 do brief ("cards" em todo o site, padronização total) foram
atendidos com um **primitivo reutilizável** aplicado a Services; estender às demais
seções é trivial (adicionar `class="reveal" data-reveal`) e pode ser feito sob
demanda para não remexer seções fora de escopo.
