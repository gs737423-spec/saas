# Sessão — integrações: lote 8 e rollout

Data: 2026-08-24

## Resultado

- Aplicadas e verificadas as migrations `027`, `028` e `029`; o remoto está alinhado com o repositório de `001` a `029`.
- A migration `029` tornou atômicas a persistência de pedido canônico/proveniência/itens e a reconciliação de catálogo.
- Corrigida continuidade VTEX em timeout, retry de SKU, descoberta por sales channel, propagação de 401/403, finalização tenant-scoped e disputa entre duração do worker e stale reclaim.
- O cron VTEX passou a selecionar apenas uma conexão por tick; falhas precoces do cron compartilhado agora persistem backoff.
- Mercado Livre preserva snapshots válidos quando preço ou estoque não vêm no payload. Shopee exige host oficial, preserva ausência de valores e separa retorno logístico de cancelamento financeiro.
- Reconciliação destrutiva foi desativada para os checkpoints mutáveis de Mercado Livre e Shopee até existir snapshot/cursor estável comprovado.

## Validação local

- TypeScript: passou.
- Testes: 43 arquivos, 318/318 passaram.
- Service-role boundary scan: passou.
- Build: passou; permanece apenas o aviso não bloqueante do chunk principal de aproximadamente 710 kB.
- `git diff --check`: passou; apenas avisos de normalização LF/CRLF.
- Lint: não executado porque não existe script `lint` no `package.json`.
- Supabase: migrations `001`–`029` alinhadas; `db lint --linked --level warning` sem erro.

## Riscos e lacunas externas

- O Vercel Pro não possui variáveis `SHOPEE_*`; o conector reporta configuração ausente e não usa sandbox silenciosamente.
- Amazon, Magalu e Loja Própria existem como canais canônicos, mas não possuem conectores nativos OAuth/sync neste repositório.
- Preços VTEX continuam dependentes da permissão de leitura de Pricing concedida à chave na conta do cliente.
- Smoke autenticado e observação dos ciclos reais do cron precisam ser registrados após o deploy.

## Status

O primeiro deployment de produção comprovou avanço do checkpoint VTEX de 14.175 para 17.312/17.728 SKUs. Um ID removido entre a listagem e o detalhe retornou 404; a correção complementar classifica esse caso como ausência reconciliável e remove seletivamente o erro antigo quando o retry é resolvido, permitindo que a reconciliação final desative o snapshot antigo sem reprovar a run.

Implementado — correção complementar aguardando rollout e novo ciclo real.
