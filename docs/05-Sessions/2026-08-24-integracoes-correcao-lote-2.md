# Correção de integrações — lote 2

## Resultado

- Bloqueada troca silenciosa de conta externa em Mercado Livre, Shopee e VTEX.
- Preservados metadados VTEX ao reconectar a mesma conta.
- Marca oficial normalizada para Mercado Livre, Shopee e VTEX.
- Adicionados campos aditivos de checkpoint, freshness por domínio, marca, `last_seen_at` e `active` na migration local `026`.
- Links novos do Produto 360 usam `connection_id + external_product_id`; o fallback por SKU existe apenas para URLs legadas.
- Busca de catálogo Mercado Livre usa o cursor oficial `search_type=scan`/`scroll_id`, evitando paginação profunda por offset acima de 1.000 itens.

## Validação

- TypeScript: passou após as alterações.
- Testes: 274/274 passaram.
- Scan de fronteira da service role: passou.
- Build: passou; permanece aviso não bloqueante do chunk principal em aproximadamente 707 kB.
- `git diff --check`: passou; apenas avisos locais de conversão LF/CRLF.

## Migration pendente

- `026_integration_continuity_and_product_identity.sql`

As migrations anteriores `024` e `025` foram aplicadas e verificadas no `vintec-production`; a `026` não foi executada. Não houve commit, push ou deploy.

## Lacunas para o próximo lote

- Consumir checkpoints históricos persistentes em Mercado Livre e Shopee.
- Reconciliar anúncios removidos somente após ciclo completo comprovado.
- Expor freshness independente de catálogo, estoque e pedidos nas APIs/telas.
- Validar contratos Shopee contra documentação autenticada de parceiro e executar smoke com fixtures autorizadas.
