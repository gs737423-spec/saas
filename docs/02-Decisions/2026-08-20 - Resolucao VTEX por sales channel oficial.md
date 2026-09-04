---
type: decision
project: SaaS E-commerce
status: approved-in-working-tree
date: 2026-08-20
---

# Resolução VTEX por sales channel oficial

## Contexto

Pedidos VTEX preservam `affiliate_id` e `external_sales_channel` em
`order_source_refs`. Alguns affiliates não possuem nome útil no endpoint de
affiliates, embora o catálogo VTEX possua nome oficial para o sales channel
relacionado.

## Decisão

Um affiliate pendente pode ser resolvido automaticamente somente quando:

1. pedidos reais da mesma empresa e conexão comprovam a relação;
2. os sales channels observados convergem para um único nome oficial VTEX;
3. não existe mapping manual ou resolução anterior concorrente.

A sigla do affiliate nunca determina o canal. Relações ambíguas ou ausentes
permanecem pendentes. O update automático usa compare-and-set e a descoberta
tem orçamento próprio para não bloquear o checkpoint do catálogo.

## Consequências

- canais reais aparecem sem exigir configuração manual repetitiva;
- marketplaces não são inventados por sigla;
- escolha manual continua soberana;
- pedidos e analytics locais podem ser reclassificados sem escrita na VTEX;
- nenhuma migration é necessária.
