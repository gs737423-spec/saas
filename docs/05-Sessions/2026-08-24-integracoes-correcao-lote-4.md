# Correção de integrações — lote 4

## Resultado

- A sincronização VTEX continua reduzindo janelas OMS até uma página enquanto o intervalo ainda pode ser dividido.
- Quando a menor janela possível contém mais de 30 pedidos, o worker percorre até 20 páginas dentro da mesma invocação, mantendo a janela congelada.
- Offset de página não é persistido entre crons. Se faltar tempo, a microjanela reinicia e os upserts canônicos idempotentes absorvem reprocessamento sem duplicar pedidos.
- Acima de 20 páginas, a execução falha com `VTEX_ORDER_WINDOW_DENSE_PAGE_LIMIT` em vez de truncar dados.
- Taxas agora carregam cobertura explícita `known`, `partial` ou `unknown`. Apenas taxas conhecidas são somadas.
- Financeiro, composição, comparação por canal e extrato deixam de mostrar tarifa ou líquido incompleto como valor exato.
- A conexão VTEX mostra aviso quando a chave não possui permissão de Pricing.

## Segurança e escopo

- Nenhuma autenticação, credencial, RLS, tenant ou dado real foi alterado.
- Nenhuma migration nova foi criada ou aplicada.
- Nenhum commit, push ou deploy foi realizado.

## Validação

- TypeScript: passou.
- Testes focados iniciais: 39/39 passaram; o teste final de cobertura de taxas passou com 5/5 casos.
- Suíte completa final: 284/284 passaram em 40 arquivos.
- Scan de fronteira da service role: passou.
- Build: passou; aviso não bloqueante do chunk principal em aproximadamente 709 kB.
- Lint: não executado porque não existe script de lint no `package.json`.
- `git diff --check`: passou; somente avisos de normalização LF/CRLF do Git.

## Pendências reais

- O código deste lote ainda não está implantado; a conexão remota continuará exibindo o erro anterior até deploy e nova execução.
- A permissão de leitura de Pricing precisa ser concedida na conta VTEX; depois disso o catálogo deve ser reprocessado para preencher os 11.477 preços ausentes.
- A integração VTEX ainda precisa de smoke real após deploy para comprovar conclusão, freshness e preenchimento dos marcadores `last_seen_at`.
- Shopee ainda precisa ser validada com documentação autenticada e fixture real anonimizada.

## Deploy

- Projeto correto: `ia-center/saas` (plano Pro).
- Deployment: `dpl_9ayTQ5GRUmCnjnCw7cVQvoo1qeke`.
- URL do artefato: `https://saas-6ee3uur0d-ia-center.vercel.app`.
- Produção promovida: `https://www.mktonline.com.br`.
- Smoke: login MKTOnline carregou; API protegida respondeu `unauthorized` sem sessão; os dois endpoints de cron responderam `unauthorized` sem `CRON_SECRET`, comprovando configuração/proteção.
- Logs de erro após promoção: nenhum encontrado.
- Nenhum commit ou push foi realizado.

Status: **Implantado em produção — aguardando comprovação da sincronização VTEX no próximo ciclo real.**
