# SESSION-HANDOFF — Vintec home institucional

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
