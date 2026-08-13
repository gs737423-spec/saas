---
type: session
project: SaaS E-commerce
date: 2026-08-13
status: completed
---

# Correcao de overflow do grafico Marketplaces

## Resultado

Em desktop, a pagina Marketplaces agora rola dentro do shell quando a altura disponivel nao comporta todo o grafico e o resumo. O plot recebeu altura maior; o tooltip nao e recortado e usa a superficie do tema ativo.

## Arquivos

- `src/index.css`
- `src/components/marketplaces/RevenueByChannelChart.tsx`
- `docs/01-Project/Current-State.md`

## Validacao

- `npm.cmd run build` passou.
- `git diff --check` passou.

## Proxima acao

- Validar visualmente no navegador em uma viewport de altura reduzida antes do proximo push.
