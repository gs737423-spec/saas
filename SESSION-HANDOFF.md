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
