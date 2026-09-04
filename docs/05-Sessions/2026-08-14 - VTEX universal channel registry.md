# VTEX universal channel registry

Data: 2026-08-14
Escopo: correção local da migration 019 e do fluxo VTEX; nenhum SQL remoto executado.

## O que foi feito

- A dimensão `sales_channel` deixou de ser tratada como lista fechada.
- Foram adicionados `sales_channels` e `vtex_channel_mappings`, ambos tenant-scoped.
- Affiliate/canal VTEX desconhecido passa a criar identidade `external:vtex:*`, com estado `unresolved`.
- Pedidos unresolved elegíveis permanecem nos totais globais e no breakdown, sem virar Loja Própria.
- Sync registra descoberta sanitizada e contabiliza canais descobertos/resolvidos/unresolved sem transformar novidade comercial em erro.
- Reprocessamento após mapping reutiliza a source reference e evita nova venda analítica.
- APIs e gráfico diário aceitam canais dinâmicos; apresentação limita excesso visual a Top 3 + Outros.

## Decisões e rejeições

- Decisão: provider/source continua controlado; sales channel é extensível.
- Decisão: mappings VTEX pertencem à empresa e conexão, nunca são herdados entre tenants.
- Rejeitado: `unknown = loja_propria`.
- Rejeitado: excluir receita válida apenas porque o mapping está pendente.
- Rejeitado: enum/check fechado de canais e affiliate IDs globais hardcoded.
- Rejeitado: criar provider direto automaticamente para marketplace observado via VTEX.

## Feedback e aprendizado proposto

Classificação: regra de projeto + decisão arquitetural + antipadrão preventivo.

Regra derivada proposta: validade analítica do pedido e resolução do canal são dimensões independentes. Canal externo novo é dado válido, não corrupção; deve preservar provenance, continuar nos totais elegíveis e permanecer unresolved até mapping confiável.

Teste preventivo: canal arbitrário precisa entrar sem migration, não falhar o sync, não virar Loja Própria, aparecer no breakdown, manter receita global e ser reclassificável sem duplicação.

Promoção para a memória oficial do Venture OS: pendente de aprovação explícita. O ambiente atual não autoriza escrita fora do workspace; por isso a proposta foi registrada somente neste log de projeto.

## Evals e validações

- `npm.cmd run typecheck`: PASS.
- Testes direcionados: 39/39 PASS.
- `npm.cmd run test:run`: 109/109 PASS em 13 arquivos.
- `npm.cmd run security:check`: PASS; 61 testes de segurança, service-role scan e build.
- Build: PASS; 1.929 módulos.
- Migration/preflight/verify: inspeção estática e testes; não executados em banco.

## Próxima ação

Executar somente o pre-flight read-only autorizado em staging, revisar inventário/histórico real de migrations e então decidir separadamente sobre a aplicação da 019. UI completa de revisão de canais descobertos permanece fase futura.
