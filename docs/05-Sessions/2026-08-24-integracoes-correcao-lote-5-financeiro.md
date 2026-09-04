---
type: session
project: SaaS E-commerce
date: 2026-08-24
status: implemented-local
---

# Correção de integrações — lote 5 financeiro P0

## Objetivo

Impedir que estados operacionais incompletos sejam apresentados como fatos financeiros: cancelamento não prova reembolso, e taxa parcial não prova valor líquido completo.

## Estado encontrado

- `api/dashboard/summary.ts` somava o valor integral de pedidos cancelados como devolução.
- `api/dashboard/finance.ts` somava cancelamentos como reembolsos e criava lançamentos `Estorno` artificiais.
- A interface escondia líquido quando taxas eram desconhecidas, mas não possuía contrato equivalente para cobertura de reembolsos.
- Mercado Livre persistia `sale_fee` como taxa totalmente conhecida, embora represente apenas parte das deduções possíveis.

## Implementação

- Adicionado `refundDataStatus: known | partial | unknown` aos contratos financeiro e executivo.
- Cancelamentos foram removidos dos agregados e do extrato de reembolsos.
- Enquanto não houver evento explícito de refund, o backend retorna total zero com cobertura `unknown`; a interface apresenta `Indisponível`.
- `hasKnownNetValue` centraliza a regra de que taxas e reembolsos devem estar completos antes de exibir líquido.
- Rankings de marketplace usam faturamento bruto quando as deduções não estão completas.
- O sync Mercado Livre passou a persistir `feeStatus: partial` para `sale_fee`.

## Validações

- `npm run typecheck`: passou.
- Testes direcionados: 11/11 passaram.
- `npm run test:run`: 40 arquivos, 287/287 testes passaram.
- `npm run build`: passou; permaneceu o aviso conhecido do chunk `App` acima de 500 kB (~710 kB).
- Lint: não executado, pois não existe script de lint no `package.json`.
- `git diff --check`: passou; somente avisos de normalização LF/CRLF do Git no Windows.

## Riscos e lacunas

- A plataforma ainda não ingere eventos explícitos de reembolso de VTEX, Mercado Livre ou Shopee; por isso o dado real permanece indisponível, não zero confirmado.
- Pedidos Mercado Livre já persistidos como `fee_status=known` não foram alterados, pois isso exigiria escrita em dados reais. Serão corrigidos por ressincronização ou por backfill separado e autorizado.
- Nenhum smoke remoto foi executado após este lote local.

## Estado de entrega

Sem commit, push, deploy, migration ou escrita em dados reais. Aguardando próximo lote.
