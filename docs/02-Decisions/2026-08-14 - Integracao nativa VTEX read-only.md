# Integração nativa VTEX read-only

Status: decisão local candidata; depende de staging e aprovação operacional.

## Decisão

Usar application keys (`appKey`/`appToken`) server-side, host derivado de account slug, sync persistido e resumível, Orders API para backfill/incremental temporário, fonte direta como autoridade de marketplace e VTEX como source provider capaz de transportar Loja Própria ou marketplaces explicitamente mapeados.

Feed v3 não será ativado até haver permissão, frequência, observabilidade e teste real compatíveis. A decisão anterior de excluir canais desconhecidos dos analytics foi superada pelo adendo de registry universal: pedido elegível continua nos totais globais, enquanto a resolução do canal permanece separada como `unresolved`. Dados sem fonte serão `N/D`, não zero ou estimativa.

Sales channel é uma dimensão tenant-scoped extensível em `sales_channels`. A identidade externa VTEX é registrada em `vtex_channel_mappings` por empresa e conexão. Novos affiliates não exigem enum, alteração de código ou migration; providers/conectores diretos continuam controlados separadamente.

## Consequências

- Migration 019 é aditiva e não deve ser aplicada direto em produção.
- O cron VTEX é separado e frequente para retomar jobs sem alterar ML/Shopee.
- A fonte e a chave canônica ficam explícitas, evitando dupla contagem.
- Magalu permanece provider/canal de primeira classe; VTEX Magalu e um futuro conector direto compartilham a identidade `magalu:{marketplaceOrderId}`.
- VTEX sem sinal suficiente cria `external:vtex:*`, permanece nos totais globais quando elegível, aparece como canal externo/unresolved no breakdown e nunca cai silenciosamente em Loja Própria.
- Reprocessar o mesmo pedido após criar um mapping reclassifica a origem existente; se um conector direto já venceu a identidade canônica, a linha anterior é marcada como reconciliada e excluída para evitar dupla contagem.
- PII bruta de pedido VTEX não é armazenada.
- Produção permanece bloqueada até migration/RLS/smoke tests reais.
