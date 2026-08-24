# SESSION-HANDOFF — Vintec home institucional

## Retomada atual — integrações, lote 8 e rollout (2026-08-24)

- Migrations `027`, `028` e `029` aplicadas e confirmadas no Supabase `dnaykdoehbwmbsufcrxk`; histórico local/remoto alinhado de `001` a `029` e `db lint --linked` sem erro.
- Persistência canônica de pedidos e reconciliação VTEX agora usam RPCs transacionais e tenant-scoped da migration `029`.
- Checkpoints VTEX preservam descoberta completa, falhas e cauda ainda não processada mesmo quando um catálogo de até 40 SKUs estoura o deadline durante o primeiro lote.
- Cron VTEX processa uma conexão por tick e prioriza run retomável; cron geral grava backoff em falhas precoces para não causar starvation.
- Mercado Livre não sobrescreve preço/estoque válidos quando a origem omite campos. Shopee falha fechada sem host oficial e não classifica retorno como cancelamento financeiro.
- Smoke remoto comprovou avanço VTEX de 14.175 para 17.312/17.728 SKUs. Um SKU removido entre listagem e detalhe retornou 404; o runtime agora trata esse churn como ausência reconciliável e limpa seletivamente a mensagem antiga quando o retry é resolvido.
- Gates locais finais: TypeScript passou; 318/318 testes passaram; scan de service role passou; build passou; `git diff --check` passou. Não há script de lint.
- Bloqueios externos conhecidos: nenhuma variável `SHOPEE_*` configurada no Vercel Pro; Amazon/Magalu/Loja Própria ainda não possuem conector nativo no repositório; VTEX Pricing depende de permissão da chave da conta.
- Status desta entrada: migrations aplicadas; commit/push/deploy e smoke de produção ainda em execução.

## Estado atual
- Branch de trabalho: `wip/vintec-institutional-redesign-v2` (criada de `main` = `b1f14aa`).
- `main` local e `origin/main` = `b1f14aa` (recuperada por fast-forward).
- Branch antiga `wip/vintec-home-redesign` (`f3af0fe`) **preservada, não mexida**.
- **Sem commit, sem push, sem deploy** nesta sessão.

## O que foi feito nesta retomada (escopo do brief)
1. Recuperação segura da `main` (`git switch main` + `pull --ff-only` → `33b70ca..b1f14aa`).
2. Nova branch `wip/vintec-institutional-redesign-v2`.
3. Auditoria da versão recuperada (evidências no chat).
4. **Removida a prévia da plataforma**: `PreviewSection` tirada da renderização e do import em `SitePage.tsx`. Nenhuma imagem/print de dashboard aparece mais na home (`hasPreview=false`, `hasDashboardImg=false` verificado). Arquivo `PreviewSection.tsx` continua no repo (não deletado — dead code removível depois).
5. **Hero corrigido** (`Hero.tsx` + `site.css`):
   - Slide 1: 4 balões com logos oficiais (Mercado Livre, Amazon, Shopee, Leroy Merlin), 128–190px, translúcidos claros, posições assimétricas.
   - Slides 2/3: chips de conceito (Conexão por API / Dados organizados / Canais conectados; Faturamento / Margem / Estoque).
   - 3 formas orgânicas por slide (2 preenchidas + 1 contorno), cores por slide.
   - Autoplay 5s (reinicia a contagem em troca manual), controles centralizados na base, pausa em hover / aba oculta, respeita `prefers-reduced-motion`.
   - Pessoas ancoradas na base; hero ~84–90vh no desktop; sem overflow.
6. **Header**: removido o símbolo (cubo). Marca só texto "Vintec".
7. **Quem Somos**: preservada (2ª seção), copy e métricas presentes.
8. **Métricas de demonstração**: marcadas `verified:false` / `source:null` em `content.tsx`. NÃO validadas, não publicar como fatos sem aprovação. Ainda renderizadas (placeholder).
9. Institucional (consultora, recorte transparente, fundo claro) preservada.

## Validação (real, via Playwright headless)
- Build (tsc + vite): limpo.
- Screenshots reais em 1440×900, 1366×768, 390×844, 360×800 (em `scratchpad/shots/out/`).
- DOM: `overflow=false` em todas as larguras; hero 84% (1440) / 90% (1366); 4 logos; 3 formas; sem preview; sem dashboard.

## Pendências / decisões para o dono
- `PreviewSection.tsx` virou dead code — deletar depois (site-only, não usado na área autenticada).
- Métricas placeholder: definir números reais antes de qualquer deploy.
- Home ainda longa (13→12 seções). Não foi mexido em serviços/FAQ/footer/form (fora do escopo desta sessão).
- Header símbolo: removido por decisão recorrente; reintroduzir logo oficial quando existir.

## Próximas ações sugeridas
- Revisão visual do dono nos screenshots.
- Se aprovado: commit na branch v2 (sem push/deploy até autorização).

---

## Sessão 2 — Master Prompt (direção criativa completa)

Skills citadas no master prompt (Impeccable, UI/UX Pro Max, Taste, Astryx) **não existem neste ambiente** — não instaladas, não simuladas. Único skill real: `ecom-saas-style`.

### Implementado nesta passada
1. **Tokens de cor oficiais** (`site.css`): `--vt-petroleum-950/900/800`, `--vt-teal-700..400`, `--vt-mint-400/300/200`, `--vt-blue-900/800`, `--vt-offwhite/surface/border/muted`. Aliases legados mantidos (evita quebrar componentes existentes).
2. **Hero**: gradiente oficial (radial mint + linear petróleo→teal), altura `clamp(700px,86svh,900px)`. Setas laterais reais (`top:50%`, 52px, fora do texto/pessoa) — antes só existiam dentro dos controles da base. Indicadores agora só dots na base. Balões de logo maiores (140–190px, min-height 62px).
3. **`siteMetrics.ts`** (`src/site/data/`): estrutura `SiteMetric{value,prefix,suffix,decimals,label,verified:false,source:null,showInProduction:false}`. Substituiu o array antigo duplicado em `content.tsx` (removida duplicação).
4. **`AnimatedMetric.tsx`**: contador real com `requestAnimationFrame` + easing, dispara via IntersectionObserver (com fallback scroll/rect), formata com `Intl.NumberFormat('pt-BR')`, preserva prefixo/sufixo/decimais, respeita `prefers-reduced-motion`, roda uma vez. Linha mint crescendo abaixo do número (`.metric-underline`).
5. **`EcosystemMarquee.tsx` reconstruída**: rede conectada (símbolo "V" central + 4 nós com logos oficiais `logoSrc` ligados por curvas SVG animadas `stroke-dashoffset`), marquee de reforço abaixo, faixa de confiança preservada. Mobile: fallback grid 2×2 com símbolo no topo (rede completa escondida <768px, conforme brief §23).

### Validado (Playwright real, headless instalado no scratchpad)
- Build tsc+vite: limpo. Console: 0 erros.
- Overflow: false em 1440/1366/390/360.
- Hero: 86% (1440) / 91% (1366) da viewport. 4 logos, 3 formas, sem preview/dashboard.
- Screenshots gerados e inspecionados visualmente (hero slide 1 com setas+logos+header text-only; rede de marketplaces completa com V central e 4 nós).

### NÃO implementado nesta passada (fora do tempo/escopo desta sessão — brief tem 43 seções)
- Divisor institucional com monograma (item 20).
- Seção "O que a Vintec organiza" reformulada como lista (não cards) — item 21.
- Serviços em composição assimétrica 1 grande + 3 pequenos (item 22) — mantém versão anterior (card vertical único).
- CTA humanizado com 4ª pessoa nova (item 26) — mantém banners existentes.
- Reorganização/consolidação de containers, breakpoints extras (1600/1280/1024).
- Altura total da página ainda ~7780px em 1440 (meta do brief: 5500–6800px) — não foram cortadas/fundidas seções.
- Formulário/FAQ/footer não tocados nesta passada.

### Confirmações
- Nenhum print/mockup/screenshot da plataforma na home (verificado por DOM).
- Nenhuma métrica falsa marcada como fato — `verified:false` estrutural.
- Sem commit, sem push, sem deploy nesta passada também.

---

## Sessão — Login redesign (2026-07-27), branch `feat/login-operations-engine`

### Estado do login
- Tela `/login` reescrita para **card central único** + ilustração animada
  **"Vintec Operation Run"** (personagem SVG correndo, coleta pedido/estoque/
  financeiro, entrega à estação Vintec, sinais organizados). Substituiu:
  screenshots da plataforma → (1ª tentativa) "Operations Engine" (diagrama técnico,
  **reprovado**) → Operation Run (atual, aprovado visualmente).
- **Lógica de autenticação Supabase inalterada** (signIn/resetPassword/cooldown/
  anti-enumeração em `Login.tsx`). Cadastro segue **fechado**; 2ª ação = "Solicitar
  demonstração" via `whatsappDemoUrl()` (oculta se `VITE_WHATSAPP_*` ausente).
- Componentes visuais em `src/site/components/operation-run/` (desacoplados da auth).
  Reutilizáveis mantidos: `LoginField`, `LoginCommercialAction`.
- Pasta antiga `operations-engine/` e o CSS `.ope-*` **removidos** (código morto).

### Também nesta branch (refinamento da home — brief anterior)
- Hero: headline "Decisões à altura do negócio que você está construindo."; 2 CTAs
  empilhados de largura igual; stagger de entrada.
- MarketplaceRail: label "Especialistas nas principais plataformas do mercado".
- Menu: microinterações + item ativo por seção (IntersectionObserver).
- Botão "Entrar" refinado. Reveal on scroll (`.reveal`/`[data-reveal]`) aplicado a
  ServicesSection (extensível às demais seções).

### Validação
- `tsc` + `npm run build` limpos (sem script de lint/testes no projeto).
- Playwright real (desktop/mobile/reduced-motion): 0 erros, sem overflow, sem
  screenshots no DOM, narrativa da corrida ok.

### Retomada 2026-07-28 — Fase 1 estática CONCLUÍDA
- O limite de contexto interrompeu a migração no meio: `Login.tsx` + componentes
  novos (`login/`, `login-motion/`) estavam salvos, mas `site.css` ficou
  **parcialmente migrado** (faixa `.lm-*` sem CSS, `.login-body` sem regra, CSS de
  2 colunas `.login-form-col`/`.login-illustration` e bloco morto `.scene-*` ainda
  presentes). A tela estava **quebrada** no working tree.
- Fechada a **Fase 1 estática** só em `src/site/site.css`: card virou **vertical
  real** (`flex-direction:column`, `max-width 460px`, removido o `@media` de 2
  colunas), adicionado `.login-body`, adicionado todo o CSS estático `.lm-*` da
  faixa, e **removidos** os CSS órfãos de 2 colunas + o bloco morto `.scene-*`
  (auditado: nenhum `.tsx` os referenciava). **Sem animação** — o corredor segue
  slot reservado "sprite (pendente)".
- Nenhum `.tsx` tocado nesta retomada; **auth Supabase intacta**.
- Validação: `npm run build` limpo (não há lint/test no projeto). Playwright real
  desktop 1440×900 + mobile 390×844: 0 erros de console, `flexDirection:column`,
  `max-width 460px`, sem duas colunas, sem overflow, sem `img` de plataforma.
  Capturas no scratchpad da sessão.
- **Commit local** na branch `feat/login-operations-engine`. **Sem push, sem
  deploy** (decisão do dono — aguarda revisão das capturas).

### Pendências
- Login válido ponta a ponta com Supabase + `VITE_WHATSAPP_*` em ambiente configurado.
- Aprovação visual do dono nas capturas antes de push/deploy.

---

## Sessão — Login "Vintec Expanding Access" (2026-07-28, tarde)

Nova direção do dono **substitui** a faixa Motion (Fase 1) e todas as tentativas
anteriores. Conceito: **card central compacto → interação → expansão fluida →
revelação do formulário**, tudo na mesma superfície.

### Feito
- **Removido**: `src/site/components/login-motion/` (6 arquivos) + CSS `.lm-*` e
  bloco morto `.scene-*` e o layout `.login-page/.login-card/...` antigo do login.
- **Criado**: `src/site/components/login-expanding/`
  - `ExpandingLoginCard.tsx` — máquina de estados visual + foco + reduced-motion +
    pausa da assinatura com aba oculta; renderiza o botão de recolher (canto).
  - `VintecSignature.tsx` — assinatura SVG própria (duas lâminas convergentes = V),
    respira/pulsa; sem lógica de auth.
  - `CollapsedLoginIntro.tsx` — botão "Entrar" (controle de abertura, aria-expanded/controls).
  - `ExpandedLoginContent.tsx` — texto de apoio + formulário (login/recuperação) +
    ação comercial + links legais; reusa `login/LoginField` e `login/LoginCommercialAction`.
  - `expanding-login.types.ts` — `LoginCardState` + `LoginBridge`.
- `Login.tsx` **reescrito** mantendo TODA a auth; passa um `bridge` ao card. Auth
  não foi movida nem alterada.
- CSS novo `.lx-*` em `site.css` com tokens (dimensões fechado/aberto, durações,
  easing, superfície, borda, glow). Campos `.login-*` mantidos (reaproveitados).
- **ResetPassword.tsx preservada**: as classes de layout que ela usava foram
  reescritas **escopadas em `.login-page`** (não colidem com `.lx-page`). Página
  não foi alterada; só o CSS que dava suporte a ela.

### Máquina de estados
`collapsed → expanding → (timer ~580ms) → expanded`; `expanded → closing →
(~540ms) → collapsed`. Abre por click/Enter/Space; **Escape recolhe só quando
`canClose`** (sem envio, sem erro, campos vazios, view=login). Foco: e-mail ao
abrir, botão "Entrar" ao fechar. Em `prefers-reduced-motion`, troca seca.

### Como expande sem layout instável
Card é o único item de um `grid place-items:center` num palco de altura fixa →
transicionar `width/height/border-radius` recentraliza sozinho **sem reflow de
vizinhos**. `overflow:hidden` clipa; o conteúdo aberto revela por `opacity/transform`
em stagger (delays CSS). Nenhuma lib de animação.

### Validação (real)
- `npm run build` (tsc+vite): **limpo**. (Projeto **sem** script de lint/test.)
- Playwright (chromium): estados fechado/abrindo/aberto (desktop 1440 + mobile 390),
  **9 breakpoints** (1536,1440,1366,1280,1024,768,430,390,360) **sem overflow**;
  **credencial inválida → erro real do Supabase** ("Não foi possível entrar com as
  credenciais informadas."); recuperação de senha, mostrar-senha, abertura por
  teclado (Enter→foco no e-mail) e reduced-motion OK; 0 erros/warnings de console.
  Capturas no scratchpad da sessão.
- **Sem commit. Sem push. Sem deploy.** Aguarda aprovação visual do dono.

### Pendências / observações
- Micro-refino possível após revisão: whitespace inferior do card no mobile (altura
  fixa aberta); tamanho/curvas da assinatura V; timing fino do stagger.
- Login válido ponta a ponta ainda depende de ambiente Supabase com credencial real.

---

## Sessão — Correção de integrações, lote 3 (2026-08-24)

- Implementados checkpoints persistentes para catálogo e histórico de pedidos em Mercado Livre/Shopee.
- Reconciliação de catálogo agora é tenant-scoped, não destrutiva e condicionada a ciclo completo sem erros acumulados.
- Freshness foi separada por catálogo, estoque e pedidos; leituras operacionais ignoram registros inativos.
- A migration `026_integration_continuity_and_product_identity.sql` foi aplicada e verificada no `vintec-production` em 2026-08-24.
- Nenhum commit, push, deploy ou alteração de dados reais foi realizado.
- A conexão VTEX remota permanece em `error`, sem sync concluído, por `VTEX_ORDER_WINDOW_DENSE_TIMESTAMP_UNSUPPORTED`.
- Próximo passo: corrigir a continuidade da OMS VTEX em microjanelas densas, depois fazer deploy controlado e smoke real.

---

## Sessão — Correção de integrações, lote 4 (2026-08-24)

- Corrigido localmente o bloqueio `VTEX_ORDER_WINDOW_DENSE_TIMESTAMP_UNSUPPORTED`: a divisão temporal continua sendo a primeira estratégia; no menor bucket, a OMS pode percorrer até 20 páginas na mesma invocação, sem persistir offset mutável entre crons.
- Em timeout, a microjanela reinicia e os upserts canônicos idempotentes impedem duplicação. Bucket acima do teto falha explicitamente com `VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT`, sem truncar pedidos.
- Criado contrato de cobertura de taxas `known/partial/unknown`; APIs financeiras somam somente valores informados e a UI não apresenta taxa ou líquido incompletos como zero/exatos.
- A tela VTEX agora alerta quando `permissions.pricing === false`; conceder a permissão continua sendo ação externa na conta VTEX.
- Validação local: TypeScript passou; 284/284 testes passaram; scan da service role passou; build passou com o aviso já conhecido do chunk principal (~709 kB). Não existe script de lint.
- Deploy realizado no projeto correto `ia-center/saas`: `dpl_9ayTQ5GRUmCnjnCw7cVQvoo1qeke`, promovido para `https://www.mktonline.com.br` em 2026-08-24.
- Smoke pós-deploy: login carregou a marca MKTOnline; API de dashboard exige sessão; crons VTEX e geral exigem `CRON_SECRET`; nenhum erro encontrado nos logs iniciais.
- Nenhum commit ou push foi realizado.
- Próxima ação: observar o próximo ciclo do cron e confirmar no Supabase se a VTEX saiu do erro denso; depois corrigir a permissão Pricing e reprocessar catálogo.

---

## Sessão — Correção de integrações, lote 5 financeiro P0 (2026-08-24)

- Cancelamento deixou de ser tratado como prova de reembolso nas APIs `summary` e `finance`; valores e contagens de devolução reais permanecem indisponíveis até existir ingestão explícita de eventos financeiros.
- Contratos financeiros agora expõem `refundDataStatus`. KPIs, composição, tabela por marketplace e rankings só apresentam líquido quando taxas e reembolsos têm cobertura completa.
- Lançamentos de estorno fabricados a partir de pedidos cancelados foram removidos do extrato real.
- Mercado Livre grava `sale_fee` como cobertura `partial`; dados históricos previamente marcados como `known` dependem de ressincronização ou backfill autorizado.
- Regressões adicionadas para impedir retorno do erro. Validação: typecheck passou; 287/287 testes passaram; build passou com aviso conhecido do chunk principal (~710 kB). Não há script de lint.
- Nenhuma migration, escrita em dados reais, commit, push ou deploy foi realizada neste lote.
- Monitoramento Supabase não foi repetido ao final porque a aba autenticada anterior já não estava disponível no navegador integrado.
- Próximo passo: auditar/integrar eventos reais de refunds por provedor e definir backfill seguro para o `fee_status` histórico do Mercado Livre.

---

## Sessão — Correção de integrações, lote 6 — reembolsos Mercado Livre (2026-08-24)

- Confirmado na documentação oficial que o payload de orders Mercado Livre contém `payments[].transaction_amount_refunded` e o status `partially_refunded`; esses dados estavam sendo descartados pelos tipos/mappers locais.
- Criada migration expand-only `027_order_refund_quality.sql` com `refund_amount`, `refund_status` e `refund_updated_at`, constraints de status/valor e sem backfill inventado. A migration não foi aplicada.
- Persistência canônica e syncs foram preparados: Mercado Livre grava a cobertura real; VTEX/Shopee gravam `unknown` explicitamente.
- APIs `summary` e `finance` agregam reembolsos apenas dos pedidos de receita com cobertura informada. O extrato só cria `Estorno` para valor conhecido e positivo; cancelamento continua sem qualquer papel no cálculo.
- Validação: typecheck passou; 295/295 testes passaram; service-role scan passou; build passou com aviso conhecido do chunk principal (~710 kB). Não há script de lint.
- Rollout obrigatório: migration 027 → verificação do schema → deploy → ressync Mercado Livre → smoke read-only. Rollback: reverter primeiro o runtime; remover colunas somente em etapa posterior explicitamente autorizada.
- Nenhuma migration, escrita em dados reais, commit, push ou deploy foi realizada.
- Próxima ação: revisar/aplicar a migration 027 com autorização; depois implementar a fonte VTEX via `GET /api/oms/pvt/orders/{orderId}/payment-transaction` com orçamento e permissão próprios.

---

## Sessão — Correção de integrações, lote 7 — rollout financeiro (2026-08-24)

- O vínculo Supabase foi restaurado para `dnaykdoehbwmbsufcrxk`; o histórico remoto confirmou 001–026 antes do rollout.
- A migration `027_order_refund_quality.sql` foi aplicada e verificada no remoto.
- Criada e aplicada a migration idempotente `028_correct_mercadolivre_fee_quality.sql`: pedidos históricos do Mercado Livre marcados como taxa `known` passam para `partial`, sem alterar `fee_amount`.
- A documentação oficial VTEX confirma o endpoint de transação por pedido, mas o contrato público consultado não comprova uma regra inequívoca para estornos. VTEX e Shopee permanecem `refund_status=unknown`; nenhum zero foi fabricado.
- Validação local após as migrations: typecheck passou; 296/296 testes passaram; service-role scan passou; build passou com aviso conhecido do chunk principal (~710 kB). Não existe script de lint.
- Vercel confirmado antes do deploy: equipe Pro `IA Center`, projeto `ia-center/saas`, project id `prj_b149YDjuDCPQ73H0xxbw0QljIIzm`.
- Próximo passo desta sessão: concluir revisão independente, commit/push, deploy no projeto correto, ressincronizar e validar logs/agregados.

---

## Sessão — Correção de integrações, lote 8 — bloqueios de qualidade (2026-08-24)

- O primeiro quality gate bloqueou o deploy com quatro P1 confirmados e riscos concorrentes. Todos os confirmados foram corrigidos antes da publicação.
- VTEX: finalize da conexão é comprovado antes do sucesso; 401/403 sai do fallback; descoberta parcial força paginação global; SKUs falhos e cauda não processada permanecem no retry; reconciliação exige travessia completa; stale threshold 6min > runtime 300s.
- Persistência canônica: migration `029` aplicada; pedido, precedência direct-provider, proveniência e itens são gravados em RPC transacional com advisory lock tenant-scoped. Reconciliação produto/estoque usa RPC transacional separada.
- Cron: falha precoce persiste backoff; o cron VTEX processa uma conexão por tick, priorizando run ativa e depois a conexão mais vencida.
- ML/Shopee: ausência de preço/estoque não vira zero; retorno Shopee não vira cancelamento; host Shopee de produção é obrigatório. Reconciliação destrutiva por ausência foi suspensa nesses dois conectores enquanto a paginação não representar snapshot estável.
- Produção Vercel possui Supabase, Mercado Livre e `CRON_SECRET`; não possui nenhuma variável `SHOPEE_*`. Shopee deve permanecer `config_missing` até receber credenciais reais.
- Validação final pré-deploy: typecheck PASS; 315/315 testes PASS; service-role scan PASS; build PASS; diff check PASS; migrations 001–029 alinhadas; Supabase db lint sem erros.
