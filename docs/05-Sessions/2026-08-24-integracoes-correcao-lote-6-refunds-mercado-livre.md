---
type: session
project: SaaS E-commerce
date: 2026-08-24
status: implemented-local-migration-pending
---

# Correção de integrações — lote 6: reembolsos Mercado Livre

## Evidência

- A documentação oficial de pedidos do Mercado Livre expõe `payments[].transaction_amount_refunded` e diferencia `partially_refunded`: https://developers.mercadolivre.com.br/pt_br/gerenciamento-de-vendas
- A documentação oficial também mostra que cancelamentos podem ocorrer sem pagamento, reforçando que `cancelled` não comprova reembolso.
- VTEX oferece a leitura de transação por `GET /api/oms/pvt/orders/{orderId}/payment-transaction`, mas o conector atual não consulta esse endpoint: https://developers.vtex.com/docs/api-reference/orders-api
- A definição Shopee local ainda contém TODO de validação contra a Open Platform autenticada; nenhum campo de refund foi inferido.

## Estado encontrado

- O tipo `MLOrder` descartava `payments`.
- `partially_refunded` não era normalizado como receita e desaparecia dos agregados `status=paid`.
- Não havia armazenamento idempotente para snapshot de reembolso por pedido.

## Implementação

- Migration expand-only `027_order_refund_quality.sql` adiciona valor, cobertura e timestamp do snapshot.
- `extractMercadoLivreRefund` soma somente campos válidos e explícitos, preserva cobertura parcial e seleciona o timestamp válido mais recente.
- Pedidos com reembolso confirmado permanecem `paid`; refund é dedução independente.
- Persistência canônica passa a aceitar refund; VTEX/Shopee permanecem explicitamente `unknown`.
- APIs agregam a cobertura por tenant/canal e só emitem linha de estorno para snapshot conhecido e positivo.

## Compatibilidade e rollback

1. Aplicar e verificar a migration 027 com o runtime antigo ainda ativo.
2. Publicar o runtime novo.
3. Ressincronizar Mercado Livre para preencher os snapshots.
4. Em rollback, reverter primeiro o runtime. As colunas aditivas podem permanecer sem impacto; qualquer `drop column` exige autorização posterior e janela própria.

O runtime novo não é compatível com banco sem a migration 027, pois a persistência inclui as novas colunas.

## Validações

- TypeScript: passou.
- Regressões direcionadas finais: 17/17 passaram.
- Suíte completa: 41 arquivos, 295/295 testes passaram.
- Service-role boundary scan: passou.
- Build: passou; aviso não bloqueante conhecido do chunk `App` (~710 kB).
- Lint: não executado; script inexistente.

## Estado de entrega

Migration não aplicada. Sem escrita em dados reais, commit, push ou deploy.
